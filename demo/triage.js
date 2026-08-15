// TRIAGE: Flight Edition. A public rebuild of the TRIAGE flight deck:
// a 3D replay of each Ingenuity flight over procedural Mars-style terrain,
// synchronized strip charts, deterministic envelope flags, and example GenAI
// narratives. Paths and channel curves are RECONSTRUCTED from the recorded
// per-flight summaries: deterministic (seeded by flight number), anchored to
// the recorded numbers, always labeled as reconstruction.
// The deterministic layer runs entirely client-side. The model only narrates.
(function () {
    'use strict';

    var CONFIG = {
        DEMO_NAME: 'TRIAGE: Flight Edition', // one constant to rename the demo
        Z_THRESHOLD: 2.5,
        LIVE_ENDPOINT: '/api/narrative',
        STORAGE_KEY: 'triage-dispositions-v1',
        SAMPLES_N: 240
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
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ------------------------------------------------------------------
    // Deterministic layer: fleet statistics, robust z-scores, event flags
    // ------------------------------------------------------------------

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

    function envelopeHi(key) {
        var s = fleetStats[key];
        return s.median + CONFIG.Z_THRESHOLD * s.sigma;
    }

    var EVENT_RULES = [
        { re: /glitch|oscillat/i, flag: 'In-flight navigation event in the record', kind: 'nav' },
        { re: /lost communication|lost contact|loss of communication/i, flag: 'In-flight communications loss in the record', kind: 'comm' },
        { re: /contingency landing|LAND_NOW|terminated early|cut short/i, flag: 'Flight ended early per the record', kind: 'early' },
        { re: /flew only/i, flag: 'Flight fell short of its plan per the record', kind: 'early' }
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
        var kinds = {};
        EVENT_RULES.forEach(function (rule) {
            if (rule.re.test(f.summary || '')) {
                eventFlags.push(rule.flag);
                kinds[rule.kind] = true;
            }
        });
        if (f.note && ABORT_RE.test(f.note)) {
            eventFlags.push('Pre-flight abort or delay in the record');
        } else if (f.note) {
            eventFlags.push('Pre-flight checkout noted in the record');
        }
        return {
            metricFlags: metricFlags,
            eventFlags: eventFlags,
            kinds: kinds,
            flagged: metricFlags.length > 0 || eventFlags.some(function (e) { return e.indexOf('checkout') === -1; })
        };
    }

    var analyses = {};
    flights.forEach(function (f) { analyses[f.flight] = analyzeFlight(f); });

    // ------------------------------------------------------------------
    // Prompt builder (shown in traces, sent in live mode)
    // ------------------------------------------------------------------

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

    // ------------------------------------------------------------------
    // Seeded RNG + noise (ported from the original flight deck)
    // ------------------------------------------------------------------

    function mulberry32(seed) {
        var a = seed >>> 0;
        return function () {
            a |= 0;
            a = (a + 0x6d2b79f5) | 0;
            var t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function hash2(ix, iz, seed) {
        var h = seed >>> 0;
        h = Math.imul(h ^ (ix | 0), 0x85ebca6b);
        h = Math.imul(h ^ (iz | 0), 0xc2b2ae35);
        h ^= h >>> 13;
        h = Math.imul(h, 0x27d4eb2f);
        h ^= h >>> 16;
        return (h >>> 0) / 4294967296;
    }

    function smoothstep(t) { return t * t * (3 - 2 * t); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

    function valueNoise2(x, z, seed) {
        var ix = Math.floor(x), iz = Math.floor(z);
        var fx = smoothstep(x - ix), fz = smoothstep(z - iz);
        var a = hash2(ix, iz, seed), b = hash2(ix + 1, iz, seed);
        var c = hash2(ix, iz + 1, seed), d = hash2(ix + 1, iz + 1, seed);
        return lerp(lerp(a, b, fx), lerp(c, d, fx), fz);
    }

    function fbm2(x, z, seed) {
        var sum = 0, amp = 0.5, freq = 1;
        for (var o = 0; o < 4; o++) {
            sum += amp * valueNoise2(x * freq, z * freq, seed + o * 101);
            amp *= 0.5;
            freq *= 2;
        }
        return sum;
    }

    // ------------------------------------------------------------------
    // Terrain: procedural Mars relief (same construction as the original)
    // ------------------------------------------------------------------

    var TERRAIN_SEED = 0x4a505a;
    var TERRAIN_SIZE = 4600;
    var TERRAIN_SEG = 64;
    var CRATERS = [[420, -300, 110], [-520, 430, 150], [150, 620, 80], [-260, -520, 70]];

    function heightAt(x, z) {
        var nx = x / 900, nz = z / 900;
        var h = (fbm2(nx + 10, nz + 10, TERRAIN_SEED) - 0.5) * 16;
        h += (fbm2(x / 240 + 3, z / 240 + 3, TERRAIN_SEED + 21) - 0.5) * 7;
        var scarp = Math.max(0, -(x + z) / 1400 - 0.25);
        h += Math.min(1, scarp) * 26 * (0.7 + 0.3 * fbm2(nx * 2, nz * 2, TERRAIN_SEED + 7));
        for (var i = 0; i < CRATERS.length; i++) {
            var d = Math.hypot(x - CRATERS[i][0], z - CRATERS[i][1]) / CRATERS[i][2];
            if (d < 1.6) {
                h += Math.exp(-((d - 1) * (d - 1)) * 8) * 3.2 + (d < 1 ? -(1 - d * d) * 4.5 : 0);
            }
        }
        var flatten = Math.min(1, Math.hypot(x, z) / 130);
        return h * flatten * 2.0; // vertical exaggeration for legibility, as the original
    }

    // Regolith ramp: dark rust lows to tan-ochre highs, with dust noise
    function terrainColor(x, z, h) {
        var dust = fbm2(x / 260 + 40, z / 260 + 40, TERRAIN_SEED + 55);
        var t = clamp((h + 16) / 68, 0, 1);
        return [
            lerp(0.34, 0.62, t) + dust * 0.06,
            lerp(0.2, 0.36, t) + dust * 0.035,
            lerp(0.14, 0.24, t) + dust * 0.02
        ];
    }

    // ------------------------------------------------------------------
    // Flight reconstruction: seeded, anchored to the recorded numbers
    // ------------------------------------------------------------------

    function bezierTrack(f, rand) {
        var heading = rand() * Math.PI * 2;
        var sx = (rand() - 0.5) * 50, sz = (rand() - 0.5) * 50;
        var chord = Math.max(20, f.distance_m * 0.92);
        var tx = sx + Math.cos(heading) * chord;
        var tz = sz + Math.sin(heading) * chord;
        var bow = (rand() - 0.5) * chord * 0.45;
        var cx = (sx + tx) / 2 + Math.cos(heading + Math.PI / 2) * bow;
        var cz = (sz + tz) / 2 + Math.sin(heading + Math.PI / 2) * bow;

        // Sample the bezier finely, then scale about the start so the arc
        // length equals the recorded distance exactly.
        var raw = [];
        var len = 0;
        var N = 400;
        for (var i = 0; i <= N; i++) {
            var u = i / N, a = 1 - u;
            var x = a * a * sx + 2 * a * u * cx + u * u * tx;
            var z = a * a * sz + 2 * a * u * cz + u * u * tz;
            if (i > 0) len += Math.hypot(x - raw[i - 1][0], z - raw[i - 1][1]);
            raw.push([x, z]);
        }
        var k = f.distance_m / Math.max(1e-6, len);
        var cum = [0];
        for (var j = 1; j <= N; j++) {
            raw[j] = [sx + (raw[j][0] - sx) * k, sz + (raw[j][1] - sz) * k];
            cum.push(cum[j - 1] + Math.hypot(raw[j][0] - raw[j - 1][0], raw[j][1] - raw[j - 1][1]));
        }
        return {
            at: function (s) { // ground position at arc length s
                s = clamp(s, 0, cum[N]);
                var lo = 0, hi = N;
                while (lo < hi) {
                    var mid = (lo + hi) >> 1;
                    if (cum[mid] < s) lo = mid + 1; else hi = mid;
                }
                var i1 = Math.max(1, lo);
                var seg = cum[i1] - cum[i1 - 1] || 1;
                var t = (s - cum[i1 - 1]) / seg;
                return [lerp(raw[i1 - 1][0], raw[i1][0], t), lerp(raw[i1 - 1][1], raw[i1][1], t)];
            }
        };
    }

    function aglAt(t, dur, climbEnd, descentStart, cruiseAlt) {
        if (t <= 0) return 0;
        if (t < climbEnd) return cruiseAlt * smoothstep(t / climbEnd);
        if (t <= descentStart) {
            var u = (t - climbEnd) / Math.max(1, descentStart - climbEnd);
            return cruiseAlt * (1 - 0.06 * (0.5 + 0.5 * Math.sin(u * Math.PI * 2)));
        }
        if (t >= dur) return 0;
        return cruiseAlt * (1 - smoothstep((t - descentStart) / (dur - descentStart)));
    }

    function reconstructFlight(f) {
        var rand = mulberry32(0x9e3779b9 ^ (f.flight * 2654435761));
        var a = analyses[f.flight];
        var dur = f.duration_s;
        var climbEnd = Math.min(30, dur * 0.15);
        var descentStart = dur - Math.min(30, dur * 0.15);
        var popup = f.distance_m < 20;
        var track = popup ? null : bezierTrack(f, rand);
        var driftHeading = rand() * Math.PI * 2;

        // Groundspeed shape: ramps tied to climb/descent, cruise level solved so
        // the covered distance matches the record, plus a brief seeded peak that
        // touches the recorded max groundspeed.
        var vmax = f.speed_ms;
        var peakT = lerp(climbEnd + 5, descentStart - 5, 0.3 + rand() * 0.4);
        var peakW = Math.max(3, dur * 0.05);
        var cruise = 0;
        if (!popup && vmax > 0) {
            cruise = vmax * 0.7;
            for (var iter = 0; iter < 4; iter++) {
                var integral = 0, steps = 200;
                for (var s = 0; s < steps; s++) {
                    integral += speedShape((dur * s) / steps) * (dur / steps);
                }
                cruise = clamp(cruise * (f.distance_m / Math.max(1, integral)), 0.05, vmax);
            }
        }
        function speedShape(t) {
            if (popup || vmax <= 0) return 0;
            var v;
            if (t < climbEnd) v = cruise * smoothstep(t / climbEnd);
            else if (t > descentStart) v = cruise * smoothstep((dur - t) / (dur - descentStart));
            else v = cruise * (0.92 + 0.08 * Math.sin(t / 9 + 1.7));
            var bump = Math.exp(-((t - peakT) * (t - peakT)) / (2 * peakW * peakW));
            return Math.min(vmax, v + (vmax - cruise) * bump * (t > climbEnd && t < descentStart ? 1 : 0));
        }

        var path = [], channels = [];
        var dist = 0;
        var linkLossT = null;
        for (var i = 0; i < CONFIG.SAMPLES_N; i++) {
            var t = (dur * i) / (CONFIG.SAMPLES_N - 1);
            var dt = dur / (CONFIG.SAMPLES_N - 1);
            var v = speedShape(t);
            if (i > 0) dist = Math.min(f.distance_m, dist + v * dt);
            var agl = aglAt(t, dur, climbEnd, descentStart, f.altitude_m);
            var gx, gz;
            if (popup) {
                // hover with a small seeded drift so the recorded distance is honored
                var r = f.distance_m / (2 * Math.PI) + 0.5;
                var ang = driftHeading + (t / dur) * (f.distance_m / Math.max(0.5, r));
                gx = Math.cos(ang) * r;
                gz = Math.sin(ang) * r;
            } else {
                var pos = track.at(dist);
                gx = pos[0];
                gz = pos[1];
            }
            path.push({ x: gx, y: heightAt(gx, gz) + agl, z: gz });
            channels.push({ t: t, agl: agl, speed: v, dist: popup ? (f.distance_m * t) / dur : dist });
            if (linkLossT === null && a.kinds.comm && t > descentStart && agl <= 3 && agl > 0) {
                linkLossT = t;
            }
        }

        return {
            flight: f,
            durationS: dur,
            climbEnd: climbEnd,
            descentStart: descentStart,
            path: path,
            channels: channels,
            popup: popup,
            linkLossT: linkLossT,
            earlyTerm: !!a.kinds.early,
            envAltHi: envelopeHi('altitude_m'),
            envSpdHi: envelopeHi('speed_ms')
        };
    }

    function sampleAt(arr, p) {
        return arr[clamp(Math.round(p * (arr.length - 1)), 0, arr.length - 1)];
    }

    // ------------------------------------------------------------------
    // 3D deck renderer (hand-rolled canvas projection, zero dependencies)
    // ------------------------------------------------------------------

    var canvas = document.getElementById('deck-canvas');
    var ctx = canvas.getContext('2d');
    var terrainCanvas = document.createElement('canvas');
    var terrainCtx = terrainCanvas.getContext('2d');
    var terrainPose = null;

    var LIGHT = normalize([-0.72, 0.5, 0.34]);
    var SKY = [10, 26, 46];  // deep navy sky, matching the site surface
    var HAZE = [34, 22, 22]; // warm dust haze the far terrain melts into

    function normalize(v) {
        var l = Math.hypot(v[0], v[1], v[2]) || 1;
        return [v[0] / l, v[1] / l, v[2] / l];
    }

    var cam = { theta: -0.95, phi: 0.46, dist: 700, target: [0, 40, 0] };
    var camVel = 0;

    // Terrain quads, built once. The grid is center-weighted: fine cells where
    // the flights are, coarser toward the rim (which the distance fade absorbs).
    var quads = [];
    (function buildQuads() {
        var half = TERRAIN_SIZE / 2;
        function gridCoord(i) {
            var u = (i / TERRAIN_SEG) * 2 - 1;
            return half * Math.sign(u) * Math.pow(Math.abs(u), 1.65);
        }
        for (var i = 0; i < TERRAIN_SEG; i++) {
            for (var j = 0; j < TERRAIN_SEG; j++) {
                var x0 = gridCoord(i), z0 = gridCoord(j);
                var x1 = gridCoord(i + 1), z1 = gridCoord(j + 1);
                var y00 = heightAt(x0, z0), y10 = heightAt(x1, z0);
                var y01 = heightAt(x0, z1), y11 = heightAt(x1, z1);
                // flat-shade normal from the two diagonals
                var ux = x1 - x0, uy = y11 - y00, uz = z1 - z0;
                var wx = x1 - x0, wy = y10 - y01, wz = z0 - z1;
                var n = normalize([uy * wz - uz * wy, uz * wx - ux * wz, ux * wy - uy * wx]);
                if (n[1] < 0) n = [-n[0], -n[1], -n[2]];
                var shade = 0.52 + 0.48 * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
                var cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
                var col = terrainColor(cx, cz, (y00 + y11) / 2);
                quads.push({
                    pts: [[x0, y00, z0], [x1, y10, z0], [x1, y11, z1], [x0, y01, z1]],
                    center: [cx, (y00 + y10 + y01 + y11) / 4, cz],
                    rgb: [col[0] * shade * 255, col[1] * shade * 255, col[2] * shade * 255]
                });
            }
        }
    })();

    function makeCameraFrame(W, H) {
        var eye = [
            cam.target[0] + cam.dist * Math.cos(cam.phi) * Math.cos(cam.theta),
            cam.target[1] + cam.dist * Math.sin(cam.phi),
            cam.target[2] + cam.dist * Math.cos(cam.phi) * Math.sin(cam.theta)
        ];
        var fwd = normalize([cam.target[0] - eye[0], cam.target[1] - eye[1], cam.target[2] - eye[2]]);
        var right = normalize([fwd[2], 0, -fwd[0]]);
        var up = [
            right[1] * fwd[2] - right[2] * fwd[1],
            right[2] * fwd[0] - right[0] * fwd[2],
            right[0] * fwd[1] - right[1] * fwd[0]
        ];
        var f = H * 1.25;
        return {
            eye: eye,
            project: function (p) {
                var dx = p[0] - eye[0], dy = p[1] - eye[1], dz = p[2] - eye[2];
                var cz = dx * fwd[0] + dy * fwd[1] + dz * fwd[2];
                if (cz < 25) return null;
                var cx = dx * right[0] + dy * right[1] + dz * right[2];
                var cy = dx * up[0] + dy * up[1] + dz * up[2];
                // principal point sits below center: more sky, terrain to the frame edge
                return [W / 2 + (f * cx) / cz, H * 0.58 - (f * cy) / cz, cz];
            }
        };
    }

    function renderTerrain(W, H) {
        var key = [cam.theta.toFixed(3), cam.phi.toFixed(3), Math.round(cam.dist), W, H].join('|');
        if (terrainPose === key) return;
        terrainPose = key;
        terrainCanvas.width = W;
        terrainCanvas.height = H;
        var g = terrainCtx;
        var grad = g.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, 'rgb(' + SKY[0] + ',' + SKY[1] + ',' + SKY[2] + ')');
        grad.addColorStop(0.42, 'rgb(26,27,40)');
        grad.addColorStop(0.75, 'rgb(' + HAZE[0] + ',' + HAZE[1] + ',' + HAZE[2] + ')');
        grad.addColorStop(1, 'rgb(52,34,29)');
        g.fillStyle = grad;
        g.fillRect(0, 0, W, H);

        var frame = makeCameraFrame(W, H);
        var drawList = [];
        for (var q = 0; q < quads.length; q++) {
            var quad = quads[q];
            var pts = quad.pts;
            var p0 = frame.project(pts[0]), p1 = frame.project(pts[1]);
            var p2 = frame.project(pts[2]), p3 = frame.project(pts[3]);
            if (!p0 || !p1 || !p2 || !p3) continue;
            if ((p0[0] < -40 && p1[0] < -40 && p2[0] < -40 && p3[0] < -40) ||
                (p0[0] > W + 40 && p1[0] > W + 40 && p2[0] > W + 40 && p3[0] > W + 40)) continue;
            drawList.push({ depth: (p0[2] + p2[2]) / 2, p: [p0, p1, p2, p3], rgb: quad.rgb });
        }
        drawList.sort(function (a, b) { return b.depth - a.depth; });
        for (var d = 0; d < drawList.length; d++) {
            var item = drawList[d];
            var fade = clamp((item.depth - cam.dist * 0.8) / (cam.dist * 2.4), 0, 0.85);
            var r = Math.round(lerp(item.rgb[0], HAZE[0], fade));
            var gg = Math.round(lerp(item.rgb[1], HAZE[1], fade));
            var b = Math.round(lerp(item.rgb[2], HAZE[2], fade));
            g.fillStyle = 'rgb(' + r + ',' + gg + ',' + b + ')';
            g.strokeStyle = g.fillStyle;
            g.lineWidth = 1;
            g.beginPath();
            g.moveTo(item.p[0][0], item.p[0][1]);
            g.lineTo(item.p[1][0], item.p[1][1]);
            g.lineTo(item.p[2][0], item.p[2][1]);
            g.lineTo(item.p[3][0], item.p[3][1]);
            g.closePath();
            g.fill();
            g.stroke();
        }
    }

    function renderDeck() {
        var W = canvas.width, H = canvas.height;
        renderTerrain(W, H);
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(terrainCanvas, 0, 0);
        var frame = makeCameraFrame(W, H);
        var r = state.recon;
        var progress = state.t / r.durationS;
        var idx = clamp(Math.round(progress * (r.path.length - 1)), 0, r.path.length - 1);

        // Base station marker
        var base = frame.project([0, heightAt(0, 0) + 2, 0]);
        if (base) {
            ctx.fillStyle = 'rgba(255,203,5,0.9)';
            ctx.beginPath();
            ctx.moveTo(base[0], base[1] - 7);
            ctx.lineTo(base[0] - 5, base[1] + 4);
            ctx.lineTo(base[0] + 5, base[1] + 4);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.55)';
            ctx.font = '10px Inter, sans-serif';
            ctx.fillText('BASE', base[0] + 8, base[1] + 4);
        }

        // Flight path: flown portion bright, remainder dim; dashed after link loss
        function drawPath(from, to, style, width, dash) {
            ctx.strokeStyle = style;
            ctx.lineWidth = width;
            ctx.setLineDash(dash || []);
            ctx.beginPath();
            var started = false;
            for (var i = from; i <= to; i++) {
                var p = frame.project([r.path[i].x, r.path[i].y, r.path[i].z]);
                if (!p) { started = false; continue; }
                if (!started) { ctx.moveTo(p[0], p[1]); started = true; }
                else ctx.lineTo(p[0], p[1]);
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }
        var lossIdx = r.linkLossT !== null ? Math.round((r.linkLossT / r.durationS) * (r.path.length - 1)) : null;
        drawPath(idx, r.path.length - 1, 'rgba(255,255,255,0.22)', 1.5, lossIdx !== null ? [4, 4] : []);
        drawPath(0, idx, 'rgba(255,203,5,0.85)', 2.5);

        // Helicopter: ground shadow, altitude stem, body, counter-rotating rotors
        var hp = r.path[idx];
        var groundY = heightAt(hp.x, hp.z);
        var shadow = frame.project([hp.x, groundY + 0.5, hp.z]);
        var heli = frame.project([hp.x, hp.y, hp.z]);
        if (shadow && heli) {
            var scale = clamp(2600 / heli[2], 0.5, 2.2);
            ctx.strokeStyle = 'rgba(255,255,255,0.25)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(shadow[0], shadow[1]);
            ctx.lineTo(heli[0], heli[1]);
            ctx.stroke();
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.ellipse(shadow[0], shadow[1], 6 * scale, 2.4 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
            // fuselage
            ctx.fillStyle = '#E8E4DA';
            ctx.fillRect(heli[0] - 4 * scale, heli[1] - 3 * scale, 8 * scale, 6 * scale);
            ctx.fillStyle = '#B58900';
            ctx.fillRect(heli[0] - 4 * scale, heli[1] - 3 * scale, 8 * scale, 2 * scale);
            // rotors (counter-rotating, deliberately watchable like the original)
            var ang = state.t * 6;
            ctx.strokeStyle = 'rgba(230,230,230,0.9)';
            ctx.lineWidth = 1.4 * scale;
            [ang, -ang + Math.PI / 2].forEach(function (aRot) {
                var rx = Math.cos(aRot) * 13 * scale;
                var rz = Math.sin(aRot) * 4.5 * scale;
                ctx.beginPath();
                ctx.moveTo(heli[0] - rx, heli[1] - 5 * scale - rz * 0.4);
                ctx.lineTo(heli[0] + rx, heli[1] - 5 * scale + rz * 0.4);
                ctx.stroke();
            });
        }
    }

    // ------------------------------------------------------------------
    // Strip charts (SVG) with a synchronized playhead
    // ------------------------------------------------------------------

    var CHART_DEFS = [
        { key: 'agl', label: 'Altitude AGL', unit: 'm', color: '#3E8FD9', envKey: 'envAltHi', anchor: 'altitude_m' },
        { key: 'speed', label: 'Groundspeed', unit: 'm/s', color: '#B58900', envKey: 'envSpdHi', anchor: 'speed_ms' },
        { key: 'dist', label: 'Distance covered', unit: 'm', color: '#7FA8C9', envKey: null, anchor: 'distance_m' }
    ];
    var chartRefs = [];

    function buildCharts() {
        var col = document.getElementById('charts-col');
        col.innerHTML = '';
        chartRefs = [];
        var r = state.recon;
        CHART_DEFS.forEach(function (def) {
            var W = 340, H = 110, padL = 42, padR = 10, padT = 12, padB = 18;
            var iw = W - padL - padR, ih = H - padT - padB;
            var vals = r.channels.map(function (c) { return c[def.key]; });
            var env = def.envKey ? r[def.envKey] : null;
            var vmax = Math.max.apply(null, vals.concat(env !== null && env < Math.max.apply(null, vals) * 3 ? [env] : [0])) * 1.12 || 1;

            function X(t) { return padL + (t / r.durationS) * iw; }
            function Y(v) { return padT + ih - (v / vmax) * ih; }

            var pts = r.channels.map(function (c) {
                return X(c.t).toFixed(1) + ',' + Y(c[def.key]).toFixed(1);
            }).join(' ');

            var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + def.label + ' over the flight, reconstructed">';
            svg += '<text x="' + padL + '" y="9" class="chart-title">' + def.label + ' (' + def.unit + ')</text>';
            for (var g = 0; g <= 2; g++) {
                var gy = padT + (ih * g) / 2;
                var gv = vmax * (1 - g / 2);
                svg += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + gy + '" y2="' + gy + '" class="chart-grid"/>';
                svg += '<text x="' + (padL - 4) + '" y="' + (gy + 3) + '" class="chart-tick" text-anchor="end">' + (gv >= 100 ? Math.round(gv) : gv.toFixed(1)) + '</text>';
            }
            svg += '<text x="' + (W - padR) + '" y="' + (H - 5) + '" class="chart-tick" text-anchor="end">' + Math.round(r.durationS) + 's</text>';
            if (env !== null && env < vmax) {
                svg += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + Y(env) + '" y2="' + Y(env) + '" class="chart-env"/>';
                svg += '<text x="' + (padL + 4) + '" y="' + (Y(env) - 3) + '" class="chart-env-label" text-anchor="start">fleet envelope</text>';
            }
            svg += '<polyline points="' + pts + '" fill="none" stroke="' + def.color + '" stroke-width="1.8"/>';
            svg += '<line class="playhead" x1="' + padL + '" x2="' + padL + '" y1="' + padT + '" y2="' + (padT + ih) + '"/>';
            svg += '</svg>';

            var wrap = document.createElement('div');
            wrap.className = 'strip-chart';
            wrap.innerHTML = svg + '<span class="chart-now" aria-hidden="true"></span>';
            col.appendChild(wrap);
            chartRefs.push({
                def: def,
                playhead: wrap.querySelector('.playhead'),
                now: wrap.querySelector('.chart-now'),
                X: X
            });
        });
    }

    function updateCharts() {
        var r = state.recon;
        var sample = sampleAt(r.channels, state.t / r.durationS);
        chartRefs.forEach(function (ref) {
            var x = ref.X(state.t).toFixed(1);
            ref.playhead.setAttribute('x1', x);
            ref.playhead.setAttribute('x2', x);
            var v = sample[ref.def.key];
            ref.now.textContent = (v >= 100 ? Math.round(v) : v.toFixed(1)) + ' ' + ref.def.unit;
        });
    }

    // ------------------------------------------------------------------
    // Alarms (banner + panel outline), mirroring the original's alert flash
    // ------------------------------------------------------------------

    var alarmBadge = document.getElementById('alarm-badge');
    var deckPanel = document.getElementById('deck-panel');

    function updateAlarm() {
        var r = state.recon;
        var sample = sampleAt(r.channels, state.t / r.durationS);
        var alarm = null;
        if (r.linkLossT !== null && state.t >= r.linkLossT) {
            alarm = { text: 'LINK LOST', cls: 'alarm-red' };
        } else if (r.earlyTerm && state.t >= r.descentStart) {
            alarm = { text: 'EARLY TERMINATION', cls: 'alarm-red' };
        } else if (sample.agl > r.envAltHi || sample.speed > r.envSpdHi) {
            alarm = { text: 'ENVELOPE EXCEEDANCE', cls: 'alarm-amber' };
        }
        if (alarm) {
            alarmBadge.hidden = false;
            alarmBadge.textContent = alarm.text;
            alarmBadge.className = 'alarm-badge ' + alarm.cls;
            deckPanel.className = 'deck-panel ' + alarm.cls;
        } else {
            alarmBadge.hidden = true;
            deckPanel.className = 'deck-panel';
        }
    }

    // ------------------------------------------------------------------
    // Playback
    // ------------------------------------------------------------------

    var state = {
        flightNo: 6,
        recon: null,
        t: 0,
        playing: false,
        speed: 1,
        liveResults: {},
        dispositions: loadDispositions()
    };

    var playBtn = document.getElementById('play-btn');
    var scrubber = document.getElementById('scrubber');
    var timeReadout = document.getElementById('time-readout');
    var lastFrame = null;

    function setPlaying(playing) {
        state.playing = playing;
        playBtn.innerHTML = playing ? '&#10074;&#10074;' : '&#9654;';
        playBtn.setAttribute('aria-label', playing ? 'Pause the replay' : 'Play the replay');
        if (playing) {
            lastFrame = null;
            requestAnimationFrame(tick);
        }
    }

    function tick(now) {
        if (!state.playing) return;
        if (lastFrame === null) lastFrame = now;
        var dt = (now - lastFrame) / 1000;
        lastFrame = now;
        state.t += dt * state.speed * 4; // 4 flight-seconds per wall-second at 1x
        if (state.t >= state.recon.durationS) {
            state.t = state.recon.durationS;
            setPlaying(false);
        }
        stepCameraInertia();
        drawTick();
        if (state.playing) requestAnimationFrame(tick);
    }

    function drawTick() {
        scrubber.value = String(Math.round((state.t / state.recon.durationS) * 1000));
        timeReadout.textContent = 'T+' + state.t.toFixed(1) + 's / ' + state.recon.durationS.toFixed(1) + 's';
        renderDeck();
        updateCharts();
        updateAlarm();
    }

    // ------------------------------------------------------------------
    // Camera drag-orbit with momentum (grabbable and interruptible)
    // ------------------------------------------------------------------

    var dragging = false;
    var lastPointer = null;
    var pointerHistory = [];

    canvas.addEventListener('pointerdown', function (e) {
        dragging = true;
        camVel = 0; // grabbing interrupts any in-flight inertia
        lastPointer = [e.clientX, e.clientY];
        pointerHistory = [{ x: e.clientX, t: performance.now() }];
        canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var dx = e.clientX - lastPointer[0];
        var dy = e.clientY - lastPointer[1];
        lastPointer = [e.clientX, e.clientY];
        cam.theta += dx * 0.006;
        cam.phi = clamp(cam.phi + dy * 0.004, 0.15, 1.2);
        pointerHistory.push({ x: e.clientX, t: performance.now() });
        if (pointerHistory.length > 5) pointerHistory.shift();
        if (!state.playing) drawTick();
    });
    function endDrag() {
        if (!dragging) return;
        dragging = false;
        // hand the release velocity to the camera so the orbit keeps its momentum
        if (!reducedMotion && pointerHistory.length >= 2) {
            var a = pointerHistory[0];
            var b = pointerHistory[pointerHistory.length - 1];
            var dt = (b.t - a.t) / 1000;
            if (dt > 0) camVel = ((b.x - a.x) / dt) * 0.006;
        }
        if (!state.playing) inertiaLoop();
    }
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', endDrag);

    function stepCameraInertia() {
        if (dragging || !camVel) return;
        cam.theta += camVel / 60;
        camVel *= 0.94;
        if (Math.abs(camVel) < 0.02) camVel = 0;
    }

    function inertiaLoop() {
        if (state.playing || dragging || !camVel) return;
        stepCameraInertia();
        drawTick();
        if (camVel) requestAnimationFrame(inertiaLoop);
    }

    // ------------------------------------------------------------------
    // Narrative panel: example GenAI narrative + human disposition
    // ------------------------------------------------------------------

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

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
    }

    function getNarrative(flightNo) {
        if (state.liveResults[flightNo]) return state.liveResults[flightNo];
        var c = cachedNarratives[String(flightNo)];
        return c ? { category: c.category, confidence: c.confidence, narrative: c.narrative, cached: true } : null;
    }

    function renderNarrative() {
        var panel = document.getElementById('narrative-panel');
        var f = flights[state.flightNo - 1];
        var a = analyses[f.flight];
        var n = getNarrative(f.flight);
        var dispo = state.dispositions[f.flight];

        var html = '<h2>Example GenAI narrative</h2>';
        html += '<div class="record-block"><strong>Public record.</strong> ' + esc(f.summary) + '</div>';
        if (f.note) html += '<div class="record-block"><strong>Pre-flight events.</strong> ' + esc(f.note) + '</div>';

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

        html += '<div class="narrative-box"><div class="narrative-head">';
        if (n && n.cached) html += '<span class="badge">Cached example</span>';
        if (n && !n.cached) html += '<span class="badge live">Live: ' + esc(n.model || 'model') + '</span>';
        if (n) {
            html += '<span class="category-pill">' + esc(n.category) + '</span>';
            html += '<span class="confidence">confidence: ' + esc(n.confidence) + '</span>';
        }
        html += '</div><p class="narrative-text">' + (n ? esc(n.narrative) : 'No narrative available.') + '</p></div>';

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
                '<button type="button" class="ghost-btn" id="run-live">Regenerate live</button>' +
                '</div>' +
                '<div id="edit-zone"></div><div id="live-status"></div>' +
                '<p class="live-note">TRIAGE advises, humans decide: your call is recorded in this browser only. Regenerate live makes one real model call through a server-side route (the key never reaches the browser, 10 calls per hour). If it fails, this cached example keeps working.</p>';
        }

        panel.innerHTML = html;

        var acceptBtn = document.getElementById('dispo-accept');
        if (acceptBtn) acceptBtn.addEventListener('click', function () { setDisposition(f.flight, 'accepted'); });
        var rejectBtn = document.getElementById('dispo-reject');
        if (rejectBtn) rejectBtn.addEventListener('click', function () { setDisposition(f.flight, 'rejected'); });
        var editBtn = document.getElementById('dispo-edit');
        if (editBtn) {
            editBtn.addEventListener('click', function () {
                var zone = document.getElementById('edit-zone');
                zone.innerHTML = '<textarea class="edit-area" id="edit-text" aria-label="Edit the narrative">' + esc(n ? n.narrative : '') + '</textarea>' +
                    '<button type="button" class="dispo-btn dispo-accept" id="save-edit">Save edit</button>';
                document.getElementById('save-edit').addEventListener('click', function () {
                    setDisposition(f.flight, 'edited', document.getElementById('edit-text').value);
                });
            });
        }
        var undoBtn = document.getElementById('undo-dispo');
        if (undoBtn) undoBtn.addEventListener('click', function () {
            delete state.dispositions[f.flight];
            saveDispositions();
            renderNarrative();
        });
        var liveBtn = document.getElementById('run-live');
        if (liveBtn) liveBtn.addEventListener('click', function () { runLive(f); });
    }

    function setDisposition(flightNo, action, editedText) {
        state.dispositions[flightNo] = { action: action, editedText: editedText || null, at: Date.now() };
        saveDispositions();
        renderNarrative();
    }

    function runLive(f) {
        var statusEl = document.getElementById('live-status');
        statusEl.innerHTML = '<p class="notice"><span class="spinner" aria-hidden="true"></span>Calling the model...</p>';
        var a = analyses[f.flight];
        fetch(CONFIG.LIVE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                flight: f.flight,
                date: f.date,
                sol: f.sol,
                metrics: METRICS.map(function (m) {
                    return { label: m.label, unit: m.unit, value: f[m.key], z: zScore(f, m.key) };
                }),
                flags: a.metricFlags.map(function (mf) { return mf.text; }).concat(a.eventFlags),
                summary: f.summary,
                note: f.note || ''
            })
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
                renderNarrative();
            } else {
                statusEl.innerHTML = '<p class="notice">' + esc((result.data && result.data.error) || 'The live call failed.') + ' Showing the cached example above.</p>';
            }
        }).catch(function () {
            statusEl.innerHTML = '<p class="notice">Could not reach the live endpoint. Showing the cached example above.</p>';
        });
    }

    // ------------------------------------------------------------------
    // Evals (collapsed details section)
    // ------------------------------------------------------------------

    function renderEvals() {
        var total = goldenSet.length;
        var matches = 0, judgeSum = 0, passing = 0;
        goldenSet.forEach(function (g) {
            var predicted = cachedNarratives[String(g.flight)];
            if (predicted && predicted.category === g.expected_category) matches += 1;
            judgeSum += g.judge.score;
            if (g.judge.pass) passing += 1;
        });

        document.getElementById('eval-tiles').innerHTML =
            '<div class="tile"><div class="tile-value">' + total + '</div><div class="tile-label">Golden set cases</div></div>' +
            '<div class="tile"><div class="tile-value">' + Math.round((matches / total) * 100) + '%</div><div class="tile-label">Category exact match (' + matches + ' of ' + total + ')</div></div>' +
            '<div class="tile"><div class="tile-value">' + (judgeSum / total).toFixed(2) + '</div><div class="tile-label">Mean judge score (1 to 5)</div></div>' +
            '<div class="tile"><div class="tile-value">' + passing + '/' + total + '</div><div class="tile-label">Passing the judge bar (4+)</div></div>';

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
                '<td>' + g.judge.score + '/5</td></tr>';
        });
        tbody.innerHTML = html;
        Array.prototype.forEach.call(tbody.querySelectorAll('tr'), function (row) {
            function open() {
                Array.prototype.forEach.call(tbody.querySelectorAll('tr'), function (r2) { r2.classList.remove('selected'); });
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
        var flagsTxt = a.metricFlags.map(function (mf) { return mf.text; }).concat(a.eventFlags).join('\n') || 'none';
        var output = JSON.stringify({ category: predicted.category, confidence: predicted.confidence, narrative: predicted.narrative }, null, 2);

        card.hidden = false;
        card.innerHTML =
            '<h2>Trace: Flight ' + flightNo + '</h2>' +
            '<div class="trace-section"><h3>Inputs</h3><pre class="trace-pre">' + esc(inputs) + '</pre></div>' +
            '<div class="trace-section"><h3>Deterministic flags</h3><pre class="trace-pre">' + esc(flagsTxt) + '</pre></div>' +
            '<div class="trace-section"><h3>Prompt (system)</h3><pre class="trace-pre">' + esc(SYSTEM_PROMPT) + '</pre></div>' +
            '<div class="trace-section"><h3>Prompt (user)</h3><pre class="trace-pre">' + esc(buildUserPrompt(f)) + '</pre></div>' +
            '<div class="trace-section"><h3>Model output (cached run)</h3><pre class="trace-pre">' + esc(output) + '</pre></div>' +
            '<div class="trace-section"><h3>Reference narrative (golden label: ' + esc(g.expected_category) + ')</h3><pre class="trace-pre">' + esc(g.reference) + '</pre></div>' +
            '<div class="trace-section"><h3>Judge verdict: ' + g.judge.score + '/5' + (g.judge.pass ? ' (pass)' : ' (fail)') + '</h3><pre class="trace-pre">' + esc(g.judge.rationale) + '</pre></div>';
    }

    function renderDataTable() {
        var el = document.getElementById('data-table');
        var html = '<table><thead><tr><th scope="col">Flight</th><th scope="col">Date</th><th scope="col">Sol</th>';
        METRICS.forEach(function (m) { html += '<th scope="col">' + m.label + ' (' + m.unit + ')</th>'; });
        html += '<th scope="col">Flags</th></tr></thead><tbody>';
        flights.forEach(function (f) {
            html += '<tr><td>F' + f.flight + '</td><td>' + esc(f.date) + '</td><td>' + f.sol + '</td>';
            METRICS.forEach(function (m) { html += '<td>' + f[m.key] + '</td>'; });
            html += '<td>' + (analyses[f.flight].flagged ? 'Flagged' : 'In envelope') + '</td></tr>';
        });
        el.innerHTML = html + '</tbody></table>';
    }

    // ------------------------------------------------------------------
    // Flight selection + boot
    // ------------------------------------------------------------------

    function fitCamera() {
        var r = state.recon;
        var minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, maxY = 0;
        r.path.forEach(function (p) {
            minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
            minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
            maxY = Math.max(maxY, p.y);
        });
        cam.target = [(minX + maxX) / 2, Math.max(14, maxY * 0.35), (minZ + maxZ) / 2];
        var radius = Math.max(Math.hypot(maxX - minX, maxZ - minZ) / 2, maxY, 60);
        cam.dist = clamp(radius * 3.4, 480, 1650);
        cam.phi = 0.4;
        terrainPose = null;
    }

    function selectFlight(flightNo) {
        state.flightNo = flightNo;
        state.recon = reconstructFlight(flights[flightNo - 1]);
        state.t = 0;
        var f = flights[flightNo - 1];
        var a = analyses[flightNo];
        document.getElementById('deck-meta').textContent =
            f.date + ' · Sol ' + f.sol + ' · ' + f.duration_s + 's · ' + f.altitude_m + 'm max · ' +
            f.distance_m + 'm · ' + (a.flagged ? 'flagged' : 'in envelope');
        document.getElementById('flight-select').value = String(flightNo);
        fitCamera();
        buildCharts();
        renderNarrative();
        drawTick();
        setPlaying(!reducedMotion);
    }

    function sizeCanvas() {
        var dpr = Math.min(2, window.devicePixelRatio || 1);
        var w = canvas.clientWidth;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(w * 0.64 * dpr);
        terrainPose = null;
        if (state.recon) drawTick();
    }

    function init() {
        document.getElementById('demo-title').textContent = CONFIG.DEMO_NAME;

        var flightSel = document.getElementById('flight-select');
        flights.forEach(function (f) {
            var opt = document.createElement('option');
            opt.value = String(f.flight);
            opt.textContent = 'Flight ' + f.flight + ' (' + f.date + ')' + (analyses[f.flight].flagged ? ' [flagged]' : '');
            flightSel.appendChild(opt);
        });
        flightSel.addEventListener('change', function () { selectFlight(Number(flightSel.value)); });

        playBtn.addEventListener('click', function () {
            if (state.t >= state.recon.durationS) state.t = 0;
            setPlaying(!state.playing);
        });
        scrubber.addEventListener('input', function () {
            state.t = (Number(scrubber.value) / 1000) * state.recon.durationS;
            if (!state.playing) drawTick();
        });
        Array.prototype.forEach.call(document.querySelectorAll('.speed-btn'), function (btn) {
            btn.addEventListener('click', function () {
                state.speed = Number(btn.getAttribute('data-speed'));
                Array.prototype.forEach.call(document.querySelectorAll('.speed-btn'), function (b) {
                    b.classList.toggle('active', b === btn);
                });
            });
        });

        window.addEventListener('resize', sizeCanvas);
        sizeCanvas();
        selectFlight(state.flightNo);
        renderEvals();
        renderDataTable();
    }

    init();
})();
