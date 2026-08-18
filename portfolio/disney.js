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
            '<p class="castle-skip"><span>Tap anywhere to skip</span></p>' +
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
        ['show', 'Show control'],
        ['built', 'What I have built'],
        ['people', 'People'],
        ['software', 'Software'],
        ['journey', 'Journey'],
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
                    '<a href="#show" class="cta-button">Run my show</a>' +
                    '<a href="#why" class="cta-button cta-secondary">Why Imagineering</a>' +
                '</div>' +
                '<p class="hero-now"><strong>Now:</strong> Robotics Engineering at the University of Michigan, minoring in Coaching &amp; Leadership. <strong>Recently:</strong> NASA JPL.</p>' +
            '</div>' +
        '</section>';
    }

    var WHY = [
        ['Creative', 'I already build shows',
         'The Ghost of Alice Lloyd ran for over 200 residents on a budget of almost nothing. A Pepper\'s Ghost illusion, a living picture frame, black light, six JBL speakers, and a cast of fellow RAs I had to direct. I designed it, built it, sequenced it, and performed in it. There is a playable cue sheet a little further down this page.'],
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

    /* ---------------- Show control ---------------- */

    /* Reconstructed from the show I ran. Times are the running order for one
       group of six guests; the hall reset and ran again behind them. */
    var CUES = [
        { t: 0,   dept: 'SM',   name: 'House open',            desc: 'Guests admitted in groups of six.',                 set: { corridor: 0.85 } },
        { t: 5,   dept: 'SND',  name: 'Drone in',              desc: 'Low bed under the whole hall.',                     spk: [1, 2] },
        { t: 10,  dept: 'LX',   name: 'Corridor to 20%',       desc: 'Practicals down. Eyes start adjusting.',            set: { corridor: 0.2 } },
        { t: 15,  dept: 'CAST', name: 'Greeter, the story',    desc: 'Who Alice Lloyd was, and what residents still hear.', set: { greeter: 1 } },
        { t: 25,  dept: 'SND',  name: 'Whisper pass',          desc: 'Voice walks from speaker 3 to speaker 4.',          spk: [3, 4] },
        { t: 31,  dept: 'LX',   name: 'Black light up',        desc: 'Portrait wall only.',                               set: { uv: 1, greeter: 0 } },
        { t: 35,  dept: 'SFX',  name: 'Living picture frame',  desc: 'Portrait cross-fades while they are looking at it.', set: { portrait: 1 } },
        { t: 41,  dept: 'SND',  name: 'Portrait sting',        desc: 'Hard hit, speaker 4, close and dry.',               spk: [4] },
        { t: 46,  dept: 'CAST', name: 'Move to the threshold', desc: 'Guests walked to the ballroom sightline.',          set: { atGlass: 1 } },
        { t: 53,  dept: 'LX',   name: 'Chamber to 5%',         desc: 'Hidden alcove barely lifts. Nothing visible yet.',  set: { chamber: 0.2 } },
        { t: 57,  dept: 'SFX',  name: 'Alice appears',         desc: 'Pepper\'s Ghost. Reflection builds in the glass.',  set: { chamber: 0.85, ghost: 1 } },
        { t: 62,  dept: 'SND',  name: 'Swell, all six',        desc: 'First time the whole rig is used at once.',         spk: [1, 2, 3, 4, 5, 6] },
        { t: 68,  dept: 'SFX',  name: 'Alice fades',           desc: 'Chamber down slowly. She does not exit, she stops being there.', set: { chamber: 0, ghost: 0 } },
        { t: 72,  dept: 'LX',   name: 'Blackout',              desc: 'Everything out. Hold it longer than feels safe.',   set: { corridor: 0, uv: 0, portrait: 0, blackout: 1 } },
        { t: 75,  dept: 'SND',  name: 'Silence',               desc: 'Two beats of nothing. This is the actual scare.',   set: {} },
        { t: 78,  dept: 'CAST', name: 'Alcove scare',          desc: 'Actor out of the dark on the exit side.',           set: { scare: 1, blackout: 0 } },
        { t: 82,  dept: 'LX',   name: 'Exit path up',          desc: 'Corridor to 60%, house lights lead them out.',      set: { corridor: 0.6, scare: 0 } },
        { t: 87,  dept: 'SND',  name: 'Outro under',           desc: 'Bed continues so the next group hears it coming.',  spk: [5, 6] },
        { t: 93,  dept: 'SM',   name: 'Reset',                 desc: 'Thirty seconds to reset for the next six.',         set: { atGlass: 0 } }
    ];

    var SHOW_LEN = 100;

    function planSvg() {
        var spk = '';
        var pos = [[66, 48], [66, 212], [262, 48], [240, 212], [420, 48], [390, 212]];
        for (var i = 0; i < 6; i++) {
            spk += '<g id="spk-' + (i + 1) + '" class="plan-spk">' +
                '<circle cx="' + pos[i][0] + '" cy="' + pos[i][1] + '" r="13" fill="#16225E" stroke="#8FD3FF" stroke-width="1.5"/>' +
                '<text x="' + pos[i][0] + '" y="' + (pos[i][1] + 4) + '" text-anchor="middle" fill="#8FD3FF" font-family="Inter, sans-serif" font-size="11" font-weight="600">' + (i + 1) + '</text>' +
                '</g>';
        }

        return '' +
        '<svg class="plan-svg" viewBox="0 0 560 270" role="img" aria-label="Top down plan of the hall: entry, portrait wall, the angled glass with its hidden chamber, the exit alcove, and six speaker positions.">' +
            '<rect id="plan-floor" x="30" y="26" width="500" height="208" rx="10" fill="#0B1440" stroke="#2A3A7A" stroke-width="1.5"/>' +
            '<rect id="plan-uv" x="120" y="30" width="130" height="60" rx="6" fill="#8B5CF6" opacity="0"/>' +
            '<path id="plan-guests" d="M 46 130 L 150 130 L 300 130 L 470 130" fill="none" stroke="#8FD3FF" stroke-width="2" stroke-dasharray="7 7" opacity="0.5"/>' +
            '<text x="46" y="118" fill="#8FD3FF" font-family="Inter, sans-serif" font-size="11" opacity="0.75">ENTRY</text>' +
            '<text x="470" y="118" text-anchor="end" fill="#8FD3FF" font-family="Inter, sans-serif" font-size="11" opacity="0.75">EXIT</text>' +
            /* portrait wall */
            '<rect x="150" y="36" width="72" height="48" rx="4" fill="#16225E" stroke="#8FD3FF" stroke-width="1.5"/>' +
            '<rect id="plan-portrait" x="158" y="43" width="56" height="34" rx="3" fill="#F4C95D" opacity="0.2"/>' +
            '<text x="186" y="102" text-anchor="middle" fill="#FFFFFF" font-family="Inter, sans-serif" font-size="10" opacity="0.7">PORTRAIT</text>' +
            /* angled glass and the hidden chamber below it */
            '<line id="plan-glass" x1="300" y1="96" x2="360" y2="156" stroke="#8FD3FF" stroke-width="3" opacity="0.55"/>' +
            '<text x="292" y="90" fill="#8FD3FF" font-family="Inter, sans-serif" font-size="10" opacity="0.75">GLASS 45&#176;</text>' +
            '<rect id="plan-chamber" x="292" y="176" width="76" height="46" rx="5" fill="#F4C95D" opacity="0.08" stroke="#F4C95D" stroke-width="1.2"/>' +
            '<text x="330" y="203" text-anchor="middle" fill="#F4C95D" font-family="Inter, sans-serif" font-size="10" opacity="0.85">CHAMBER</text>' +
            '<g id="plan-ghost" opacity="0">' +
                '<ellipse cx="404" cy="130" rx="20" ry="28" fill="#BCE6FF" opacity="0.6"/>' +
                '<ellipse cx="404" cy="106" rx="10" ry="11" fill="#BCE6FF" opacity="0.85"/>' +
                '<text x="404" y="182" text-anchor="middle" fill="#BCE6FF" font-family="Inter, sans-serif" font-size="9">ALICE</text>' +
            '</g>' +
            /* actors */
            '<g id="plan-greeter" opacity="0.18">' +
                '<circle cx="96" cy="130" r="9" fill="#F4C95D"/>' +
                '<text x="96" y="156" text-anchor="middle" fill="#F4C95D" font-family="Inter, sans-serif" font-size="9">GREETER</text>' +
            '</g>' +
            '<g id="plan-scare" opacity="0.18">' +
                '<circle cx="470" cy="180" r="9" fill="#F4C95D"/>' +
                '<text x="470" y="204" text-anchor="middle" fill="#F4C95D" font-family="Inter, sans-serif" font-size="9">ALCOVE</text>' +
            '</g>' +
            spk +
            '<rect id="plan-blackout" x="30" y="26" width="500" height="208" rx="10" fill="#02040F" opacity="0"/>' +
        '</svg>';
    }

    function cueRows() {
        return CUES.map(function (c, i) {
            var m = Math.floor(c.t / 60), s = c.t % 60;
            return '<li class="cue-row" data-cue="' + i + '">' +
                '<span class="cue-time">' + m + ':' + (s < 10 ? '0' : '') + s + '</span>' +
                '<span class="cue-dept">' + c.dept + '</span>' +
                '<span class="cue-name"><strong>' + esc(c.name) + '</strong><span>' + esc(c.desc) + '</span></span>' +
            '</li>';
        }).join('');
    }

    function showSection() {
        return '' +
        '<section id="show" class="showctl">' +
            '<div class="container">' +
                '<p class="section-kicker">Show control</p>' +
                '<h2 class="section-title">The Ghost of Alice Lloyd</h2>' +
                '<p class="section-intro">A haunted house is a show control problem in a costume. Six guests at a time, one hallway, a portrait, a pane of glass, and a cast who had to hit their marks in the dark. Here is how it was sequenced. Press play and watch the hall respond.</p>' +
                '<p style="text-align:center;margin-bottom:0.5rem"><span class="reconstructed-badge">Reconstructed cue sheet</span></p>' +
                '<div class="showctl-frame">' +
                    '<div class="showctl-panel">' +
                        '<h3>Hall plan</h3>' + planSvg() +
                    '</div>' +
                    '<div class="showctl-panel">' +
                        '<h3>Cue sheet</h3>' +
                        '<ul class="cue-list" id="cue-list">' + cueRows() + '</ul>' +
                    '</div>' +
                '</div>' +
                '<div class="transport">' +
                    '<button type="button" class="transport-btn" id="show-play">Play</button>' +
                    '<button type="button" class="transport-btn" id="show-reset">Restart</button>' +
                    '<span class="transport-clock" id="show-clock">0:00 / 1:40</span>' +
                    '<input type="range" class="transport-scrub" id="show-scrub" min="0" max="' + SHOW_LEN + '" step="0.1" value="0" aria-label="Show timecode">' +
                '</div>' +
                '<p class="showctl-note">The cue times are reconstructed from the show I ran, not a scan of the original paper. The hall, the effects, the speaker count, and the running order are the real ones. ' +
                '<button type="button" class="ai-card-link" onclick="openShowcase(\'haunted-house\')">Watch the walkthrough</button></p>' +
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
                '<p class="section-intro">The same principle the Haunted Mansion ballroom runs on. A sheet of glass at 45 degrees, a chamber the guest cannot see, and a light you bring up slowly. Drag the slider and watch Alice arrive.</p>' +
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

    /* ---------------- Built for an audience ---------------- */

    var BUILT = [
        ['tshirt-cannon',   'Show action equipment, more or less. 150psi, a two axis turret, a 250 foot range, and a hard rule about never hurting the front row.'],
        ['robot-in-3-days', 'A three day charrette with fifteen alumni. I ran the design and owned integration between the subsystems.'],
        ['first-robotics',  'Eight years of the program. It is where I learned how to hand a crowd a story and make them care about a machine.'],
        ['ballbot',         'Dynamic balancing on three omniwheels. The same controls math that ride motion and animatronics run on.']
    ];

    function builtSection() {
        var cards = BUILT.map(function (b) {
            var e = robot(b[0]);
            if (!e) return '';
            return '<article class="showcase-card">' +
                '<div class="showcase-media" style="background-image:url(\'' + esc(e.image) + '\')"></div>' +
                '<div class="showcase-body">' +
                    '<h3>' + esc(e.title) + '</h3>' +
                    '<p class="showcase-angle">' + esc(b[1]) + '</p>' +
                    '<p class="showcase-desc">' + e.description + '</p>' +
                    '<button type="button" class="showcase-btn" onclick="openShowcase(\'' + e.id + '\')">Open it up</button>' +
                '</div>' +
            '</article>';
        }).join('');

        return '' +
        '<section id="built" class="projects">' +
            '<div class="container">' +
                '<p class="section-kicker">Built for an audience</p>' +
                '<h2 class="section-title">Things that had to work in front of people</h2>' +
                '<p class="section-intro">Every one of these had a date on it, a crowd in front of it, and no second take.</p>' +
                '<div class="showcase-grid">' + cards + '</div>' +
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
                        '<li><strong>I have mentored a lot of beginners</strong><span>Over 70 Michigan rookie FIRST teams since 2023, plus five events as a technical advisor assistant. Teaching someone to build their first robot is very good practice for making a thing understandable to a stranger.</span></li>' +
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

    function journey() {
        return '' +
        '<section id="journey" class="journey"><div class="container">' +
            '<h2 class="section-title">My Journey</h2>' +
            '<div class="timeline">' +
                C.JOURNEY.map(function (j) {
                    return '<div class="timeline-item"><div class="timeline-marker"></div>' +
                        '<div class="timeline-content"><h3>' + j.title + '</h3><p>' + j.body + '</p></div></div>';
                }).join('') +
            '</div>' +
        '</div></section>';
    }

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

    function initShowControl() {
        var playBtn = document.getElementById('show-play');
        var resetBtn = document.getElementById('show-reset');
        var scrub = document.getElementById('show-scrub');
        var clock = document.getElementById('show-clock');
        var list = document.getElementById('cue-list');
        if (!playBtn || !scrub || !list) return;

        var rows = [].slice.call(list.querySelectorAll('.cue-row'));
        var el = {};
        ['floor', 'uv', 'portrait', 'chamber', 'ghost', 'greeter', 'scare', 'blackout', 'guests']
            .forEach(function (k) { el[k] = document.getElementById('plan-' + k); });
        var spk = [];
        for (var i = 1; i <= 6; i++) spk.push(document.getElementById('spk-' + i));

        var t = 0, playing = false, raf = null, last = 0, lastActive = -1;

        function fmt(s) {
            var m = Math.floor(s / 60), r = Math.floor(s % 60);
            return m + ':' + (r < 10 ? '0' : '') + r;
        }

        function stateAt(time) {
            var s = { corridor: 0, uv: 0, portrait: 0, chamber: 0, ghost: 0,
                      greeter: 0, scare: 0, blackout: 0, atGlass: 0 };
            var live = [];
            CUES.forEach(function (c) {
                if (c.t > time) return;
                if (c.set) Object.keys(c.set).forEach(function (k) { s[k] = c.set[k]; });
                if (c.spk && time - c.t < 2.2) live = live.concat(c.spk);
            });
            s.speakers = live;
            return s;
        }

        function paint() {
            var s = stateAt(t);
            if (el.floor) el.floor.setAttribute('fill-opacity', String(0.25 + s.corridor * 0.75));
            if (el.uv) el.uv.setAttribute('opacity', String(s.uv * 0.4));
            if (el.portrait) el.portrait.setAttribute('opacity', String(0.18 + s.portrait * 0.42));
            if (el.chamber) el.chamber.setAttribute('opacity', String(0.08 + s.chamber * 0.6));
            if (el.ghost) el.ghost.setAttribute('opacity', String(s.ghost));
            if (el.greeter) el.greeter.setAttribute('opacity', String(0.18 + s.greeter * 0.82));
            if (el.scare) el.scare.setAttribute('opacity', String(0.18 + s.scare * 0.82));
            if (el.blackout) el.blackout.setAttribute('opacity', String(s.blackout * 0.88));
            if (el.guests) el.guests.setAttribute('opacity', String(0.25 + s.corridor * 0.45));

            for (var i = 0; i < 6; i++) {
                if (!spk[i]) continue;
                var on = s.speakers.indexOf(i + 1) !== -1;
                spk[i].setAttribute('opacity', on ? '1' : '0.45');
                var c = spk[i].querySelector('circle');
                if (c) c.setAttribute('fill', on ? '#F4C95D' : '#16225E');
            }

            var activeIdx = -1;
            for (var j = 0; j < CUES.length; j++) if (CUES[j].t <= t) activeIdx = j;
            rows.forEach(function (row, k) {
                row.classList.toggle('is-active', k === activeIdx);
                row.classList.toggle('is-past', k < activeIdx);
            });
            /* Only chase the active cue once it actually changes, and only once
               the list has been laid out, or the scroll clamps to zero. */
            if (activeIdx >= 0 && activeIdx !== lastActive && list.clientHeight > 0) {
                lastActive = activeIdx;
                /* Measured, not offsetTop derived, so it does not care whether
                   the list or any ancestor happens to be positioned. */
                var lr = list.getBoundingClientRect();
                var rr = rows[activeIdx].getBoundingClientRect();
                var top = list.scrollTop + (rr.top - lr.top) - (list.clientHeight - rr.height) / 2;
                list.scrollTo({ top: Math.max(0, top), behavior: playing ? 'smooth' : 'auto' });
            }

            clock.textContent = fmt(t) + ' / ' + fmt(SHOW_LEN);
            scrub.value = String(t);
        }

        function tick(now) {
            if (!playing) return;
            var dt = (now - last) / 1000;
            last = now;
            t = Math.min(SHOW_LEN, t + dt);
            paint();
            if (t >= SHOW_LEN) { setPlaying(false); return; }
            raf = requestAnimationFrame(tick);
        }

        function setPlaying(on) {
            if (on === playing) return;
            playing = on;
            playBtn.textContent = on ? 'Pause' : 'Play';
            if (on) {
                if (t >= SHOW_LEN) t = 0;
                last = performance.now();
                raf = requestAnimationFrame(tick);
            } else if (raf) {
                cancelAnimationFrame(raf);
                raf = null;
            }
        }

        playBtn.addEventListener('click', function () { setPlaying(!playing); });
        resetBtn.addEventListener('click', function () { setPlaying(false); t = 0; paint(); });
        scrub.addEventListener('input', function () { t = parseFloat(scrub.value); paint(); });

        paint();
        /* One more pass after first layout, so a preset scrub position still
           lands the cue list on the right row. A timer rather than rAF, because
           rAF does not fire while the tab is in the background. */
        setTimeout(function () { lastActive = -1; paint(); }, 0);
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
            introMarkup() + nav() + hero() + why() + showSection() + pepperSection() +
            builtSection() + peopleSection() + softwareSection() + journey() +
            contact() + footer() + caseTemplates() + modals();

        runIntro();
        initShowControl();
        initPepper();
    }

    render();
})(window);
