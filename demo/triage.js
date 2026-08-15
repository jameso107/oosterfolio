// TRIAGE: Flight Edition
// Deterministic layer: fleet statistics and flags, computed entirely client-side.
// Narrative layer: cached outputs by default; a server-side API route in live mode.
// Human-in-the-loop: every disposition is recorded. TRIAGE advises, humans decide.
(function () {
    'use strict';

    var CONFIG = {
        DEMO_NAME: 'TRIAGE: Flight Edition', // one constant to rename the demo
        Z_THRESHOLD: 2.5,
        LIVE_ENDPOINT: '/api/narrative',
        STORAGE_KEY: 'triage-dispositions-v1'
    };

    var METRICS = [
        { key: 'duration_s', label: 'Duration', unit: 's' },
        { key: 'altitude_m', label: 'Max altitude', unit: 'm' },
        { key: 'distance_m', label: 'Distance', unit: 'm' },
        { key: 'speed_ms', label: 'Max groundspeed', unit: 'm/s' }
    ];

    var flights = window.TRIAGE_FLIGHTS || [];
    var cachedNarratives = window.TRIAGE_CACHED || {};
    var goldenSet = window.TRIAGE_GOLDEN || [];

    // ---------- Deterministic layer ----------

    function median(values) {
        var s = values.slice().sort(function (a, b) { return a - b; });
        var mid = Math.floor(s.length / 2);
        return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
    }

    var fleetStats = {};
    METRICS.forEach(function (m) {
        var vals = flights.map(function (f) { return f[m.key]; });
        var med = median(vals);
        var mad = median(vals.map(function (v) { return Math.abs(v - med); }));
        fleetStats[m.key] = { median: med, sigma: 1.4826 * mad };
    });

    function zScore(flight, key) {
        var s = fleetStats[key];
        return s.sigma ? (flight[key] - s.median) / s.sigma : 0;
    }

    var EVENT_RULES = [
        { re: /glitch|oscillat/i, flag: 'In-flight navigation event in the record' },
        { re: /lost communication|lost contact|loss of communication/i, flag: 'In-flight communications loss in the record' },
        { re: /contingency landing|LAND_NOW|terminated early|cut short/i, flag: 'Flight ended early per the record' },
        { re: /flew only/i, flag: 'Flight fell short of its plan per the record' }
    ];
    var ABORT_RE = /fail|abort|cancel|postpon|delay|reject/i;

    function analyzeFlight(f) {
        var metricFlags = [];
        METRICS.forEach(function (m) {
            var z = zScore(f, m.key);
            if (Math.abs(z) >= CONFIG.Z_THRESHOLD) {
                metricFlags.push({
                    metric: m,
                    z: z,
                    text: m.label + ' ' + (z > 0 ? 'above' : 'below') + ' fleet envelope (z = ' + z.toFixed(2) + ')'
                });
            }
        });
        var eventFlags = [];
        EVENT_RULES.forEach(function (rule) {
            if (rule.re.test(f.summary || '')) eventFlags.push(rule.flag);
        });
        if (f.note && ABORT_RE.test(f.note)) {
            eventFlags.push('Pre-flight abort or delay in the record');
        } else if (f.note) {
            eventFlags.push('Pre-flight checkout noted in the record');
        }
        return {
            metricFlags: metricFlags,
            eventFlags: eventFlags,
            flagged: metricFlags.length > 0 || eventFlags.some(function (e) { return e.indexOf('checkout') === -1; })
        };
    }

    var analyses = {};
    flights.forEach(function (f) { analyses[f.flight] = analyzeFlight(f); });

    // ---------- Prompt builder (shown in traces, sent in live mode) ----------

    var SYSTEM_PROMPT = 'You are the narrative layer of ' + CONFIG.DEMO_NAME + ', a public demo of a root cause analysis pattern for Mars helicopter flight data. A deterministic layer has already computed fleet statistics and flags; your job is to turn those flags into a short, plain-language root cause narrative a reviewing engineer can accept, edit, or reject. Rules: never compute, re-derive, or invent numbers; repeat provided numbers verbatim or describe them qualitatively. Ground every claim in the provided flags and record notes. Choose exactly one category from: nominal, planned-deviation, operational-incident, navigation-anomaly, communications-loss, early-termination. Set confidence to low, medium, or high based on how completely the record explains the flags. Keep the narrative to 2 to 4 sentences.';

    function buildUserPrompt(f) {
        var a = analyses[f.flight];
        var lines = [];
        lines.push('Flight ' + f.flight + ' (' + f.date + ', Sol ' + f.sol + ').');
        lines.push('');
        lines.push('Metrics vs fleet envelope (median and MAD over all 72 flights, flag threshold |z| >= ' + CONFIG.Z_THRESHOLD + '):');
        METRICS.forEach(function (m) {
            lines.push(m.label + ': ' + f[m.key] + ' ' + m.unit + ' (robust z = ' + zScore(f, m.key).toFixed(2) + ')');
        });
        lines.push('');
        lines.push('Deterministic flags:');
        var all = a.metricFlags.map(function (mf) { return mf.text; }).concat(a.eventFlags);
        if (all.length) {
            all.forEach(function (t) { lines.push('- ' + t); });
        } else {
            lines.push('- none');
        }
        lines.push('');
        lines.push('Public record notes: ' + (f.summary || 'none'));
        if (f.note) lines.push('Pre-flight events: ' + f.note);
        lines.push('');
        lines.push('Write the root cause narrative.');
        return lines.join('\n');
    }

    // ---------- State ----------

    var state = {
        metricKey: 'duration_s',
        selectedFlight: 6,
        mode: 'cached',
        liveResults: {},
        dispositions: loadDispositions()
    };

    function loadDispositions() {
        try {
            return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY)) || {};
        } catch (e) {
            return {};
        }
    }

    function saveDispositions() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.dispositions));
        } catch (e) { /* private browsing: dispositions just do not persist */ }
    }

    function getNarrative(flightNo) {
        if (state.mode === 'live' && state.liveResults[flightNo]) {
            return state.liveResults[flightNo];
        }
        var c = cachedNarratives[String(flightNo)];
        return c ? { category: c.category, confidence: c.confidence, narrative: c.narrative, cached: true } : null;
    }

    // ---------- Chart ----------

    var COLORS = { nominal: '#3E8FD9', flagged: '#B58900', surface: '#001A33' };
    var chartEl = document.getElementById('chart');
    var tooltipEl = document.getElementById('chart-tooltip');

    function niceTicks(min, max, count) {
        var span = max - min || 1;
        var step = Math.pow(10, Math.floor(Math.log10(span / count)));
        var err = (span / count) / step;
        if (err >= 7.5) step *= 10;
        else if (err >= 3.5) step *= 5;
        else if (err >= 1.5) step *= 2;
        var ticks = [];
        for (var v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) {
            ticks.push(Math.round(v * 1000) / 1000);
        }
        return ticks;
    }

    function svgEl(tag, attrs) {
        var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
        Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, attrs[k]); });
        return el;
    }

    function renderChart() {
        var metric = METRICS.filter(function (m) { return m.key === state.metricKey; })[0];
        var stats = fleetStats[metric.key];
        var W = 640, H = 340;
        var pad = { top: 16, right: 14, bottom: 34, left: 52 };
        var iw = W - pad.left - pad.right;
        var ih = H - pad.top - pad.bottom;

        var values = flights.map(function (f) { return f[metric.key]; });
        var lo = Math.min.apply(null, values.concat([stats.median - CONFIG.Z_THRESHOLD * stats.sigma]));
        var hi = Math.max.apply(null, values.concat([stats.median + CONFIG.Z_THRESHOLD * stats.sigma]));
        lo = Math.min(0, lo);
        hi = hi * 1.06;

        function x(flightNo) { return pad.left + ((flightNo - 1) / 71) * iw; }
        function y(v) { return pad.top + ih - ((v - lo) / (hi - lo)) * ih; }

        chartEl.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        chartEl.innerHTML = '';

        // Envelope band
        var bandTop = Math.max(pad.top, y(stats.median + CONFIG.Z_THRESHOLD * stats.sigma));
        var bandBot = Math.min(pad.top + ih, y(Math.max(lo, stats.median - CONFIG.Z_THRESHOLD * stats.sigma)));
        chartEl.appendChild(svgEl('rect', {
            x: pad.left, y: bandTop, width: iw, height: Math.max(0, bandBot - bandTop),
            fill: 'rgba(255,255,255,0.06)'
        }));
        chartEl.appendChild(svgEl('line', {
            x1: pad.left, x2: pad.left + iw, y1: y(stats.median), y2: y(stats.median),
            stroke: 'rgba(255,255,255,0.4)', 'stroke-width': 1, 'stroke-dasharray': '5 4'
        }));

        // Grid + y axis labels
        niceTicks(lo, hi, 5).forEach(function (t) {
            chartEl.appendChild(svgEl('line', {
                x1: pad.left, x2: pad.left + iw, y1: y(t), y2: y(t),
                stroke: 'rgba(255,255,255,0.07)', 'stroke-width': 1
            }));
            var lbl = svgEl('text', {
                x: pad.left - 8, y: y(t) + 4, 'text-anchor': 'end',
                fill: 'rgba(255,255,255,0.6)', 'font-size': '11', 'font-family': 'Inter, sans-serif'
            });
            lbl.textContent = t;
            chartEl.appendChild(lbl);
        });

        // X axis labels every 8 flights
        [1, 9, 17, 25, 33, 41, 49, 57, 65, 72].forEach(function (n) {
            var lbl = svgEl('text', {
                x: x(n), y: pad.top + ih + 20, 'text-anchor': 'middle',
                fill: 'rgba(255,255,255,0.6)', 'font-size': '11', 'font-family': 'Inter, sans-serif'
            });
            lbl.textContent = 'F' + n;
            chartEl.appendChild(lbl);
        });
        var axisLbl = svgEl('text', {
            x: pad.left + iw / 2, y: H - 2, 'text-anchor': 'middle',
            fill: 'rgba(255,255,255,0.45)', 'font-size': '11', 'font-family': 'Inter, sans-serif'
        });
        axisLbl.textContent = 'Flight number';
        chartEl.appendChild(axisLbl);
        var yAxisLbl = svgEl('text', {
            x: 14, y: pad.top + ih / 2, fill: 'rgba(255,255,255,0.45)', 'font-size': '11',
            'font-family': 'Inter, sans-serif',
            transform: 'rotate(-90 14 ' + (pad.top + ih / 2) + ')', 'text-anchor': 'middle'
        });
        yAxisLbl.textContent = metric.label + ' (' + metric.unit + ')';
        chartEl.appendChild(yAxisLbl);

        // Marks: circles for in-envelope flights, diamonds for flagged, 2px surface ring
        flights.forEach(function (f) {
            var a = analyses[f.flight];
            var cx = x(f.flight);
            var cy = y(f[metric.key]);
            var isSelected = f.flight === state.selectedFlight;
            var mark;
            if (a.flagged) {
                var r = isSelected ? 7 : 5;
                mark = svgEl('rect', {
                    x: cx - r, y: cy - r, width: r * 2, height: r * 2, rx: 1.5,
                    transform: 'rotate(45 ' + cx + ' ' + cy + ')',
                    fill: COLORS.flagged, stroke: isSelected ? '#FFFFFF' : COLORS.surface, 'stroke-width': 2
                });
            } else {
                mark = svgEl('circle', {
                    cx: cx, cy: cy, r: isSelected ? 7 : 4.5,
                    fill: COLORS.nominal, stroke: isSelected ? '#FFFFFF' : COLORS.surface, 'stroke-width': 2
                });
            }
            mark.setAttribute('data-flight', f.flight);
            mark.setAttribute('class', 'chart-mark');
            mark.style.cursor = 'pointer';
            chartEl.appendChild(mark);
            // Bigger invisible hit target
            var hit = svgEl('circle', { cx: cx, cy: cy, r: 10, fill: 'transparent' });
            hit.setAttribute('data-flight', f.flight);
            hit.style.cursor = 'pointer';
            chartEl.appendChild(hit);
        });
    }

    function chartPointerHandler(e) {
        var t = e.target;
        var flightNo = t.getAttribute && t.getAttribute('data-flight');
        if (!flightNo) { hideTooltip(); return; }
        var f = flights[Number(flightNo) - 1];
        if (e.type === 'pointerdown' || e.type === 'click') {
            selectFlight(f.flight);
            hideTooltip();
            return;
        }
        var metric = METRICS.filter(function (m) { return m.key === state.metricKey; })[0];
        var z = zScore(f, metric.key);
        tooltipEl.innerHTML = '<strong>Flight ' + f.flight + '</strong> (' + f.date + ')<br>' +
            metric.label + ': ' + f[metric.key] + ' ' + metric.unit + '<br>robust z = ' + z.toFixed(2) +
            (analyses[f.flight].flagged ? '<br>Flagged by deterministic layer' : '');
        tooltipEl.hidden = false;
        var wrap = chartEl.parentElement.getBoundingClientRect();
        var left = e.clientX - wrap.left + 12;
        var top = e.clientY - wrap.top - 10;
        if (left > wrap.width - 200) left -= 220;
        tooltipEl.style.left = left + 'px';
        tooltipEl.style.top = top + 'px';
    }

    function hideTooltip() { tooltipEl.hidden = true; }

    // ---------- Flight detail ----------

    var detailEl = document.getElementById('detail-card');

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
    }

    function renderDetail() {
        var f = flights[state.selectedFlight - 1];
        var a = analyses[f.flight];
        var n = getNarrative(f.flight);
        var dispo = state.dispositions[f.flight];

        var html = '';
        html += '<h2>Flight ' + f.flight + '</h2>';
        html += '<p class="detail-sub">' + esc(f.date) + ' &middot; Sol ' + f.sol + (f.phase ? ' &middot; ' + esc(f.phase) : '') + '</p>';
        html += '<div class="record-block"><strong>Public record.</strong> ' + esc(f.summary) + '</div>';
        if (f.note) {
            html += '<div class="record-block"><strong>Pre-flight events.</strong> ' + esc(f.note) + '</div>';
        }

        html += '<table class="metric-table"><thead><tr><th scope="col">Metric</th><th scope="col">Value</th><th scope="col">Robust z</th><th scope="col">Envelope</th></tr></thead><tbody>';
        METRICS.forEach(function (m) {
            var z = zScore(f, m.key);
            var out = Math.abs(z) >= CONFIG.Z_THRESHOLD;
            html += '<tr><td>' + m.label + '</td><td>' + f[m.key] + ' ' + m.unit + '</td><td>' + z.toFixed(2) + '</td>' +
                '<td class="' + (out ? 'status-flag' : 'status-ok') + '">' + (out ? (z > 0 ? 'High' : 'Low') : 'In') + '</td></tr>';
        });
        html += '</tbody></table>';

        html += '<div class="flag-chips">';
        var allFlags = a.metricFlags.map(function (mf) { return mf.text; }).concat(a.eventFlags);
        if (allFlags.length) {
            allFlags.forEach(function (t) {
                var neutral = t.indexOf('checkout') !== -1;
                html += '<span class="flag-chip' + (neutral ? ' neutral' : '') + '">' + esc(t) + '</span>';
            });
        } else {
            html += '<span class="flag-chip neutral">No deterministic flags</span>';
        }
        html += '</div>';

        // Narrative
        html += '<div class="narrative-box">';
        html += '<div class="narrative-head">';
        if (n && n.cached) html += '<span class="badge">Cached demo output</span>';
        if (n && !n.cached) html += '<span class="badge live">Live: ' + esc(n.model || 'model') + '</span>';
        if (n) {
            html += '<span class="category-pill">' + esc(n.category) + '</span>';
            html += '<span class="confidence">confidence: ' + esc(n.confidence) + '</span>';
        }
        html += '</div>';
        html += '<p class="narrative-text" id="narrative-text">' + (n ? esc(n.narrative) : 'No narrative available.') + '</p>';
        html += '</div>';

        // Disposition
        if (dispo) {
            var when = new Date(dispo.at).toLocaleString();
            html += '<div class="dispo-status' + (dispo.action === 'rejected' ? ' rejected' : '') + '">' +
                'You <strong>' + esc(dispo.action) + '</strong> this narrative (' + esc(when) + ').' +
                (dispo.editedText ? '<br>Your edit: ' + esc(dispo.editedText) : '') +
                ' <button type="button" class="ghost-btn" id="undo-dispo">Undo</button></div>';
        } else {
            html += '<div class="disposition-row">' +
                '<button type="button" class="dispo-btn dispo-accept" id="dispo-accept">Accept</button>' +
                '<button type="button" class="dispo-btn dispo-edit" id="dispo-edit">Edit</button>' +
                '<button type="button" class="dispo-btn dispo-reject" id="dispo-reject">Reject</button>' +
                '</div>' +
                '<div id="edit-zone"></div>';
        }

        if (state.mode === 'live') {
            html += '<div id="live-zone">' +
                '<button type="button" class="dispo-btn dispo-edit" id="run-live">Generate live narrative</button>' +
                '<p class="live-note">Calls a server-side API route (the key never reaches the browser), rate-limited to 10 per hour. If the call fails for any reason, the cached narrative above keeps working.</p>' +
                '<div id="live-status"></div></div>';
        }

        detailEl.innerHTML = html;

        var acceptBtn = document.getElementById('dispo-accept');
        if (acceptBtn) acceptBtn.addEventListener('click', function () { setDisposition(f.flight, 'accepted'); });
        var rejectBtn = document.getElementById('dispo-reject');
        if (rejectBtn) rejectBtn.addEventListener('click', function () { setDisposition(f.flight, 'rejected'); });
        var editBtn = document.getElementById('dispo-edit');
        if (editBtn) {
            editBtn.addEventListener('click', function () {
                var zone = document.getElementById('edit-zone');
                var current = n ? n.narrative : '';
                zone.innerHTML = '<textarea class="edit-area" id="edit-text" aria-label="Edit the narrative">' + esc(current) + '</textarea>' +
                    '<button type="button" class="dispo-btn dispo-accept" id="save-edit">Save edit</button>';
                document.getElementById('save-edit').addEventListener('click', function () {
                    var txt = document.getElementById('edit-text').value;
                    setDisposition(f.flight, 'edited', txt);
                });
            });
        }
        var undoBtn = document.getElementById('undo-dispo');
        if (undoBtn) undoBtn.addEventListener('click', function () {
            delete state.dispositions[f.flight];
            saveDispositions();
            renderDetail();
            renderReviewLog();
        });
        var liveBtn = document.getElementById('run-live');
        if (liveBtn) liveBtn.addEventListener('click', function () { runLive(f); });
    }

    function setDisposition(flightNo, action, editedText) {
        state.dispositions[flightNo] = { action: action, editedText: editedText || null, at: Date.now() };
        saveDispositions();
        renderDetail();
        renderReviewLog();
    }

    function selectFlight(flightNo) {
        state.selectedFlight = flightNo;
        document.getElementById('flight-select').value = String(flightNo);
        renderChart();
        renderDetail();
    }

    // ---------- Live mode ----------

    function runLive(f) {
        var statusEl = document.getElementById('live-status');
        statusEl.innerHTML = '<p class="notice"><span class="spinner" aria-hidden="true"></span>Calling the model...</p>';
        var a = analyses[f.flight];
        var payload = {
            flight: f.flight,
            date: f.date,
            sol: f.sol,
            metrics: METRICS.map(function (m) {
                return { label: m.label, unit: m.unit, value: f[m.key], z: zScore(f, m.key) };
            }),
            flags: a.metricFlags.map(function (mf) { return mf.text; }).concat(a.eventFlags),
            summary: f.summary,
            note: f.note || ''
        };
        fetch(CONFIG.LIVE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(function (res) {
            return res.json().then(function (data) { return { ok: res.ok, data: data }; });
        }).then(function (result) {
            if (result.ok && result.data && result.data.narrative) {
                state.liveResults[f.flight] = {
                    category: result.data.category,
                    confidence: result.data.confidence,
                    narrative: result.data.narrative,
                    model: result.data.model,
                    cached: false
                };
                delete state.dispositions[f.flight];
                saveDispositions();
                renderDetail();
                renderReviewLog();
            } else {
                statusEl.innerHTML = '<p class="notice">' + esc((result.data && result.data.error) || 'The live call failed.') + ' Showing the cached narrative above.</p>';
            }
        }).catch(function () {
            statusEl.innerHTML = '<p class="notice">Could not reach the live endpoint. Showing the cached narrative above.</p>';
        });
    }

    // ---------- Review log ----------

    function renderReviewLog() {
        var el = document.getElementById('review-log');
        var keys = Object.keys(state.dispositions).sort(function (a, b) {
            return state.dispositions[b].at - state.dispositions[a].at;
        });
        if (!keys.length) {
            el.innerHTML = '<p class="muted">No dispositions yet. Pick a flight and accept, edit, or reject its narrative.</p>';
            return;
        }
        var html = '';
        keys.forEach(function (k) {
            var d = state.dispositions[k];
            html += '<div class="log-entry"><span class="log-flight">Flight ' + esc(k) + '</span>' +
                '<span>' + esc(d.action) + '</span>' +
                '<span class="muted">' + esc(new Date(d.at).toLocaleString()) + '</span></div>';
        });
        el.innerHTML = html;
    }

    // ---------- Data table ----------

    function renderDataTable() {
        var el = document.getElementById('data-table');
        var html = '<table><thead><tr><th scope="col">Flight</th><th scope="col">Date</th><th scope="col">Sol</th>';
        METRICS.forEach(function (m) { html += '<th scope="col">' + m.label + ' (' + m.unit + ')</th>'; });
        html += '<th scope="col">Flags</th></tr></thead><tbody>';
        flights.forEach(function (f) {
            var a = analyses[f.flight];
            html += '<tr><td>F' + f.flight + '</td><td>' + esc(f.date) + '</td><td>' + f.sol + '</td>';
            METRICS.forEach(function (m) { html += '<td>' + f[m.key] + '</td>'; });
            html += '<td>' + (a.flagged ? 'Flagged' : 'In envelope') + '</td></tr>';
        });
        html += '</tbody></table>';
        el.innerHTML = html;
    }

    // ---------- Evals ----------

    function renderEvals() {
        var total = goldenSet.length;
        var matches = 0;
        var judgeSum = 0;
        var passing = 0;
        goldenSet.forEach(function (g) {
            var predicted = cachedNarratives[String(g.flight)];
            if (predicted && predicted.category === g.expected_category) matches += 1;
            judgeSum += g.judge.score;
            if (g.judge.pass) passing += 1;
        });

        var tiles = document.getElementById('eval-tiles');
        tiles.innerHTML =
            '<div class="tile"><div class="tile-value">' + total + '</div><div class="tile-label">Golden set cases, labeled from the public record</div></div>' +
            '<div class="tile"><div class="tile-value">' + Math.round((matches / total) * 100) + '%</div><div class="tile-label">Exact match on anomaly category (' + matches + ' of ' + total + ')</div></div>' +
            '<div class="tile"><div class="tile-value">' + (judgeSum / total).toFixed(2) + '</div><div class="tile-label">Mean LLM-as-judge score (1 to 5) on narrative quality</div></div>' +
            '<div class="tile"><div class="tile-value">' + passing + '/' + total + '</div><div class="tile-label">Cases passing the judge bar (score of 4 or higher)</div></div>';

        var tbody = document.querySelector('#eval-table tbody');
        var html = '';
        goldenSet.forEach(function (g) {
            var predicted = cachedNarratives[String(g.flight)] || {};
            var match = predicted.category === g.expected_category;
            html += '<tr data-flight="' + g.flight + '" tabindex="0">' +
                '<td>F' + g.flight + '</td>' +
                '<td>' + esc(g.expected_category) + '</td>' +
                '<td>' + esc(predicted.category || 'none') + '</td>' +
                '<td class="' + (match ? 'match-yes' : 'status-flag') + '">' + (match ? 'match' : 'miss') + '</td>' +
                '<td>' + g.judge.score + '/5</td>' +
                '<td><span class="muted">view</span></td></tr>';
        });
        tbody.innerHTML = html;
        Array.prototype.forEach.call(tbody.querySelectorAll('tr'), function (row) {
            function open() {
                Array.prototype.forEach.call(tbody.querySelectorAll('tr'), function (r) { r.classList.remove('selected'); });
                row.classList.add('selected');
                renderTrace(Number(row.getAttribute('data-flight')));
            }
            row.addEventListener('click', open);
            row.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
        });
    }

    function renderTrace(flightNo) {
        var card = document.getElementById('trace-card');
        var f = flights[flightNo - 1];
        var g = goldenSet.filter(function (x) { return x.flight === flightNo; })[0];
        var predicted = cachedNarratives[String(flightNo)] || {};
        var a = analyses[flightNo];

        var inputs = METRICS.map(function (m) {
            return m.label + ': ' + f[m.key] + ' ' + m.unit + ' (robust z = ' + zScore(f, m.key).toFixed(2) + ')';
        }).join('\n');
        var flags = a.metricFlags.map(function (mf) { return mf.text; }).concat(a.eventFlags).join('\n') || 'none';
        var output = JSON.stringify({ category: predicted.category, confidence: predicted.confidence, narrative: predicted.narrative }, null, 2);

        card.hidden = false;
        card.innerHTML =
            '<h2>Trace: Flight ' + flightNo + '</h2>' +
            '<div class="trace-section"><h3>Inputs</h3><pre class="trace-pre">' + esc(inputs) + '</pre></div>' +
            '<div class="trace-section"><h3>Deterministic flags</h3><pre class="trace-pre">' + esc(flags) + '</pre></div>' +
            '<div class="trace-section"><h3>Prompt (system)</h3><pre class="trace-pre">' + esc(SYSTEM_PROMPT) + '</pre></div>' +
            '<div class="trace-section"><h3>Prompt (user)</h3><pre class="trace-pre">' + esc(buildUserPrompt(f)) + '</pre></div>' +
            '<div class="trace-section"><h3>Model output (cached run)</h3><pre class="trace-pre">' + esc(output) + '</pre></div>' +
            '<div class="trace-section"><h3>Reference narrative (golden label: ' + esc(g.expected_category) + ')</h3><pre class="trace-pre">' + esc(g.reference) + '</pre></div>' +
            '<div class="trace-section"><h3>Judge verdict: ' + g.judge.score + '/5' + (g.judge.pass ? ' (pass)' : ' (fail)') + '</h3><pre class="trace-pre">' + esc(g.judge.rationale) + '</pre></div>';
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ---------- Tabs and mode ----------

    function initTabs() {
        var tabs = [
            { btn: document.getElementById('tab-flights'), panel: document.getElementById('panel-flights') },
            { btn: document.getElementById('tab-evals'), panel: document.getElementById('panel-evals') }
        ];
        tabs.forEach(function (t) {
            t.btn.addEventListener('click', function () {
                tabs.forEach(function (o) {
                    var active = o === t;
                    o.btn.classList.toggle('active', active);
                    o.btn.setAttribute('aria-selected', active ? 'true' : 'false');
                    o.panel.hidden = !active;
                    o.panel.classList.toggle('active', active);
                });
            });
        });
    }

    function initModeToggle() {
        var btns = document.querySelectorAll('.mode-btn');
        var note = document.getElementById('mode-note');
        Array.prototype.forEach.call(btns, function (btn) {
            btn.addEventListener('click', function () {
                state.mode = btn.getAttribute('data-mode');
                Array.prototype.forEach.call(btns, function (b) {
                    var active = b === btn;
                    b.classList.toggle('active', active);
                    b.setAttribute('aria-checked', active ? 'true' : 'false');
                });
                note.textContent = state.mode === 'cached'
                    ? 'Cached mode uses pre-computed narratives for every flight: instant, offline, zero API calls. Live mode makes a real model call, rate-limited to 10 per hour.'
                    : 'Live mode sends the deterministic flags to a server-side API route and asks the model for a fresh narrative. If the endpoint is unavailable, cached narratives keep working.';
                renderDetail();
            });
        });
    }

    function initControls() {
        var metricSel = document.getElementById('metric-select');
        METRICS.forEach(function (m) {
            var opt = document.createElement('option');
            opt.value = m.key;
            opt.textContent = m.label + ' (' + m.unit + ')';
            metricSel.appendChild(opt);
        });
        metricSel.value = state.metricKey;
        metricSel.addEventListener('change', function () {
            state.metricKey = metricSel.value;
            renderChart();
        });

        var flightSel = document.getElementById('flight-select');
        flights.forEach(function (f) {
            var opt = document.createElement('option');
            opt.value = String(f.flight);
            opt.textContent = 'Flight ' + f.flight + ' (' + f.date + ')' + (analyses[f.flight].flagged ? ' [flagged]' : '');
            flightSel.appendChild(opt);
        });
        flightSel.value = String(state.selectedFlight);
        flightSel.addEventListener('change', function () {
            selectFlight(Number(flightSel.value));
        });

        chartEl.addEventListener('pointermove', chartPointerHandler);
        chartEl.addEventListener('click', chartPointerHandler);
        chartEl.addEventListener('pointerleave', hideTooltip);

        document.getElementById('clear-log').addEventListener('click', function () {
            state.dispositions = {};
            saveDispositions();
            renderDetail();
            renderReviewLog();
        });
    }

    // ---------- Boot ----------

    document.getElementById('demo-title').textContent = CONFIG.DEMO_NAME;
    initTabs();
    initModeToggle();
    initControls();
    renderChart();
    renderDetail();
    renderReviewLog();
    renderDataTable();
    renderEvals();
})();
