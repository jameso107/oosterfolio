// TRIAGE: Flight Edition. A public rebuild of the TRIAGE flight deck telling one
// flight's story end to end: Ingenuity Flight 6, the first in-flight anomaly on
// another planet. The replay runs over the real Jezero Crater landscape (USGS
// Mars 2020 CTX DEM and orthomosaic, public domain, 10 km window centered on
// Octavia E. Butler Landing), with a procedural fallback if the assets fail.
// The flight path and channel curves are RECONSTRUCTED from the recorded
// summary: deterministic, anchored to the recorded numbers, dramatized where
// the record describes events (the T+54s navigation glitch), and always
// labeled as reconstruction. Numbers are computed, never generated.
(function () {
    'use strict';

    var CONFIG = {
        DEMO_NAME: 'TRIAGE: Flight Edition', // one constant to rename the demo
        Z_THRESHOLD: 2.5,
        LIVE_ENDPOINT: '/api/narrative',
        STORAGE_KEY: 'triage-dispositions-v1',
        SAMPLES_N: 280,
        FLIGHT: 6,               // the one flight this demo replays
        ANOMALY_START_S: 54,     // the record: image pipeline glitch 54 seconds in
        PITCH_ALERT_DEG: 10,
        VERT_EXAGGERATION: 2.0   // same relief lift the original flight deck uses
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

    // NASA/JPL-Caltech Ingenuity model (public domain), decoded from the same
    // Draco glTF the original flight deck ships. Scaled to an 18 m rotor span
    // for visibility, exactly like the original's TARGET_SPAN_M; the two
    // coaxial rotor assemblies counter-rotate at its calm 1.2 rad/s.
    var HELI = window.TRIAGE_HELI || null;
    var HELI_SPAN_M = 18;
    var ROTOR_RAD_PER_SEC = 1.2;
    var rotorAngle = 0;

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
    // Terrain: real Jezero Crater (USGS Mars 2020 CTX DEM + orthomosaic),
    // procedural stand-in until the assets arrive or if they fail
    // ------------------------------------------------------------------

    var TERRAIN_SEED = 0x4a505a;
    var TERRAIN_SEG = 84;
    var CRATERS = [[420, -300, 110], [-520, 430, 150], [150, 620, 80]];
    var real = null; // { sample(x,z), sizeM, originH, texel(x,z), landmarks }

    function proceduralHeight(x, z) {
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
        return h * flatten * CONFIG.VERT_EXAGGERATION;
    }

    // Terrain height (m) at local (x=east, z=south): real Jezero when loaded
    function heightAt(x, z) {
        if (real) return (real.sample(x, z) - real.originH) * CONFIG.VERT_EXAGGERATION;
        return proceduralHeight(x, z);
    }

    function terrainColorAt(x, z, h) {
        if (real) return real.texel(x, z);
        var dust = fbm2(x / 260 + 40, z / 260 + 40, TERRAIN_SEED + 55);
        var t = clamp((h + 16) / 68, 0, 1);
        return [
            (lerp(0.34, 0.62, t) + dust * 0.06) * 255,
            (lerp(0.2, 0.36, t) + dust * 0.035) * 255,
            (lerp(0.14, 0.24, t) + dust * 0.02) * 255
        ];
    }

    function terrainSizeM() {
        return real ? real.sizeM : 4600;
    }

    function imageData(img) {
        var c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        var g = c.getContext('2d');
        g.drawImage(img, 0, 0);
        return g.getImageData(0, 0, img.width, img.height);
    }

    function loadImage(url) {
        return new Promise(function (resolve, reject) {
            var img = new Image();
            img.onload = function () { resolve(img); };
            img.onerror = function () { reject(new Error('failed ' + url)); };
            img.src = url;
        });
    }

    function loadRealTerrain() {
        fetch('/demo/terrain/meta.json')
            .then(function (r) { if (!r.ok) throw new Error('meta'); return r.json(); })
            .then(function (meta) {
                return Promise.all([loadImage('/demo/terrain/heightmap.png'), loadImage('/demo/terrain/texture.jpg')])
                    .then(function (imgs) {
                        var hm = imageData(imgs[0]);
                        var tx = imageData(imgs[1]);
                        var n = hm.width;
                        var span = meta.heightMaxM - meta.heightMinM;
                        var heights = new Float32Array(n * n);
                        for (var i = 0; i < n * n; i++) {
                            // elevation packed 16-bit as R*256+G (bake_dem.py convention)
                            heights[i] = meta.heightMinM + ((hm.data[i * 4] * 256 + hm.data[i * 4 + 1]) / 65535) * span;
                        }
                        function sample(x, z) {
                            var fx = clamp((x / meta.sizeM + 0.5) * (n - 1), 0, n - 1);
                            var fz = clamp((z / meta.sizeM + 0.5) * (n - 1), 0, n - 1);
                            var x0 = Math.floor(fx), z0 = Math.floor(fz);
                            var x1 = Math.min(n - 1, x0 + 1), z1 = Math.min(n - 1, z0 + 1);
                            var tx2 = fx - x0, tz = fz - z0;
                            var h00 = heights[z0 * n + x0], h01 = heights[z0 * n + x1];
                            var h10 = heights[z1 * n + x0], h11 = heights[z1 * n + x1];
                            return (h00 * (1 - tx2) + h01 * tx2) * (1 - tz) + (h10 * (1 - tx2) + h11 * tx2) * tz;
                        }
                        var tn = tx.width;
                        function texel(x, z) {
                            // bilinear sample so adjacent quads blend smoothly
                            var fx = clamp((x / meta.sizeM + 0.5) * (tn - 1), 0, tn - 1);
                            var fz = clamp((z / meta.sizeM + 0.5) * (tn - 1), 0, tn - 1);
                            var x0 = Math.floor(fx), z0 = Math.floor(fz);
                            var x1 = Math.min(tn - 1, x0 + 1), z1 = Math.min(tn - 1, z0 + 1);
                            var u = fx - x0, v = fz - z0;
                            var out = [0, 0, 0];
                            for (var ch = 0; ch < 3; ch++) {
                                var c00 = tx.data[(z0 * tn + x0) * 4 + ch];
                                var c01 = tx.data[(z0 * tn + x1) * 4 + ch];
                                var c10 = tx.data[(z1 * tn + x0) * 4 + ch];
                                var c11 = tx.data[(z1 * tn + x1) * 4 + ch];
                                out[ch] = (c00 * (1 - u) + c01 * u) * (1 - v) + (c10 * (1 - u) + c11 * u) * v;
                            }
                            return out;
                        }
                        real = {
                            sizeM: meta.sizeM,
                            sample: sample,
                            texel: texel,
                            originH: sample(0, 0),
                            landmarks: (meta.landmarks || []).filter(function (l) {
                                return Math.abs(l.x) < meta.sizeM / 2 && Math.abs(l.z) < meta.sizeM / 2;
                            })
                        };
                        onTerrainReady();
                    });
            })
            .catch(function () { /* procedural stand-in keeps working */ });
    }

    // ------------------------------------------------------------------
    // Flight 6 reconstruction: anchored to the record, dramatized where the
    // record describes the event (glitch at T+54s, tilting up to 20 degrees)
    // ------------------------------------------------------------------

    function reconstructFlight6(f) {
        var rand = mulberry32(0x9e3779b9 ^ (f.flight * 2654435761));
        var dur = f.duration_s;                                  // 139.9 s
        var climbEnd = Math.min(30, dur * 0.15);
        var descentStart = dur - Math.min(30, dur * 0.15);
        var t0 = CONFIG.ANOMALY_START_S;

        // Two-leg ground track headed SSW then S (the record's route shape),
        // scaled so the total ground track equals the recorded 202.39 m.
        var sx = 4, sz = -6;
        var leg1H = 1.75 + (rand() - 0.5) * 0.1;  // radians: mostly +z (south), slightly -x
        var leg2H = 1.55 + (rand() - 0.5) * 0.08;
        var raw = [[sx, sz]];
        var L1 = 0.72, N = 400;
        for (var i = 1; i <= N; i++) {
            var u = i / N;
            var h = u < L1 ? leg1H : lerp(leg1H, leg2H, smoothstep((u - L1) / (1 - L1)));
            var step = 1;
            raw.push([
                raw[i - 1][0] + Math.cos(h) * step,
                raw[i - 1][1] + Math.sin(h) * step
            ]);
        }
        var len = 0, cum = [0];
        for (var j = 1; j <= N; j++) {
            len += Math.hypot(raw[j][0] - raw[j - 1][0], raw[j][1] - raw[j - 1][1]);
            cum.push(len);
        }
        var k = f.distance_m / len;
        for (var q = 0; q <= N; q++) {
            raw[q] = [sx + (raw[q][0] - sx) * k, sz + (raw[q][1] - sz) * k];
            cum[q] *= k;
        }
        function trackAt(s) {
            s = clamp(s, 0, cum[N]);
            var lo = 0, hi = N;
            while (lo < hi) { var mid = (lo + hi) >> 1; if (cum[mid] < s) lo = mid + 1; else hi = mid; }
            var i1 = Math.max(1, lo);
            var seg = cum[i1] - cum[i1 - 1] || 1;
            var t = (s - cum[i1 - 1]) / seg;
            var hdg = Math.atan2(raw[i1][1] - raw[i1 - 1][1], raw[i1][0] - raw[i1 - 1][0]);
            return [lerp(raw[i1 - 1][0], raw[i1][0], t), lerp(raw[i1 - 1][1], raw[i1][1], t), hdg];
        }

        // Groundspeed shape: cruise solved so covered distance matches the record,
        // with a peak touching the recorded max groundspeed.
        var vmax = f.speed_ms;
        var peakT = 40, peakW = 8;
        var cruise = vmax * 0.7;
        function speedShape(t) {
            var v;
            if (t < climbEnd) v = cruise * smoothstep(t / climbEnd);
            else if (t > descentStart) v = cruise * smoothstep((dur - t) / (dur - descentStart));
            else v = cruise * (0.94 + 0.06 * Math.sin(t / 9 + 1.7));
            var bump = Math.exp(-((t - peakT) * (t - peakT)) / (2 * peakW * peakW));
            v += (vmax - cruise) * bump * (t > climbEnd && t < descentStart ? 1 : 0);
            // post-glitch: visible surging as the controller fights bad timestamps
            if (t > t0 && t < descentStart) v *= 1 + 0.16 * Math.sin((t - t0) * 2.4) * anomalyAmp(t);
            return clamp(v, 0, vmax);
        }
        for (var iter = 0; iter < 4; iter++) {
            var integral = 0, steps = 300;
            for (var s2 = 0; s2 < steps; s2++) integral += speedShape((dur * s2) / steps) * (dur / steps);
            cruise = clamp(cruise * (f.distance_m / Math.max(1, integral)), 0.05, vmax);
        }

        // Anomaly envelope: ramps in over ~6s at T+54, sustains, eases on descent
        function anomalyAmp(t) {
            if (t <= t0) return 0;
            var ramp = smoothstep(clamp((t - t0) / 6, 0, 1));
            var settle = t > descentStart ? lerp(1, 0.45, smoothstep((t - descentStart) / (dur - descentStart))) : 1;
            var beat = 0.72 + 0.28 * Math.sin((t - t0) / 5.1);
            return ramp * settle * beat;
        }

        function pitchAt(t) {
            var base = 1.2 * Math.sin(t / 3.1) * (t > climbEnd && t < descentStart ? 1 : 0.4);
            // the record: tilting forward and backward up to 20 degrees
            return base + 20 * anomalyAmp(t) * Math.sin((t - t0) * 2 * Math.PI * 0.45);
        }

        function aglAt(t) {
            var cruiseAlt = f.altitude_m;
            var agl;
            if (t <= 0) agl = 0;
            else if (t < climbEnd) agl = cruiseAlt * smoothstep(t / climbEnd);
            else if (t <= descentStart) {
                var u = (t - climbEnd) / Math.max(1, descentStart - climbEnd);
                agl = cruiseAlt * (1 - 0.05 * (0.5 + 0.5 * Math.sin(u * Math.PI * 2)));
            } else if (t >= dur) agl = 0;
            else agl = cruiseAlt * (1 - smoothstep((t - descentStart) / (dur - descentStart)));
            // altitude excursions while the vehicle rocks
            agl += 1.4 * anomalyAmp(t) * Math.sin((t - t0) * 2 * Math.PI * 0.45 + 1.2);
            return Math.max(0, agl);
        }

        var path = [], channels = [];
        var dist = 0;
        for (var n2 = 0; n2 < CONFIG.SAMPLES_N; n2++) {
            var t = (dur * n2) / (CONFIG.SAMPLES_N - 1);
            var dt = dur / (CONFIG.SAMPLES_N - 1);
            var v = speedShape(t);
            if (n2 > 0) dist = Math.min(f.distance_m, dist + v * dt);
            var pos = trackAt(dist);
            // lateral wobble perpendicular to the heading while the anomaly is active
            var wob = 2.6 * anomalyAmp(t) * Math.sin((t - t0) * 2 * Math.PI * 0.45 + 0.6);
            var gx = pos[0] + Math.cos(pos[2] + Math.PI / 2) * wob;
            var gz = pos[1] + Math.sin(pos[2] + Math.PI / 2) * wob;
            var agl = aglAt(t);
            path.push({ x: gx, y: heightAt(gx, gz) + agl, z: gz });
            channels.push({ t: t, agl: agl, speed: v, pitch: Math.abs(pitchAt(t)), pitchSigned: pitchAt(t) });
        }

        return {
            flight: f,
            durationS: dur,
            climbEnd: climbEnd,
            descentStart: descentStart,
            anomalyStart: t0,
            path: path,
            channels: channels,
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

    // Mars daytime palette, matching the original flight deck: butterscotch
    // haze at the horizon, dustier tan overhead, fog toward the horizon color.
    var LIGHT = normalize([-0.72, 0.5, 0.34]);
    var SKY_ZENITH = [168, 152, 140];   // 0xa8988c
    var SKY_HORIZON = [228, 177, 132];  // 0xe4b184

    function normalize(v) {
        var l = Math.hypot(v[0], v[1], v[2]) || 1;
        return [v[0] / l, v[1] / l, v[2] / l];
    }

    // Camera views: Overview mirrors the original deck's bird's-eye framing
    // toward the western delta; Follow rides with the helicopter; Top looks
    // straight down at the route. Each keeps its own zoom.
    var VIEWS = {
        overview: { dist: 1900, phi: 0.62, theta: 0.93, autoOrbit: 0.02, follow: false },
        // Follow opens the show: a low hero shot of Ingenuity on the pad with
        // the western delta on the horizon behind it, then rides along.
        follow: { dist: 130, phi: 0.27, theta: 0.58, autoOrbit: 0, follow: true },
        top: { dist: 850, phi: 1.15, theta: 0.93, autoOrbit: 0, follow: false }
    };
    var cam = { theta: 0.58, phi: 0.27, dist: 130, target: [0, 20, 0] };
    var camVel = 0;
    var pathCenter = [0, 0, 0];

    var quads = [];
    function buildQuads() {
        quads = [];
        var half = terrainSizeM() / 2;
        function gridCoord(i) {
            var u = (i / TERRAIN_SEG) * 2 - 1;
            return half * Math.sign(u) * Math.pow(Math.abs(u), 1.5);
        }
        for (var i = 0; i < TERRAIN_SEG; i++) {
            for (var j = 0; j < TERRAIN_SEG; j++) {
                var x0 = gridCoord(i), z0 = gridCoord(j);
                var x1 = gridCoord(i + 1), z1 = gridCoord(j + 1);
                var y00 = heightAt(x0, z0), y10 = heightAt(x1, z0);
                var y01 = heightAt(x0, z1), y11 = heightAt(x1, z1);
                var ux = x1 - x0, uy = y11 - y00, uz = z1 - z0;
                var wx = x1 - x0, wy = y10 - y01, wz = z0 - z1;
                var n = normalize([uy * wz - uz * wy, uz * wx - ux * wz, ux * wy - uy * wx]);
                if (n[1] < 0) n = [-n[0], -n[1], -n[2]];
                var shade = 0.62 + 0.38 * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
                var cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
                var col = terrainColorAt(cx, cz, (y00 + y11) / 2);
                quads.push({
                    pts: [[x0, y00, z0], [x1, y10, z0], [x1, y11, z1], [x0, y01, z1]],
                    rgb: [col[0] * shade, col[1] * shade, col[2] * shade]
                });
            }
        }
        terrainPose = null;
    }

    function makeCameraFrame(W, H) {
        var eye = [
            cam.target[0] + cam.dist * Math.cos(cam.phi) * Math.cos(cam.theta),
            cam.target[1] + cam.dist * Math.sin(cam.phi),
            cam.target[2] + cam.dist * Math.cos(cam.phi) * Math.sin(cam.theta)
        ];
        var fwd = normalize([cam.target[0] - eye[0], cam.target[1] - eye[1], cam.target[2] - eye[2]]);
        // right = fwd x worldUp (right-handed, y-up): this keeps east/west and
        // north/south un-mirrored so the Jezero landscape matches reality
        var right = [-fwd[2], 0, fwd[0]];
        var rl = Math.hypot(right[0], right[2]);
        right = rl > 1e-4 ? [right[0] / rl, 0, right[2] / rl] : [1, 0, 0];
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
                return [W / 2 + (f * cx) / cz, H * 0.58 - (f * cy) / cz, cz];
            }
        };
    }

    function renderTerrain(W, H) {
        var key = [cam.theta.toFixed(3), cam.phi.toFixed(3), Math.round(cam.dist),
            Math.round(cam.target[0]), Math.round(cam.target[1]), Math.round(cam.target[2]),
            W, H, real ? 'r' : 'p'].join('|');
        if (terrainPose === key) return;
        terrainPose = key;
        terrainCanvas.width = W;
        terrainCanvas.height = H;
        var g = terrainCtx;
        var grad = g.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, 'rgb(' + SKY_ZENITH[0] + ',' + SKY_ZENITH[1] + ',' + SKY_ZENITH[2] + ')');
        grad.addColorStop(1, 'rgb(' + SKY_HORIZON[0] + ',' + SKY_HORIZON[1] + ',' + SKY_HORIZON[2] + ')');
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
        var S = terrainSizeM();
        for (var d = 0; d < drawList.length; d++) {
            var item = drawList[d];
            // fog toward the horizon color, same start/range shape as the original
            var fade = clamp((item.depth - S * 0.28) / (S * 1.17), 0, 0.92);
            var r = Math.round(lerp(item.rgb[0], SKY_HORIZON[0], fade));
            var gg = Math.round(lerp(item.rgb[1], SKY_HORIZON[1], fade));
            var b = Math.round(lerp(item.rgb[2], SKY_HORIZON[2], fade));
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

    function drawLandmarks(frame) {
        var marks = real ? real.landmarks : [{ name: 'Base station', x: 0, z: 0 }];
        ctx.font = '600 11px Inter, sans-serif';
        marks.forEach(function (l) {
            var y = heightAt(l.x, l.z);
            var p = frame.project([l.x, y + 4, l.z]);
            if (!p) return;
            ctx.fillStyle = 'rgba(0,39,76,0.95)';
            ctx.beginPath();
            ctx.moveTo(p[0], p[1] - 7);
            ctx.lineTo(p[0] - 5, p[1] + 4);
            ctx.lineTo(p[0] + 5, p[1] + 4);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            ctx.lineWidth = 3;
            ctx.strokeText(l.name, p[0] + 8, p[1] + 4);
            ctx.fillStyle = 'rgba(20,30,44,0.95)';
            ctx.fillText(l.name, p[0] + 8, p[1] + 4);
        });
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

        drawLandmarks(frame);

        function drawPath(from, to, style, width) {
            ctx.strokeStyle = style;
            ctx.lineWidth = width;
            ctx.beginPath();
            var started = false;
            for (var i = from; i <= to; i++) {
                var p = frame.project([r.path[i].x, r.path[i].y, r.path[i].z]);
                if (!p) { started = false; continue; }
                if (!started) { ctx.moveTo(p[0], p[1]); started = true; }
                else ctx.lineTo(p[0], p[1]);
            }
            ctx.stroke();
        }
        // dark navy path pops against the bright daytime regolith
        drawPath(idx, r.path.length - 1, 'rgba(0,39,76,0.35)', 1.6);
        drawPath(0, idx, 'rgba(0,39,76,0.95)', 3);

        // Helicopter: the NASA Ingenuity model, pitch-rocking after the glitch
        var hp = r.path[idx];
        var sampleNow = sampleAt(r.channels, progress);
        var groundY = heightAt(hp.x, hp.z);
        var shadow = frame.project([hp.x, groundY + 0.5, hp.z]);
        var heli = frame.project([hp.x, hp.y, hp.z]);
        var heading = 0;
        if (idx < r.path.length - 1) {
            var np = r.path[Math.min(r.path.length - 1, idx + 2)];
            if (Math.hypot(np.x - hp.x, np.z - hp.z) > 0.05) {
                heading = Math.atan2(np.z - hp.z, np.x - hp.x);
                lastHeading = heading;
            } else {
                heading = lastHeading;
            }
        } else {
            heading = lastHeading;
        }
        if (shadow && heli) {
            ctx.strokeStyle = 'rgba(0,39,76,0.35)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(shadow[0], shadow[1]);
            ctx.lineTo(heli[0], heli[1]);
            ctx.stroke();
            var shScale = clamp(3400 / heli[2], 0.55, 2.6);
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.beginPath();
            ctx.ellipse(shadow[0], shadow[1], 6 * shScale, 2.4 * shScale, 0, 0, Math.PI * 2);
            ctx.fill();

            var screenSpan = (H * 1.25 * HELI_SPAN_M) / heli[2];
            if (HELI && screenSpan > 22) {
                drawHeliModel(frame, hp, heading, sampleNow.pitchSigned || 0);
            } else {
                drawHeliGlyph(heli, sampleNow.pitchSigned || 0, shScale);
            }
        }

        // Data credit, always visible on the deck
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = 'rgba(20,30,44,0.75)';
        ctx.textAlign = 'right';
        ctx.fillText((real ? 'Terrain: NASA/JPL-Caltech/USGS (Mars 2020 CTX)' : 'Terrain: procedural stand-in') +
            (HELI ? ' · Model: NASA/JPL-Caltech' : ''), W - 10, H - 8);
        ctx.textAlign = 'left';
    }

    var lastHeading = 1.65; // initial nose direction, roughly along the planned route

    // Render the decoded NASA Ingenuity mesh: rotor spin about the mast, pitch
    // rocking about the lateral axis, yaw along the flight heading, painter-sorted
    // flat-shaded triangles.
    function drawHeliModel(frame, hp, heading, pitchDeg) {
        var pitch = (pitchDeg * Math.PI) / 180;
        var cosP = Math.cos(pitch), sinP = Math.sin(pitch);
        var yaw = -heading; // world z is south; yaw about +y maps model +x onto the heading
        var cosY = Math.cos(yaw), sinY = Math.sin(yaw);
        var cosR = Math.cos(rotorAngle), sinR = Math.sin(rotorAngle);

        var tris = [];
        ['body', 'rotorA', 'rotorB'].forEach(function (partName) {
            var part = HELI.parts[partName];
            var v = part.v, f = part.f, runs = part.runs;
            var n = v.length / 3;
            var px = new Float32Array(n), py = new Float32Array(n), pz = new Float32Array(n);
            var sx = new Float32Array(n), sy = new Float32Array(n), sz = new Float32Array(n);
            var spin = partName === 'rotorA' ? 1 : partName === 'rotorB' ? -1 : 0;
            var cR = spin ? Math.cos(spin * rotorAngle) : 1;
            var sR = spin ? Math.sin(spin * rotorAngle) : 0;
            for (var i = 0; i < n; i++) {
                var x = v[i * 3], y = v[i * 3 + 1], z = v[i * 3 + 2];
                if (spin) { // rotor spin about the mast (model y axis)
                    var rx = x * cR - z * sR;
                    z = x * sR + z * cR;
                    x = rx;
                }
                // pitch about the lateral (model z) axis
                var px1 = x * cosP - y * sinP;
                var py1 = x * sinP + y * cosP;
                // yaw about y, then scale to the scene footprint
                var wx = (px1 * cosY + z * sinY) * HELI_SPAN_M;
                var wz = (-px1 * sinY + z * cosY) * HELI_SPAN_M;
                var wy = py1 * HELI_SPAN_M;
                px[i] = hp.x + wx; py[i] = hp.y + wy; pz[i] = hp.z + wz;
                var pr = frame.project([px[i], py[i], pz[i]]);
                if (pr) { sx[i] = pr[0]; sy[i] = pr[1]; sz[i] = pr[2]; }
                else { sz[i] = -1; }
            }
            var fi = 0;
            runs.forEach(function (run) {
                var count = run[0], color = HELI.palette[run[1]];
                for (var k = 0; k < count; k++, fi++) {
                    var a = f[fi * 3], b = f[fi * 3 + 1], c = f[fi * 3 + 2];
                    if (sz[a] < 0 || sz[b] < 0 || sz[c] < 0) continue;
                    // flat shade from the world-space face normal
                    var ux = px[b] - px[a], uy = py[b] - py[a], uz = pz[b] - pz[a];
                    var wx2 = px[c] - px[a], wy2 = py[c] - py[a], wz2 = pz[c] - pz[a];
                    var nx = uy * wz2 - uz * wy2, ny = uz * wx2 - ux * wz2, nz = ux * wy2 - uy * wx2;
                    var nl = Math.hypot(nx, ny, nz) || 1;
                    var diff = Math.abs((nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]) / nl);
                    var shade = 0.5 + 0.5 * diff;
                    tris.push({
                        d: (sz[a] + sz[b] + sz[c]) / 3,
                        x1: sx[a], y1: sy[a], x2: sx[b], y2: sy[b], x3: sx[c], y3: sy[c],
                        col: 'rgb(' + Math.round(color[0] * shade) + ',' + Math.round(color[1] * shade) + ',' + Math.round(color[2] * shade) + ')'
                    });
                }
            });
        });
        tris.sort(function (a, b) { return b.d - a.d; });
        for (var t = 0; t < tris.length; t++) {
            var tr = tris[t];
            ctx.fillStyle = tr.col;
            ctx.strokeStyle = tr.col;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(tr.x1, tr.y1);
            ctx.lineTo(tr.x2, tr.y2);
            ctx.lineTo(tr.x3, tr.y3);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
    }

    // Distant fallback: the simple marker used when the model would be tiny
    function drawHeliGlyph(heli, pitchDeg, scale) {
        ctx.save();
        ctx.translate(heli[0], heli[1]);
        ctx.rotate((pitchDeg * Math.PI) / 180 * 0.8);
        ctx.fillStyle = '#F5F2E9';
        ctx.strokeStyle = 'rgba(20,30,44,0.8)';
        ctx.lineWidth = 1;
        ctx.fillRect(-4 * scale, -3 * scale, 8 * scale, 6 * scale);
        ctx.strokeRect(-4 * scale, -3 * scale, 8 * scale, 6 * scale);
        ctx.fillStyle = '#B58900';
        ctx.fillRect(-4 * scale, -3 * scale, 8 * scale, 2 * scale);
        ctx.strokeStyle = 'rgba(35,42,54,0.9)';
        ctx.lineWidth = 1.4 * scale;
        [rotorAngle * 4, -rotorAngle * 4 + Math.PI / 2].forEach(function (aRot) {
            var rx = Math.cos(aRot) * 13 * scale;
            var rz = Math.sin(aRot) * 4.5 * scale;
            ctx.beginPath();
            ctx.moveTo(-rx, -5 * scale - rz * 0.4);
            ctx.lineTo(rx, -5 * scale + rz * 0.4);
            ctx.stroke();
        });
        ctx.restore();
    }

    // ------------------------------------------------------------------
    // Strip charts (SVG) with a synchronized playhead
    // ------------------------------------------------------------------

    var CHART_DEFS = [
        { key: 'agl', label: 'Altitude AGL', unit: 'm', color: '#3E8FD9', env: function (r) { return r.envAltHi; }, envLabel: 'fleet envelope' },
        { key: 'speed', label: 'Groundspeed', unit: 'm/s', color: '#B58900', env: function (r) { return r.envSpdHi; }, envLabel: 'fleet envelope' },
        { key: 'pitch', label: 'Pitch excursion', unit: 'deg', color: '#7FA8C9', env: function () { return CONFIG.PITCH_ALERT_DEG; }, envLabel: 'alert' }
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
            var env = def.env(r);
            var vmax = Math.max.apply(null, vals.concat(env < Math.max.apply(null, vals) * 3 ? [env] : [0])) * 1.12 || 1;

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
            if (env < vmax) {
                svg += '<line x1="' + padL + '" x2="' + (W - padR) + '" y1="' + Y(env) + '" y2="' + Y(env) + '" class="chart-env"/>';
                svg += '<text x="' + (padL + 4) + '" y="' + (Y(env) - 3) + '" class="chart-env-label" text-anchor="start">' + def.envLabel + '</text>';
            }
            // mark the anomaly onset on every chart
            var ax = X(r.anomalyStart);
            svg += '<line x1="' + ax + '" x2="' + ax + '" y1="' + padT + '" y2="' + (padT + ih) + '" class="chart-event"/>';
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
    // Alarm: the navigation anomaly comes on at T+54s and stays on
    // ------------------------------------------------------------------

    var alarmBadge = document.getElementById('alarm-badge');
    var deckPanel = document.getElementById('deck-panel');

    function updateAlarm() {
        var r = state.recon;
        var sample = sampleAt(r.channels, state.t / r.durationS);
        var alarm = null;
        if (state.t >= r.anomalyStart) {
            alarm = { text: 'NAVIGATION ANOMALY', cls: 'alarm-red' };
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
    // Playback with a slow cinematic orbit (drag to take over, momentum kept)
    // ------------------------------------------------------------------

    var state = {
        recon: null,
        t: 0,
        playing: false,
        speed: 1,
        view: 'follow',
        zoom: 1,
        liveResults: {},
        dispositions: loadDispositions()
    };

    var playBtn = document.getElementById('play-btn');
    var scrubber = document.getElementById('scrubber');
    var timeReadout = document.getElementById('time-readout');
    var lastFrame = null;

    function setPlaying(playing) {
        var was = state.playing;
        state.playing = playing;
        playBtn.innerHTML = playing ? '&#10074;&#10074;' : '&#9654;';
        playBtn.setAttribute('aria-label', playing ? 'Pause the replay' : 'Play the replay');
        if (playing && !was) {
            // only start a new frame loop if one is not already running
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
        rotorAngle += dt * ROTOR_RAD_PER_SEC; // calm, watchable spin, like the original
        if (state.t >= state.recon.durationS) {
            state.t = state.recon.durationS;
            setPlaying(false);
        }
        var view = VIEWS[state.view];
        if (view.autoOrbit && !dragging && !camVel && !reducedMotion) {
            cam.theta += dt * view.autoOrbit; // gentle cinematic orbit in Overview
        }
        stepCameraFollow();
        stepCameraInertia();
        drawTick();
        if (state.playing) requestAnimationFrame(tick);
    }

    // Follow view: the camera target glides after the helicopter
    function stepCameraFollow() {
        if (!VIEWS[state.view].follow || !state.recon) return;
        var r = state.recon;
        var idx = clamp(Math.round((state.t / r.durationS) * (r.path.length - 1)), 0, r.path.length - 1);
        var hp = r.path[idx];
        cam.target = [
            lerp(cam.target[0], hp.x, 0.1),
            lerp(cam.target[1], hp.y, 0.1),
            lerp(cam.target[2], hp.z, 0.1)
        ];
    }

    function drawTick() {
        scrubber.value = String(Math.round((state.t / state.recon.durationS) * 1000));
        timeReadout.textContent = 'T+' + state.t.toFixed(1) + 's / ' + state.recon.durationS.toFixed(1) + 's';
        renderDeck();
        updateCharts();
        updateAlarm();
    }

    var dragging = false;
    var lastPointer = null;
    var pointerHistory = [];

    canvas.addEventListener('pointerdown', function (e) {
        dragging = true;
        camVel = 0;
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
    canvas.addEventListener('wheel', function (e) {
        e.preventDefault();
        setZoom(state.zoom * Math.exp(e.deltaY * 0.0012));
    }, { passive: false });

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
        var f = flights[CONFIG.FLIGHT - 1];
        var a = analyses[f.flight];
        var n = getNarrative(f.flight);
        var dispo = state.dispositions[f.flight];

        var html = '<h2>Example GenAI narrative</h2>';
        html += '<div class="record-block"><strong>Public record.</strong> ' + esc(f.summary) + '</div>';

        html += '<div class="flag-chips">';
        var allFlags = a.metricFlags.map(function (mf) { return mf.text; }).concat(a.eventFlags);
        if (allFlags.length) {
            allFlags.forEach(function (t) {
                html += '<span class="flag-chip">' + esc(t) + '</span>';
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
    // Boot
    // ------------------------------------------------------------------

    function computePathCenter() {
        var r = state.recon;
        var minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
        r.path.forEach(function (p) {
            minX = Math.min(minX, p.x); maxX = Math.max(maxX, p.x);
            minZ = Math.min(minZ, p.z); maxZ = Math.max(maxZ, p.z);
        });
        pathCenter = [(minX + maxX) / 2, 22, (minZ + maxZ) / 2];
    }

    function applyView(name) {
        state.view = name;
        var v = VIEWS[name];
        cam.dist = v.dist * state.zoom;
        cam.phi = v.phi;
        cam.theta = v.theta;
        camVel = 0;
        if (v.follow && state.recon) {
            var idx = clamp(Math.round((state.t / state.recon.durationS) * (state.recon.path.length - 1)), 0, state.recon.path.length - 1);
            var hp = state.recon.path[idx];
            cam.target = [hp.x, hp.y, hp.z];
        } else {
            // Overview leans slightly toward the western delta, like the original
            cam.target = name === 'overview'
                ? [pathCenter[0] - 220, pathCenter[1], pathCenter[2] - 180]
                : pathCenter.slice();
        }
        Array.prototype.forEach.call(document.querySelectorAll('.view-btn'), function (b) {
            var active = b.getAttribute('data-view') === name;
            b.classList.toggle('active', active);
            b.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
        terrainPose = null;
        if (state.recon && !state.playing) drawTick();
    }

    function setZoom(mult) {
        state.zoom = clamp(mult, 0.35, 3.2);
        cam.dist = clamp(VIEWS[state.view].dist * state.zoom, 80, terrainSizeM() * 0.7);
        terrainPose = null;
        if (state.recon && !state.playing) drawTick();
    }

    function rebuildScene(preserveTime) {
        var tSave = preserveTime && state.recon ? state.t : 0;
        var wasPlaying = state.playing;
        state.recon = reconstructFlight6(flights[CONFIG.FLIGHT - 1]);
        state.t = Math.min(tSave, state.recon.durationS);
        buildQuads();
        computePathCenter();
        applyView(state.view);
        buildCharts();
        drawTick();
        if (!wasPlaying) setPlaying(!reducedMotion);
    }

    function onTerrainReady() {
        rebuildScene(true);
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
        var f = flights[CONFIG.FLIGHT - 1];
        document.getElementById('deck-meta').textContent =
            'Flight ' + f.flight + ' · ' + f.date + ' · Sol ' + f.sol + ' · ' + f.duration_s + 's · ' +
            f.altitude_m + 'm max · ' + f.distance_m + 'm · anomaly at T+54s';

        playBtn.addEventListener('click', function () {
            if (state.t >= state.recon.durationS) state.t = 0;
            setPlaying(!state.playing);
        });
        scrubber.addEventListener('input', function () {
            state.t = (Number(scrubber.value) / 1000) * state.recon.durationS;
            stepCameraFollow();
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
        Array.prototype.forEach.call(document.querySelectorAll('.view-btn'), function (btn) {
            btn.addEventListener('click', function () { applyView(btn.getAttribute('data-view')); });
        });
        document.getElementById('restart-btn').addEventListener('click', function () {
            state.t = 0;
            stepCameraFollow();
            setPlaying(true);
        });
        document.getElementById('anomaly-btn').addEventListener('click', function () {
            state.t = Math.max(0, CONFIG.ANOMALY_START_S - 5); // arrive just before the glitch
            stepCameraFollow();
            setPlaying(true);
        });
        document.getElementById('zoom-in').addEventListener('click', function () { setZoom(state.zoom * 0.8); });
        document.getElementById('zoom-out').addEventListener('click', function () { setZoom(state.zoom * 1.25); });

        window.addEventListener('resize', sizeCanvas);
        sizeCanvas();
        rebuildScene(false);
        renderNarrative();
        renderEvals();
        renderDataTable();
        loadRealTerrain();
    }

    init();
})();
