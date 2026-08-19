/*
 * Walt Disney Imagineering page.
 *
 * Renders synchronously, before script.js, so that script.js finds a complete
 * DOM for the photo sliders, nav, scroll animations, and shared modal shell.
 *
 * Three things here that the shared template does not do:
 *   1. A castle opening animation, the Disney answer to the Block M one.
 *   2. A playable show control cue sheet for the haunted house I ran.
 *   3. An interactive Pepper's Ghost diagram, the trick at the middle of it.
 *
 * Copy for the projects, case studies, and timeline still comes from
 * portfolio/content.js. Nothing is duplicated here.
 */
(function (global) {
    'use strict';

    var C = global.PortfolioContent;

    function esc(v) {
        return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function robot(id) {
        for (var i = 0; i < C.ROBOTICS.length; i++) {
            if (C.ROBOTICS[i].id === id) return C.ROBOTICS[i];
        }
        return null;
    }

    function work(id) {
        for (var i = 0; i < C.AI_WORK.length; i++) {
            if (C.AI_WORK[i].id === id) return C.AI_WORK[i];
        }
        return null;
    }

    /* ============================================================ */
    /* Opening animation                                            */
    /* ============================================================ */

    /* Two tall towers over a low middle. The silhouette goes tall, low, tall,
       which is a castle from the front and an M from across the room. */
    var CASTLE = [
        'M 18 210 L 18 62 L 44 8 L 70 62 L 70 210',
        'M 170 210 L 170 62 L 196 8 L 222 62 L 222 210',
        'M 70 210 L 70 140 L 120 96 L 170 140 L 170 210',
        'M 102 210 L 102 180 A 18 18 0 0 1 138 180 L 138 210',
        'M 44 8 L 44 -16 L 68 -6 L 44 3',
        'M 196 8 L 196 -16 L 220 -6 L 196 3'
    ];

    var WINDOWS = [
        [30, 86, 13, 19], [177, 86, 13, 19],
        [30, 124, 13, 19], [177, 124, 13, 19],
        [84, 158, 12, 17], [144, 158, 12, 17],
        [113, 144, 14, 17]
    ];

    function starField(count, seedClass) {
        var out = '';
        for (var i = 0; i < count; i++) {
            /* Deterministic scatter, so the sky does not jump between renders. */
            var x = (i * 37.4 + 11) % 100;
            var y = (i * 61.7 + 5) % 100;
            var d = ((i * 13) % 24) / 10;
            var s = 1 + ((i * 7) % 3) * 0.6;
            out += '<span class="' + seedClass + '" style="left:' + x.toFixed(2) + '%;top:' +
                y.toFixed(2) + '%;width:' + s + 'px;height:' + s +
                'px;animation-delay:' + d.toFixed(1) + 's"></span>';
        }
        return out;
    }

    function introMarkup() {
        var windows = WINDOWS.map(function (w, i) {
            return '<rect class="castle-window" x="' + w[0] + '" y="' + w[1] + '" width="' + w[2] +
                '" height="' + w[3] + '" rx="6" style="animation-delay:' + (1.55 + i * 0.07).toFixed(2) + 's"/>';
        }).join('');

        var body = CASTLE.map(function (d) {
            return '<path class="castle-body" d="' + d + '"/>';
        }).join('');

        var lines = CASTLE.map(function (d, i) {
            return '<path class="castle-line" d="' + d + '" pathLength="1" style="animation-delay:' +
                (0.45 + i * 0.09).toFixed(2) + 's"/>';
        }).join('');

        /* Trailing sparkles: same flight path, staggered, fading behind the head.
           The head carries a soft glow so the arc reads at small sizes. */
        var spark = '<circle class="castle-spark" r="17" fill="url(#castle-glow)" ' +
            'style="animation-delay:1.45s"/>';
        for (var i = 0; i < 8; i++) {
            spark += '<circle class="castle-spark" r="' + (6.5 - i * 0.68).toFixed(2) +
                '" fill="var(--gold)" opacity="' + (1 - i * 0.11).toFixed(2) +
                '" style="animation-delay:' + (1.45 + i * 0.032).toFixed(3) + 's"/>';
        }

        var rays = [0, 45, 90, 135].map(function (deg) {
            var r = deg * Math.PI / 180;
            return '<line x1="' + (120 + Math.cos(r) * 15).toFixed(1) + '" y1="' + (-24 + Math.sin(r) * 15).toFixed(1) +
                   '" x2="' + (120 - Math.cos(r) * 15).toFixed(1) + '" y2="' + (-24 - Math.sin(r) * 15).toFixed(1) + '"/>';
        }).join('');

        var burst =
            '<g class="castle-burst">' +
                '<circle cx="120" cy="-24" r="34" fill="url(#castle-glow)"/>' +
                '<circle cx="120" cy="-24" r="13" fill="none" stroke="var(--gold)" stroke-width="3.5"/>' +
                '<g stroke="var(--gold)" stroke-width="3.5" stroke-linecap="round">' + rays + '</g>' +
            '</g>';

        var defs =
            '<defs><radialGradient id="castle-glow">' +
                '<stop offset="0%" stop-color="var(--gold)" stop-opacity="0.95"/>' +
                '<stop offset="45%" stop-color="var(--gold)" stop-opacity="0.35"/>' +
                '<stop offset="100%" stop-color="var(--gold)" stop-opacity="0"/>' +
            '</radialGradient></defs>';

        return '' +
        '<div class="castle-overlay" id="castle-overlay" role="presentation">' +
            '<div class="castle-sky">' + starField(80, 'castle-star') + '</div>' +
            '<div class="castle-stage">' +
                '<span class="castle-word castle-word-left">JA</span>' +
                '<svg class="castle-mark" viewBox="-40 -62 320 292" aria-hidden="true">' +
                    defs +
                    '<g>' + body + lines + windows + '</g>' +
                    spark + burst +
                '</svg>' +
                '<span class="castle-word castle-word-right">ES</span>' +
            '</div>' +
        '</div>';
    }

    function runIntro() {
        var overlay = document.getElementById('castle-overlay');
        if (!overlay) return;

        var body = document.body;
        var reduced = global.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var seen = false;
        try { seen = sessionStorage.getItem('disneyIntroSeen') === '1'; } catch (e) {}

        var done = false;
        function finish() {
            if (done) return;
            done = true;
            overlay.classList.add('is-done');
            body.classList.remove('castle-running');
            setTimeout(function () { overlay.style.display = 'none'; }, 800);
        }

        if (seen) {
            overlay.style.display = 'none';
            return;
        }
        try { sessionStorage.setItem('disneyIntroSeen', '1'); } catch (e) {}

        body.classList.add('castle-running');
        overlay.addEventListener('pointerdown', finish);
        document.addEventListener('keydown', finish, { once: true });
        setTimeout(finish, reduced ? 900 : 3200);
    }

    /* ============================================================ */
    /* Page sections                                                */
    /* ============================================================ */

    var NAV = [
        ['home', 'Home'],
        ['why', 'Why Imagineering'],
        ['walk', 'The walkthrough'],
        ['cannon', 'The cannon'],
        ['first', 'FIRST'],
        ['people', 'People'],
        ['software', 'Software'],
        ['contact', 'Contact']
    ];

    function nav() {
        return '' +
        '<nav class="navbar"><div class="nav-container">' +
            '<div class="nav-logo"><a href="#home">JAMES OOSTERHOUSE</a></div>' +
            '<ul class="nav-menu">' +
                NAV.map(function (n) {
                    return '<li><a href="#' + n[0] + '" class="nav-link">' + esc(n[1]) + '</a></li>';
                }).join('') +
            '</ul>' +
            '<div class="hamburger"><span></span><span></span><span></span></div>' +
        '</div></nav>';
    }

    function hero() {
        return '' +
        '<section id="home" class="hero">' +
            '<div class="hero-background">' +
                '<div class="photo-slider photo-slider-left"></div>' +
                '<div class="photo-slider photo-slider-right"></div>' +
                '<div class="hero-overlay"></div>' +
                '<div class="night-sky">' + starField(45, 'castle-star') + '</div>' +
            '</div>' +
            '<div class="hero-content">' +
                '<p class="hero-kicker">For Walt Disney Imagineering</p>' +
                '<h1 class="hero-title">James Oosterhouse</h1>' +
                '<p class="hero-subtitle">Engineer. Servant Leader. Believer.</p>' +
                '<p class="hero-description">I built a haunted house for over 200 residents with a Pepper\'s Ghost illusion, a portrait that changed while you were looking at it, and six speakers hidden in a dorm hallway. I also built the world\'s most powerful mobile robotic t-shirt cannon, and spent a summer at NASA JPL measuring how people really use the tools we hand them. Imagineering is the only place I know of where those three are the same job.</p>' +
                '<div class="hero-cta-row">' +
                    '<a href="#walk" class="cta-button">Walk my haunted house</a>' +
                    '<a href="#why" class="cta-button cta-secondary">Why Imagineering</a>' +
                '</div>' +
                '<p class="hero-now"><strong>Now:</strong> Robotics Engineering at the University of Michigan, minoring in Coaching &amp; Leadership. <strong>Recently:</strong> NASA JPL.</p>' +
            '</div>' +
        '</section>';
    }

    var WHY = [
        ['Creative', 'I already build shows',
         'The Ghost of Alice Lloyd ran for over 200 residents on a budget of almost nothing. A Pepper\'s Ghost illusion, a living picture frame, black light, six JBL speakers, and a cast of fellow RAs I had to direct. I designed it, built it, sequenced it, and performed in it. There is a 3D walkthrough of it a little further down this page.'],
        ['Ambitious', 'I keep building the bigger version',
         'Nobody asked for a t-shirt cannon robot, so two friends and I built the most powerful mobile one in the world and Koops still takes it to events. Nobody asked an intern to build an LLM suite either. I pitched it, built it, and around 40 people use it every day. When I can see the better version of a thing, I have a hard time leaving it alone.'],
        ['People centered', 'The person in the seat is the whole job',
         'At NASA JPL I spent a summer measuring what operators did with a tool rather than what they said about it, down to where their eyes landed on the screen. I run a haunted house the same way I ran that study. Watch where people look, watch where they hesitate, then change the thing. I am also a Resident Advisor and a Coaching and Leadership minor, which is a long way of saying I like people.']
    ];

    function why() {
        return '' +
        '<section id="why" class="about">' +
            '<div class="container">' +
                '<h2 class="section-title">Why Imagineering</h2>' +
                '<p class="section-intro">Imagineering is the one place where the illusion, the machine, and the person watching are all the same problem. Here is my case, in three parts.</p>' +
                '<div class="about-grid fit-grid">' +
                    WHY.map(function (w) {
                        return '<div class="about-card fit-card">' +
                            '<p class="section-kicker" style="text-align:left">' + esc(w[0]) + '</p>' +
                            '<h3>' + esc(w[1]) + '</h3><p>' + w[2] + '</p></div>';
                    }).join('') +
                '</div>' +
            '</div>' +
        '</section>';
    }

    /* ---------------- The walkthrough ---------------- */

    /* Stations transcribed from jameso107/haunted so the numbers on this page
       match the numbered sprites you see standing in the scene. Em dashes in
       the original descriptions are normalized, per the site's copy rule. */
    var STATIONS = [
        [2,  'The Strike',       'elevator ride, LED flicker, thunder, blackout'],
        [3,  'Arrival 1950',     'banner, phonograph big band, period greeter'],
        [4,  'The Promenade',    'period posters, dance-card table, a lurker'],
        [5,  'Portrait Gallery', 'living portrait. Walk close to the red frame'],
        [6,  "Dean's Office",    "rocking chair rig, ledger with tonight's names"],
        [7,  "Pepper's Ghost",   'watch the window, she appears over the gallery'],
        [8,  'The Bulletin',     'the radio announces her death and the lights glitch'],
        [9,  'Whisper Hall',     'pitch dark, cheesecloth brushes past'],
        [10, 'The Bust',         'projected face on the foam heads'],
        [11, 'The Tomb',         'eyes forward on the tombstone, keep walking'],
        [12, 'Back to 2026',     'fluorescent hum, check the corkboard']
    ];

    function walkSection() {
        var stations = STATIONS.map(function (st) {
            return '<li class="station">' +
                '<span class="station-n">' + st[0] + '</span>' +
                '<span class="station-copy"><strong>' + esc(st[1]) + '</strong>' +
                '<span>' + esc(st[2]) + '</span></span>' +
            '</li>';
        }).join('');

        return '' +
        '<section id="walk" class="showctl">' +
            '<div class="container">' +
                '<p class="section-kicker">Concept art you can walk</p>' +
                '<h2 class="section-title">Walk the haunted house</h2>' +
                '<p class="section-intro">The haunt ran for one night in a dorm hallway, so I rebuilt it in a browser where it can keep running. This is not a video. It is a first-person walkthrough of the Alice Lloyd Haunt with walls you bump into, the elevator ride that opens the show, a portrait that changes when you get close, Alice arriving in the glass, and a tomb you should keep walking past. Click in and take a lap.</p>' +
                '<div class="walk-frame">' +
                    '<iframe id="walk-stage" class="walk-stage" src="/haunt" loading="lazy" ' +
                        'allow="pointer-lock; fullscreen" ' +
                        'title="Alice Lloyd Haunt, first person 3D walkthrough"></iframe>' +
                '</div>' +
                '<div class="walk-bar">' +
                    '<span class="walk-hint"><strong>Click inside to take the controls.</strong> ' +
                        'W A S D to walk, mouse to look, Shift to run, Tab for a bird\'s eye view, G for the route arrows. ' +
                        '<em>It wants a keyboard, so a laptop is the right place for it.</em></span>' +
                    '<button type="button" class="transport-btn" id="walk-full">Full screen</button>' +
                    '<a class="transport-btn" href="/haunt" target="_blank" rel="noopener">Open in its own tab</a>' +
                '</div>' +
                '<h3 class="walk-route-title">The route</h3>' +
                '<ol class="walk-stations">' + stations + '</ol>' +
                '<p class="showctl-note">Schematic scale, built to carry the route and the sightlines rather than to be pretty. Every sound in it is generated in the browser rather than loaded from a file. ' +
                'Video of the night itself, all 200 plus residents of it: ' +
                '<button type="button" class="ai-card-link" onclick="openShowcase(\'haunted-house\')">watch the walkthrough</button>. ' +
                'Source for this one is <a href="https://github.com/jameso107/haunted" target="_blank" rel="noopener">on GitHub</a>.</p>' +
            '</div>' +
        '</section>';
    }

    /* ---------------- Pepper's Ghost ---------------- */

    function pepperSection() {
        return '' +
        '<section id="pepper" class="pepper">' +
            '<div class="container">' +
                '<p class="section-kicker">The trick in the middle of it</p>' +
                '<h2 class="section-title">Pepper\'s Ghost</h2>' +
                '<p class="section-intro">Station 7 up there is this trick, and it is the same principle the Haunted Mansion ballroom runs on. A sheet of glass at 45 degrees, a chamber the guest cannot see, and a light you bring up slowly. Drag the slider and watch Alice arrive.</p>' +
                '<div class="pepper-frame">' +
                    '<div class="showctl-panel">' +
                        '<h3>Side elevation</h3>' +
                        '<svg class="pepper-svg" viewBox="0 0 520 300" role="img" aria-label="Side view: the guest looks through angled glass at the set. A hidden chamber below reflects off the glass, so the guest sees the ghost superimposed on the set.">' +
                            '<circle cx="44" cy="120" r="11" fill="#8FD3FF"/>' +
                            '<text x="44" y="150" text-anchor="middle" fill="#8FD3FF" font-family="Inter, sans-serif" font-size="11">GUEST</text>' +
                            '<line x1="285" y1="75" x2="375" y2="165" stroke="#BCE6FF" stroke-width="4" opacity="0.55"/>' +
                            '<text x="266" y="66" fill="#BCE6FF" font-family="Inter, sans-serif" font-size="11">GLASS 45&#176;</text>' +
                            '<rect x="430" y="76" width="70" height="90" rx="6" fill="#16225E" stroke="#8FD3FF" stroke-width="1.5"/>' +
                            '<text x="465" y="184" text-anchor="middle" fill="#8FD3FF" font-family="Inter, sans-serif" font-size="11">SET</text>' +
                            '<rect id="pg-chamber" x="292" y="212" width="76" height="62" rx="6" fill="#F4C95D" stroke="#F4C95D" stroke-width="1.4" opacity="0.1"/>' +
                            '<g id="pg-actor" opacity="0.25">' +
                                '<ellipse cx="330" cy="248" rx="15" ry="20" fill="#BCE6FF"/>' +
                                '<circle cx="330" cy="226" r="8" fill="#BCE6FF"/>' +
                            '</g>' +
                            '<text x="330" y="290" text-anchor="middle" fill="#F4C95D" font-family="Inter, sans-serif" font-size="11">HIDDEN CHAMBER</text>' +
                            '<line x1="58" y1="120" x2="428" y2="120" stroke="#8FD3FF" stroke-width="1.6" stroke-dasharray="6 5" opacity="0.5"/>' +
                            '<g id="pg-rays" opacity="0.15">' +
                                '<line x1="330" y1="212" x2="330" y2="120" stroke="#F4C95D" stroke-width="2"/>' +
                                '<line x1="330" y1="120" x2="58" y2="120" stroke="#F4C95D" stroke-width="2"/>' +
                                '<polygon points="330,206 326,216 334,216" fill="#F4C95D"/>' +
                            '</g>' +
                            '<g id="pg-virtual" opacity="0">' +
                                '<ellipse cx="404" cy="120" rx="15" ry="20" fill="#BCE6FF" opacity="0.3"/>' +
                                '<circle cx="404" cy="98" r="8" fill="#BCE6FF" opacity="0.3"/>' +
                                '<text x="404" y="160" text-anchor="middle" fill="#BCE6FF" font-family="Inter, sans-serif" font-size="10" opacity="0.8">apparent position</text>' +
                            '</g>' +
                        '</svg>' +
                        '<div class="pepper-controls">' +
                            '<label for="pg-slider">Hidden chamber light</label>' +
                            '<input type="range" id="pg-slider" min="0" max="100" value="0" aria-label="Hidden chamber light level">' +
                            '<span class="pepper-readout" id="pg-readout">0%</span>' +
                        '</div>' +
                    '</div>' +
                    '<div class="showctl-panel">' +
                        '<h3>What the guest sees</h3>' +
                        '<svg class="pepper-svg" viewBox="0 0 340 300" role="img" aria-label="The guest view: the set, with the ghost fading in over it as the chamber light rises.">' +
                            '<rect x="0" y="0" width="340" height="300" fill="#0B1440"/>' +
                            '<rect x="40" y="60" width="260" height="190" rx="8" fill="#131E52" stroke="#2A3A7A" stroke-width="1.5"/>' +
                            '<rect x="70" y="92" width="60" height="80" rx="4" fill="#16225E"/>' +
                            '<rect x="210" y="92" width="60" height="80" rx="4" fill="#16225E"/>' +
                            '<rect x="40" y="222" width="260" height="28" fill="#0E1746"/>' +
                            '<text x="170" y="278" text-anchor="middle" fill="#8FD3FF" font-family="Inter, sans-serif" font-size="11" opacity="0.6">THE BALLROOM SIGHTLINE</text>' +
                            '<g id="pg-view-ghost" opacity="0">' +
                                '<ellipse cx="170" cy="176" rx="30" ry="44" fill="#BCE6FF" opacity="0.55"/>' +
                                '<circle cx="170" cy="126" r="17" fill="#BCE6FF" opacity="0.7"/>' +
                            '</g>' +
                        '</svg>' +
                        '<p class="showctl-note">She is not a projection and she is not on a screen. She is a reflection of something real, standing in a room the guest never sees. Take the light out and she is gone with no cue to fade.</p>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</section>';
    }

    /* ---------------- The t-shirt cannon ---------------- */

    /*
     * Ballistics ported from jameso107/tshirt-cannon-simulator (app.py), which
     * James wrote in Python with streamlit and plotly. Streamlit needs a server,
     * so the model is reimplemented here step for step: work-energy muzzle
     * velocity, quadratic drag integrated at dt = 0.01, and the same bisection
     * that calibrates a friction factor so a t-shirt reaches exactly 200 ft at
     * 100 psi and 45 degrees. Checked against the Python to 3 decimal places.
     */
    var BAL = {
        rho: 1.225,
        cd: 0.5,
        g: 9.81,
        barrelArea: Math.PI * Math.pow(2.75 * 0.0254 / 2, 2),
        barrelLen: 24 * 0.0254,
        shirt: { mass: 0.170, diam: 0.07 },
        ball: { mass: 0.040, diam: 0.07 },
        targetRangeM: 200 * 0.3048
    };
    var M_TO_FT = 3.281, MS_TO_MPH = 2.237;

    function muzzleV(mass, psi) {
        return Math.sqrt((2 * (psi * 6894.76 * BAL.barrelArea * BAL.barrelLen)) / mass);
    }

    /* Mirrors the Python loop exactly, including where the sample is recorded
       and where the early return sits, so the numbers come out identical. */
    function flight(obj, v0, angleDeg, stopAtX) {
        var A = Math.PI * Math.pow(obj.diam / 2, 2);
        var k = 0.5 * BAL.rho * BAL.cd * A;
        var a = angleDeg * Math.PI / 180;
        var vx = v0 * Math.cos(a), vy = v0 * Math.sin(a);
        var x = 0, y = 0, dt = 0.01, pts = [];
        while (y >= 0) {
            pts.push([x, y]);
            var sp = Math.sqrt(vx * vx + vy * vy);
            if (stopAtX != null && x >= stopAtX) return { speed: sp, height: y };
            var drag = k * sp * sp;
            vx += (-(drag / obj.mass) * (vx / sp)) * dt;
            vy += (-(drag / obj.mass) * (vy / sp) - BAL.g) * dt;
            x += vx * dt;
            y += vy * dt;
        }
        return { range: x, pts: pts, speed: 0, height: 0 };
    }

    var FRICTION = (function () {
        var ideal = muzzleV(BAL.shirt.mass, 100);
        var lo = 0.01, hi = 1.0, mid;
        for (var i = 0; i < 100; i++) {
            mid = (lo + hi) / 2;
            if (flight(BAL.shirt, ideal * mid, 45).range > BAL.targetRangeM) hi = mid;
            else lo = mid;
        }
        var shirt = (lo + hi) / 2;
        return { shirt: shirt, ball: shirt * 0.5 };
    })();

    var PLOT = { w: 900, h: 452, l: 62, t: 34, r: 884, b: 396, maxX: 300, maxY: 160 };

    function px(ft) { return PLOT.l + (ft / PLOT.maxX) * (PLOT.r - PLOT.l); }
    function py(ft) { return PLOT.b - (ft / PLOT.maxY) * (PLOT.b - PLOT.t); }

    function chartSvg() {
        var g = '';
        for (var xf = 0; xf <= PLOT.maxX; xf += 50) {
            g += '<line x1="' + px(xf).toFixed(1) + '" y1="' + PLOT.t + '" x2="' + px(xf).toFixed(1) +
                 '" y2="' + PLOT.b + '" stroke="#2A3A7A" stroke-width="1" opacity="0.5"/>' +
                 '<text x="' + px(xf).toFixed(1) + '" y="' + (PLOT.b + 22) +
                 '" text-anchor="middle" fill="#8FD3FF" opacity="0.7" font-family="Inter, sans-serif" font-size="13">' + xf + '</text>';
        }
        for (var yf = 0; yf <= PLOT.maxY; yf += 40) {
            g += '<line x1="' + PLOT.l + '" y1="' + py(yf).toFixed(1) + '" x2="' + PLOT.r +
                 '" y2="' + py(yf).toFixed(1) + '" stroke="#2A3A7A" stroke-width="1" opacity="0.5"/>' +
                 '<text x="' + (PLOT.l - 12) + '" y="' + (py(yf) + 5).toFixed(1) +
                 '" text-anchor="end" fill="#8FD3FF" opacity="0.7" font-family="Inter, sans-serif" font-size="13">' + yf + '</text>';
        }
        return '' +
        '<svg class="cannon-chart" viewBox="0 0 ' + PLOT.w + ' ' + PLOT.h + '" role="img" ' +
             'aria-label="Flight paths for a t-shirt and a stress ball at the selected pressure and launch angle, with the front row marked at 50 feet.">' +
            g +
            '<line x1="' + PLOT.l + '" y1="' + PLOT.b + '" x2="' + PLOT.r + '" y2="' + PLOT.b + '" stroke="#8FD3FF" stroke-width="2"/>' +
            '<line x1="' + PLOT.l + '" y1="' + PLOT.t + '" x2="' + PLOT.l + '" y2="' + PLOT.b + '" stroke="#8FD3FF" stroke-width="2"/>' +
            '<line x1="' + px(50).toFixed(1) + '" y1="' + PLOT.t + '" x2="' + px(50).toFixed(1) + '" y2="' + PLOT.b +
                '" stroke="#F4C95D" stroke-width="1.5" stroke-dasharray="6 5" opacity="0.75"/>' +
            '<text x="' + (px(50) + 8).toFixed(1) + '" y="' + (PLOT.t + 16) +
                '" fill="#F4C95D" font-family="Inter, sans-serif" font-size="12.5">front row, 50 ft</text>' +
            '<polyline id="tsc-shirt-line" fill="none" stroke="#F4C95D" stroke-width="3" stroke-linejoin="round" points=""/>' +
            '<polyline id="tsc-ball-line" fill="none" stroke="#8FD3FF" stroke-width="2.5" stroke-dasharray="7 5" points=""/>' +
            '<circle id="tsc-shirt-hit" r="6" fill="#F4C95D"/>' +
            '<circle id="tsc-ball-hit" r="5" fill="#8FD3FF"/>' +
            '<text x="' + ((PLOT.l + PLOT.r) / 2).toFixed(0) + '" y="' + (PLOT.b + 46) + '" text-anchor="middle" fill="#8FD3FF" opacity="0.7" font-family="Inter, sans-serif" font-size="12.5">distance downrange (ft)</text>' +
            '<text x="8" y="' + (PLOT.t - 14) + '" fill="#8FD3FF" opacity="0.7" font-family="Inter, sans-serif" font-size="12.5">height (ft)</text>' +
        '</svg>';
    }

    function cannonSection() {
        var e = robot('tshirt-cannon');
        var specs = e.specs.map(function (sp) { return '<li class="spec">' + sp + '</li>'; }).join('');
        var linkedin = /(<iframe src="https:\/\/www\.linkedin[^>]*><\/iframe>)/.exec(e.media);

        return '' +
        '<section id="cannon" class="cannon">' +
            '<div class="container">' +
                '<p class="section-kicker">Show action equipment</p>' +
                '<h2 class="section-title">The T-shirt Cannon</h2>' +
                '<p class="section-intro">Two friends and I built this after hours, and Koops funded it so they could take it out to community events. The range was never really the point. The point is that a hundred people all turn to look at the same moment, and then something has to land in somebody\'s hands. That is a pressure vessel and a show at the same time, and neither one gets to win. Three ways to look at it.</p>' +

                '<div class="cannon-split">' +
                    '<div class="cannon-panel">' +
                        '<h3 class="panel-title">The machine</h3>' +
                        '<div class="cad-frame">' +
                            '<iframe id="cad-stage" class="cad-stage" src="/cannon" loading="lazy" ' +
                                'allow="fullscreen" title="T-shirt cannon robot, CAD assembly in 3D"></iframe>' +
                        '</div>' +
                        '<div class="panel-bar">' +
                            '<span class="panel-hint">Drag to spin it, scroll to zoom. 29 by 38 inch footprint, 38 inches tall.</span>' +
                            '<button type="button" class="transport-btn" id="cad-full">Full screen</button>' +
                            '<a class="transport-btn" href="https://cad.onshape.com/documents/4f74f3a329da239a0e884a97/w/e750e810e13841ee01e0a5a0/e/a961c01b77cf7d39ca9bd272" target="_blank" rel="noopener">Onshape</a>' +
                        '</div>' +
                    '</div>' +
                    '<div class="cannon-panel">' +
                        '<h3 class="panel-title">In front of a crowd</h3>' +
                        (linkedin
                            ? '<div class="linkedin-container">' + linkedin[1] + '</div>'
                            : '<p class="panel-hint">Video unavailable.</p>') +
                        '<p class="panel-caption">This is the part that matters. The engineering only counts once it is loud, on a field, with people watching and nothing to hide behind.</p>' +
                    '</div>' +
                '</div>' +

                '<h3 class="panel-title cannon-numbers-title">The numbers behind it</h3>' +
                '<div class="cannon-frame">' + chartSvg() + '</div>' +
                '<div class="cannon-controls">' +
                    '<div class="cannon-slider">' +
                        '<label for="tsc-psi">Pressure</label>' +
                        '<input type="range" id="tsc-psi" min="40" max="150" step="5" value="150" aria-label="Pressure in psi">' +
                        '<output id="tsc-psi-out">150 psi</output>' +
                    '</div>' +
                    '<div class="cannon-slider">' +
                        '<label for="tsc-angle">Launch angle</label>' +
                        '<input type="range" id="tsc-angle" min="1" max="85" step="1" value="45" aria-label="Launch angle in degrees">' +
                        '<output id="tsc-angle-out">45&#176;</output>' +
                    '</div>' +
                '</div>' +
                '<div class="cannon-readout">' +
                    '<div class="stat"><span class="stat-v" id="tsc-v">0</span><span class="stat-k">t-shirt muzzle speed (mph)</span></div>' +
                    '<div class="stat"><span class="stat-v" id="tsc-range">0</span><span class="stat-k">t-shirt range (ft)</span></div>' +
                    '<div class="stat"><span class="stat-v" id="tsc-front">0</span><span class="stat-k">speed 50 ft downrange (mph)</span></div>' +
                    '<div class="stat"><span class="stat-v" id="tsc-ball">0</span><span class="stat-k">stress ball range (ft)</span></div>' +
                '</div>' +
                '<p class="cannon-note" id="tsc-note"></p>' +

                '<h3 class="walk-route-title">What it is made of</h3>' +
                '<ul class="cannon-specs">' + specs + '</ul>' +
                '<p class="showctl-note">The 3D view is the real Onshape assembly. Its export is 11.1 million triangles and 555 megabytes, so I decimated it by vertex clustering down to 68,683 to make it something a browser could open. The curves come from the simulator I wrote for this thing, ported from Python so it runs here. I calibrated it on one measurement, 200 feet at 100 psi and 45 degrees. Push it to the 150 psi the cannon actually fires at and it lands on 263 feet, against the 250 plus we measured on the field. I did not tune it to do that. ' +
                '<button type="button" class="ai-card-link" onclick="openShowcase(\'tshirt-cannon\')">Build photos and video</button>. ' +
                'Simulator source is <a href="https://github.com/jameso107/tshirt-cannon-simulator" target="_blank" rel="noopener">on GitHub</a>.</p>' +
            '</div>' +
        '</section>';
    }

    /* ---------------- FIRST Robotics ---------------- */

    /* Photos and highlights come straight out of content.js so there is one
       source of truth, and the ESPN link comes from the press list. */
    function firstPhotos() {
        var e = robot('first-robotics');
        var out = [], re = /<img src="([^"]+)"/g, m;
        while ((m = re.exec(e.media)) !== null) out.push(m[1]);
        return out;
    }

    function espnEmbed() {
        for (var i = 0; i < C.NEWS.length; i++) {
            var id = /[?&]v=([A-Za-z0-9_-]+)/.exec(C.NEWS[i].href || '');
            if (id) return 'https://www.youtube-nocookie.com/embed/' + id[1];
        }
        return null;
    }

    function firstSection() {
        var e = robot('first-robotics');

        var highlights = e.specs.map(function (sp) {
            return '<li class="spec">' + sp + '</li>';
        }).join('');

        var photos = firstPhotos().map(function (src) {
            return '<img class="mosaic-tile" src="' + esc(src) +
                '" alt="FIRST Robotics" loading="lazy">';
        }).join('');

        var espn = espnEmbed();
        var video = espn
            ? '<div class="first-video"><iframe src="' + esc(espn) + '" loading="lazy" ' +
              'title="ESPN3 Robotics Gameday interview" frameborder="0" ' +
              'allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ' +
              'referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>'
            : '';

        return '' +
        '<section id="first" class="first">' +
            '<div class="container">' +
                '<p class="section-kicker">Where all of this started</p>' +
                '<h2 class="section-title">FIRST Robotics</h2>' +
                '<p class="section-intro">I joined FTC team 8529 in 2018 and FRC team 107 not long after, and I have never really left. In high school I was captain of Team R.O.B.O.T.I.C.S. I still volunteer at events, still mentor rookie teams, and still get more out of it than I put in. This is the section that explains every other section on this page.</p>' +
                '<blockquote class="first-quote">' +
                    '<p>FIRST Robotics isn\'t kids building robots; it is robots building kids.</p>' +
                    '<footer>That is the line I learned as captain, and it is still the most useful thing anybody has told me about building. My late mentor Bob Bonczyk showed me how to compete with true compassion. I miss you, Bob.</footer>' +
                '</blockquote>' +
                '<div class="first-grid">' +
                    video +
                    '<div class="first-side">' +
                        '<h3 class="walk-route-title">' + esc(e.role) + '</h3>' +
                        '<ul class="cannon-specs first-highlights">' + highlights + '</ul>' +
                    '</div>' +
                '</div>' +
                '<div class="first-mosaic">' + photos + '</div>' +
                '<p class="showctl-note">The reason this matters for a job at Imagineering: eight years of FIRST is eight years of explaining a machine to somebody who does not care about machines yet, and then watching them care. I also built <a href="https://github.com/jameso107/rebuilt" target="_blank" rel="noopener">a scouting app</a> for team 107, because a team making alliance picks off memory is a team guessing. ' +
                'West Michigan\'s FOX 17 covered what the program does for the people in it, <a href="https://www.fox17online.com/news/morning-news/community-of-creation-robotics-team-members-gain-life-skills-and-friendship" target="_blank" rel="noopener">here</a>.</p>' +
            '</div>' +
        '</section>';
    }

    /* ---------------- People ---------------- */

    function peopleSection() {
        var jpl = work('jpl-research');
        var figure = jpl.caseStudy.match(/<figure class="case-figure">([\s\S]*?)<\/figure>/);

        return '' +
        '<section id="people" class="people">' +
            '<div class="container">' +
                '<p class="section-kicker">People centered</p>' +
                '<h2 class="section-title">Designing for the person in the seat</h2>' +
                '<p class="section-intro">At JPL I got to do professionally what a haunted house teaches you for free: stop asking people what they think of the thing and go measure what they actually do with it.</p>' +
                '<div class="people-grid">' +
                    '<figure class="people-figure">' + (figure ? figure[1] : '') + '</figure>' +
                    '<ul class="people-points">' +
                        '<li><strong>I measured where people looked</strong><span>I built a gaze tracker on OpenFace 2.0 to map operator attention to regions of their screen during live Curiosity shifts. It turned an opinion into a number: a 67% gap in trust between experts and novices. <button type="button" class="ai-card-link" onclick="openCaseStudyModal(\'case-jpl-research\')">Read the study</button></span></li>' +
                        '<li><strong>I lead from underneath</strong><span>Society sees leadership as a pyramid. I think you flip it, and the leader ends up at the bottom holding everyone else up. That is how I ran a state championship soccer sideline, a pro bono consulting group, and a floor of residents.</span></li>' +
                        '<li><strong>I went and studied it on purpose</strong><span>I declared a Coaching and Leadership minor through the Marsal Family School of Education after a class called Coaching as Leading. Human robot interaction is my favorite subject in the major for the same reason.</span></li>' +
                        
                    '</ul>' +
                '</div>' +
            '</div>' +
        '</section>';
    }

    /* ---------------- Software ---------------- */

    var SOFTWARE = ['triage', 'koopsgpt', 'specinator'];

    function softwareSection() {
        var cards = SOFTWARE.map(function (id) {
            var w = work(id);
            var links = '<button type="button" class="ai-card-link" onclick="openCaseStudyModal(\'case-' + w.id + '\')">Case study</button>';
            if (w.demo) {
                links += '<a href="' + esc(w.demo.href) + '" class="ai-card-link ai-card-link-demo">' + esc(w.demo.label) + '</a>';
            }
            return '<article class="ai-card">' +
                '<h3><button type="button" class="ai-card-title-link" onclick="openCaseStudyModal(\'case-' + w.id + '\')">' + esc(w.title) + '</button></h3>' +
                '<p class="ai-card-hook">' + esc(w.hook) + '</p>' +
                '<div class="chip-row">' + w.chips.map(function (c) { return '<span class="chip">' + c + '</span>'; }).join('') + '</div>' +
                '<div class="ai-card-links">' + links + '</div>' +
            '</article>';
        }).join('');

        return '' +
        '<section id="software" class="ai-work">' +
            '<div class="container">' +
                '<p class="section-kicker">The day job</p>' +
                '<h2 class="section-title">Software people keep using</h2>' +
                '<p class="section-intro">I run SYZYGY.services, where six of us build AI systems for businesses. The reason it belongs on this page: an interactive thing nobody opens twice is the same failure as an effect nobody looks at.</p>' +
                '<div class="ai-grid">' + cards + '</div>' +
            '</div>' +
        '</section>';
    }

    /* ---------------- Shared tail ---------------- */

    function contact() {
        var p = C.PROFILE;
        return '' +
        '<section id="contact" class="contact"><div class="container">' +
            '<h2 class="section-title">Let\'s Connect</h2>' +
            '<p class="contact-description">If you want to talk about any of this, I would love to. Email reaches me quickest.</p>' +
            '<div class="contact-links">' +
                '<a href="mailto:' + esc(p.email) + '" class="contact-link"><span class="contact-icon">&#9993;&#65039;</span><span>Email</span></a>' +
                '<a href="' + esc(p.linkedin) + '" class="contact-link" target="_blank" rel="noopener"><span class="contact-icon">&#128188;</span><span>LinkedIn</span></a>' +
                '<a href="' + esc(p.github) + '" class="contact-link" target="_blank" rel="noopener"><span class="contact-icon">&#128187;</span><span>GitHub</span></a>' +
                '<a href="#" class="contact-link" onclick="openResumeModal(); return false;"><span class="contact-icon">&#128196;</span><span>Resume</span></a>' +
            '</div>' +
        '</div></section>';
    }

    function footer() {
        var p = C.PROFILE;
        return '' +
        '<footer class="footer"><div class="container footer-inner">' +
            '<p class="footer-name">' + esc(p.name) + '</p>' +
            '<nav class="footer-links" aria-label="Footer">' +
                '<a href="' + esc(p.github) + '" target="_blank" rel="noopener">GitHub</a>' +
                '<a href="' + esc(p.linkedin) + '" target="_blank" rel="noopener">LinkedIn</a>' +
                '<a href="mailto:' + esc(p.email) + '">Email</a>' +
                '<a href="' + esc(p.resume) + '">Resume</a>' +
                '<a href="' + esc(p.demo) + '">Live demo</a>' +
                '<a href="/">ooster.house</a>' +
            '</nav>' +
            '<p class="footer-note">Written for Walt Disney Imagineering. An independent application page, not affiliated with or endorsed by The Walt Disney Company.</p>' +
        '</div></footer>';
    }

    function caseTemplates() {
        return C.AI_WORK.map(function (w) {
            return '<template id="case-' + w.id + '">' + w.caseStudy + '</template>';
        }).join('');
    }

    function modals() {
        var x = '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M10 10L30 30M30 10L10 30" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
        return '' +
        '<div id="project-modal" class="project-modal">' +
            '<div class="modal-backdrop" onclick="closeProjectModal()"></div>' +
            '<div class="modal-content">' +
                '<button class="modal-close" onclick="closeProjectModal()" aria-label="Close modal">' + x + '</button>' +
                '<div class="modal-body" id="modal-body"></div>' +
            '</div>' +
        '</div>' +
        '<div id="resume-modal" class="project-modal">' +
            '<div class="modal-backdrop" onclick="closeResumeModal()"></div>' +
            '<div class="modal-content">' +
                '<button class="modal-close" onclick="closeResumeModal()" aria-label="Close resume modal">' + x + '</button>' +
                '<div class="modal-body resume-modal-body"><div class="pdf-container resume-pdf-container">' +
                    '<iframe src="' + esc(C.PROFILE.resume) + '" loading="lazy" frameborder="0" allowfullscreen="" title="Resume PDF"></iframe>' +
                '</div></div>' +
            '</div>' +
        '</div>';
    }

    /* Builds a project modal straight from content.js instead of scraping the
       DOM, so the cards on this page are free to look however they like. */
    global.openShowcase = function (id) {
        var e = robot(id);
        var modal = document.getElementById('project-modal');
        var body = document.getElementById('modal-body');
        if (!e || !modal || !body) return;

        body.innerHTML =
            '<h2 class="modal-title">' + esc(e.title) + '</h2>' +
            '<div class="modal-role">' + e.role + '</div>' +
            '<p class="modal-description">' + e.description + '</p>' +
            '<div class="project-specs"><h4>' + e.specHeading + '</h4><ul>' +
                e.specs.map(function (s) { return '<li>' + s + '</li>'; }).join('') +
            '</ul></div>' +
            '<div class="project-expanded" style="display:block">' + e.media + '</div>';

        document.body.style.overflow = 'hidden';
        modal.classList.add('active');
        var close = modal.querySelector('.modal-close');
        if (close) close.focus();
    };

    /* ============================================================ */
    /* Interactive behavior                                         */
    /* ============================================================ */

    function fullscreenButton(btnId, frameId) {
        var btn = document.getElementById(btnId);
        var frame = document.getElementById(frameId);
        if (!btn || !frame) return;
        btn.addEventListener('click', function () {
            if (frame.requestFullscreen) frame.requestFullscreen();
            else if (frame.webkitRequestFullscreen) frame.webkitRequestFullscreen();
        });
    }

    function initWalkthrough() {
        fullscreenButton('walk-full', 'walk-stage');
        fullscreenButton('cad-full', 'cad-stage');
    }

    function initCannon() {
        var psi = document.getElementById('tsc-psi');
        var ang = document.getElementById('tsc-angle');
        if (!psi || !ang) return;

        var shirtLine = document.getElementById('tsc-shirt-line');
        var ballLine = document.getElementById('tsc-ball-line');
        var shirtHit = document.getElementById('tsc-shirt-hit');
        var ballHit = document.getElementById('tsc-ball-hit');
        var note = document.getElementById('tsc-note');

        function poly(pts) {
            var out = [];
            for (var i = 0; i < pts.length; i++) {
                var xf = pts[i][0] * M_TO_FT, yf = pts[i][1] * M_TO_FT;
                if (xf > PLOT.maxX) break;
                out.push(px(xf).toFixed(1) + ',' + py(Math.max(0, Math.min(PLOT.maxY, yf))).toFixed(1));
            }
            return out.join(' ');
        }

        function paint() {
            var p = parseInt(psi.value, 10), a = parseInt(ang.value, 10);
            document.getElementById('tsc-psi-out').textContent = p + ' psi';
            document.getElementById('tsc-angle-out').textContent = a + '\u00B0';

            var vShirt = muzzleV(BAL.shirt.mass, p) * FRICTION.shirt;
            var vBall = muzzleV(BAL.ball.mass, p) * FRICTION.ball;
            var fShirt = flight(BAL.shirt, vShirt, a);
            var fBall = flight(BAL.ball, vBall, a);
            var atFront = flight(BAL.shirt, vShirt, a, 50 * 0.3048);
            var front = atFront.speed || 0;
            var frontH = (atFront.height || 0) * M_TO_FT;

            shirtLine.setAttribute('points', poly(fShirt.pts));
            ballLine.setAttribute('points', poly(fBall.pts));

            var sr = fShirt.range * M_TO_FT, br = fBall.range * M_TO_FT;
            shirtHit.setAttribute('cx', px(Math.min(sr, PLOT.maxX)).toFixed(1));
            shirtHit.setAttribute('cy', py(0).toFixed(1));
            ballHit.setAttribute('cx', px(Math.min(br, PLOT.maxX)).toFixed(1));
            ballHit.setAttribute('cy', py(0).toFixed(1));

            document.getElementById('tsc-v').textContent = (vShirt * MS_TO_MPH).toFixed(0);
            document.getElementById('tsc-range').textContent = sr.toFixed(0);
            document.getElementById('tsc-front').textContent = (front * MS_TO_MPH).toFixed(0);
            document.getElementById('tsc-ball').textContent = br.toFixed(0);

            /* Speed alone does not decide anything. What matters is how high it
               is when it crosses the people, which is what sets the envelope. */
            var mph = front * MS_TO_MPH;
            if (sr < 50) {
                note.textContent = 'It does not even reach the front row here. Fine on a bench, useless at an event.';
            } else if (frontH < 12) {
                note.textContent = 'It crosses the front row only ' + frontH.toFixed(0) + ' feet up, still doing ' +
                    mph.toFixed(0) + ' mph. This is the setting you never use with people standing there.';
            } else {
                note.textContent = 'It crosses the front row ' + frontH.toFixed(0) + ' feet overhead at ' +
                    mph.toFixed(0) + ' mph, then slows on the way down. Clearing the near crowd is what the elevation is for.';
            }
        }

        psi.addEventListener('input', paint);
        ang.addEventListener('input', paint);
        paint();
    }

    function initPepper() {
        var slider = document.getElementById('pg-slider');
        var readout = document.getElementById('pg-readout');
        var chamber = document.getElementById('pg-chamber');
        var actor = document.getElementById('pg-actor');
        var rays = document.getElementById('pg-rays');
        var virt = document.getElementById('pg-virtual');
        var view = document.getElementById('pg-view-ghost');
        if (!slider) return;

        function paint() {
            var v = parseInt(slider.value, 10) / 100;
            readout.textContent = Math.round(v * 100) + '%';
            chamber.setAttribute('opacity', String(0.1 + v * 0.55));
            actor.setAttribute('opacity', String(0.25 + v * 0.75));
            rays.setAttribute('opacity', String(0.15 + v * 0.75));
            virt.setAttribute('opacity', String(v));
            /* The reflection is faint until the chamber is properly lit, which
               is exactly why the cue is a slow fade up and not a switch. */
            view.setAttribute('opacity', String(Math.pow(v, 1.4)));
        }

        slider.addEventListener('input', paint);
        paint();
    }

    /* ============================================================ */
    /* Boot                                                         */
    /* ============================================================ */

    function render() {
        var mount = document.getElementById('app');
        if (!mount || !C) return;

        mount.innerHTML =
            introMarkup() + nav() + hero() + why() + walkSection() + pepperSection() +
            cannonSection() + firstSection() + peopleSection() + softwareSection() +
            contact() + footer() + caseTemplates() + modals();

        runIntro();
        initWalkthrough();
        initPepper();
        initCannon();
    }

    render();
})(window);
