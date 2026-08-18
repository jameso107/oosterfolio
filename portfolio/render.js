/*
 * Renders a company portfolio page from portfolio/companies.js.
 *
 * This runs synchronously, before script.js, so that by the time script.js
 * fires its DOMContentLoaded work (photo sliders, nav, scroll animations,
 * modals) the whole page is already in the DOM.
 *
 * The slug comes from the URL path: /disney renders COMPANIES.disney. For
 * local preview without the Vercel rewrite, ?company=disney works too.
 */
(function (global) {
    'use strict';

    var C = global.PortfolioContent;
    var COMPANIES = global.PortfolioCompanies || {};

    /* ---------------------------------------------------------------- utils */

    function esc(v) {
        return String(v)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function byId(list, id) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) return list[i];
        }
        return null;
    }

    /* Resolve an ordered [{id, angle}] spec against a content array, dropping
       ids that do not exist so a typo degrades instead of breaking the page. */
    function pick(list, items) {
        var out = [];
        (items || []).forEach(function (spec) {
            var entry = byId(list, spec.id);
            if (entry) out.push({ entry: entry, angle: spec.angle || '' });
        });
        return out;
    }

    function chips(values) {
        if (!values || !values.length) return '';
        return '<div class="chip-row">' +
            values.map(function (c) { return '<span class="chip">' + c + '</span>'; }).join('') +
            '</div>';
    }

    /* ---------------------------------------------------------------- theme */

    function applyTheme(theme) {
        if (!theme) return;
        var root = document.documentElement;
        var map = {
            '--maize': theme.accent,
            '--accent-bright': theme.accentBright,
            '--accent-rgb': theme.accentRgb,
            '--blue': theme.bg,
            '--bg-rgb': theme.bgRgb,
            '--blue-light': theme.bgLight,
            '--bg-light-rgb': theme.bgLightRgb,
            '--blue-dark': theme.bgDark,
            '--bg-dark-rgb': theme.bgDarkRgb
        };
        Object.keys(map).forEach(function (k) {
            if (map[k]) root.style.setProperty(k, map[k]);
        });
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta && theme.bg) meta.setAttribute('content', theme.bg);
    }

    /* -------------------------------------------------------------- sections */

    var NAV_LABELS = {
        'fit': function (cfg) { return 'Why ' + cfg.company; },
        'ai-work': function () { return 'AI Work'; },
        'robotics': function () { return 'Robotics'; },
        'about': function () { return 'About'; },
        'journey': function () { return 'Journey'; },
        'news': function () { return 'News'; },
        'contact': function () { return 'Contact'; }
    };

    var HAS_CONFIG = {
        'fit': function (cfg) { return !!cfg.fit; },
        'ai-work': function (cfg) { return !!cfg.aiWork; },
        'robotics': function (cfg) { return !!cfg.robotics; },
        'about': function (cfg) { return !!cfg.about; },
        'journey': function (cfg) { return !!cfg.journey; },
        'news': function (cfg) { return !!cfg.news; },
        'contact': function (cfg) { return !!cfg.contact; }
    };

    function activeSections(cfg) {
        return (cfg.sections || []).filter(function (key) {
            return HAS_CONFIG[key] && HAS_CONFIG[key](cfg);
        });
    }

    function navBar(cfg, keys) {
        return '' +
        '<nav class="navbar">' +
            '<div class="nav-container">' +
                '<div class="nav-logo"><a href="#home">' + esc(C.PROFILE.name.toUpperCase()) + '</a></div>' +
                '<ul class="nav-menu">' +
                    '<li><a href="#home" class="nav-link">Home</a></li>' +
                    keys.map(function (k) {
                        return '<li><a href="#' + k + '" class="nav-link">' +
                            esc(NAV_LABELS[k](cfg)) + '</a></li>';
                    }).join('') +
                '</ul>' +
                '<div class="hamburger"><span></span><span></span><span></span></div>' +
            '</div>' +
        '</nav>';
    }

    function hero(cfg) {
        var h = cfg.hero || {};
        var ctas = (h.ctas || []).map(function (c) {
            return '<a href="' + esc(c.href) + '" class="cta-button' +
                (c.secondary ? ' cta-secondary' : '') + '">' + esc(c.label) + '</a>';
        }).join('');
        var now = h.now || ('<strong>Now:</strong> ' + C.PROFILE.now +
            ' <strong>Recently:</strong> ' + C.PROFILE.recently);

        return '' +
        '<section id="home" class="hero">' +
            '<div class="hero-background">' +
                '<div class="photo-slider photo-slider-left"></div>' +
                '<div class="photo-slider photo-slider-right"></div>' +
                '<div class="hero-overlay"></div>' +
            '</div>' +
            '<div class="hero-content">' +
                (h.kicker ? '<p class="hero-kicker">' + esc(h.kicker) + '</p>' : '') +
                '<h1 class="hero-title">' + esc(C.PROFILE.name) + '</h1>' +
                '<p class="hero-subtitle">' + esc(h.subtitle || C.PROFILE.tagline) + '</p>' +
                '<p class="hero-description">' + (h.description || C.PROFILE.blurb) + '</p>' +
                (ctas ? '<div class="hero-cta-row">' + ctas + '</div>' : '') +
                '<p class="hero-now">' + now + '</p>' +
            '</div>' +
        '</section>';
    }

    function fitSection(cfg) {
        var f = cfg.fit;
        return '' +
        '<section id="fit" class="about fit">' +
            '<div class="container">' +
                '<h2 class="section-title">' + esc(f.title || ('Why ' + cfg.company)) + '</h2>' +
                (f.intro ? '<p class="section-intro">' + f.intro + '</p>' : '') +
                '<div class="about-grid fit-grid">' +
                    (f.cards || []).map(function (card) {
                        return '<div class="about-card fit-card">' +
                            '<h3>' + esc(card.title) + '</h3><p>' + card.body + '</p></div>';
                    }).join('') +
                '</div>' +
            '</div>' +
        '</section>';
    }

    function aiSection(cfg) {
        var a = cfg.aiWork;
        var picked = pick(C.AI_WORK, a.items);

        var cards = picked.map(function (p) {
            var w = p.entry;
            var tid = 'case-' + w.id;
            var links = '<button type="button" class="ai-card-link" onclick="openCaseStudyModal(\'' +
                tid + '\')">Case study</button>';
            if (w.demo) {
                links += '<a href="' + esc(w.demo.href) +
                    '" class="ai-card-link ai-card-link-demo">' + esc(w.demo.label) + '</a>';
            }
            return '<article class="ai-card">' +
                '<h3><button type="button" class="ai-card-title-link" onclick="openCaseStudyModal(\'' +
                    tid + '\')">' + esc(w.title) + '</button></h3>' +
                '<p class="ai-card-hook">' + esc(w.hook) + '</p>' +
                (p.angle ? '<p class="ai-card-angle">' + p.angle + '</p>' : '') +
                chips(w.chips) +
                '<div class="ai-card-links">' + links + '</div>' +
            '</article>';
        }).join('');

        return '' +
        '<section id="ai-work" class="ai-work">' +
            '<div class="container">' +
                '<h2 class="section-title">' + esc(a.title || 'AI Work') + '</h2>' +
                (a.intro ? '<p class="section-intro">' + a.intro + '</p>' : '') +
                '<div class="ai-grid">' + cards + '</div>' +
            '</div>' +
        '</section>';
    }

    function roboticsSection(cfg) {
        var r = cfg.robotics;
        var picked = pick(C.ROBOTICS, r.items);

        var cards = picked.map(function (p) {
            var e = p.entry;
            return '<div class="project-card">' +
                '<div class="project-image ' + esc(e.imageClass) +
                    '" style="background-image: url(\'' + esc(e.image) + '\');">' +
                    '<div class="project-overlay"><h3>' + esc(e.title) + '</h3></div>' +
                '</div>' +
                '<div class="project-content">' +
                    '<div class="project-role">' + e.role + '</div>' +
                    (p.angle ? '<p class="project-angle">' + p.angle + '</p>' : '') +
                    '<p class="project-description">' + e.description + '</p>' +
                    '<div class="project-specs"><h4>' + e.specHeading + '</h4><ul>' +
                        e.specs.map(function (s) { return '<li>' + s + '</li>'; }).join('') +
                    '</ul></div>' +
                    '<button class="expand-button" onclick="openProjectModal(\'' + e.id + '\')">' +
                        esc(e.expandLabel) + '</button>' +
                    '<div class="project-expanded" data-project-id="' + e.id +
                        '" style="display: none;">' + e.media + '</div>' +
                '</div>' +
            '</div>';
        }).join('');

        return '' +
        '<section id="robotics" class="projects">' +
            '<div class="container">' +
                '<h2 class="section-title">' + esc(r.title || 'Robotics') + '</h2>' +
                (r.intro ? '<p class="section-intro">' + r.intro + '</p>' : '') +
                '<div class="projects-grid">' + cards + '</div>' +
            '</div>' +
        '</section>';
    }

    function aboutSection(cfg) {
        var a = cfg.about;
        return '' +
        '<section id="about" class="about">' +
            '<div class="container">' +
                '<h2 class="section-title">' + esc(a.title || 'Who I Am') + '</h2>' +
                (a.intro ? '<p class="section-intro">' + a.intro + '</p>' : '') +
                '<div class="about-grid">' +
                    C.ABOUT.map(function (card) {
                        return '<div class="about-card"><h3>' + card.title +
                            '</h3><p>' + card.body + '</p></div>';
                    }).join('') +
                '</div>' +
            '</div>' +
        '</section>';
    }

    function journeySection(cfg) {
        var j = cfg.journey;
        return '' +
        '<section id="journey" class="journey">' +
            '<div class="container">' +
                '<h2 class="section-title">' + esc(j.title || 'My Journey') + '</h2>' +
                (j.intro ? '<p class="section-intro">' + j.intro + '</p>' : '') +
                '<div class="timeline">' +
                    C.JOURNEY.map(function (item) {
                        return '<div class="timeline-item"><div class="timeline-marker"></div>' +
                            '<div class="timeline-content"><h3>' + item.title +
                            '</h3><p>' + item.body + '</p></div></div>';
                    }).join('') +
                '</div>' +
            '</div>' +
        '</section>';
    }

    function newsSection(cfg) {
        var n = cfg.news;
        return '' +
        '<section id="news" class="news">' +
            '<div class="container">' +
                '<h2 class="section-title">' + esc(n.title || 'In the News') + '</h2>' +
                '<div class="news-grid">' +
                    C.NEWS.map(function (item) {
                        return '<a href="' + esc(item.href) + '" class="news-card" target="_blank" rel="noopener">' +
                            '<div class="news-icon">' + item.icon + '</div>' +
                            '<h3>' + item.title + '</h3><p>' + item.blurb + '</p>' +
                            '<span class="news-link">' + item.cta + '</span></a>';
                    }).join('') +
                '</div>' +
            '</div>' +
        '</section>';
    }

    function contactSection(cfg) {
        var c = cfg.contact;
        var p = C.PROFILE;
        return '' +
        '<section id="contact" class="contact">' +
            '<div class="container">' +
                '<h2 class="section-title">' + esc(c.title || "Let's Connect") + '</h2>' +
                '<p class="contact-description">' + (c.description || '') + '</p>' +
                '<div class="contact-links">' +
                    '<a href="mailto:' + esc(p.email) + '" class="contact-link">' +
                        '<span class="contact-icon">&#9993;&#65039;</span><span>Email</span></a>' +
                    '<a href="' + esc(p.linkedin) + '" class="contact-link" target="_blank" rel="noopener">' +
                        '<span class="contact-icon">&#128188;</span><span>LinkedIn</span></a>' +
                    '<a href="' + esc(p.github) + '" class="contact-link" target="_blank" rel="noopener">' +
                        '<span class="contact-icon">&#128187;</span><span>GitHub</span></a>' +
                    '<a href="#" class="contact-link" onclick="openResumeModal(); return false;">' +
                        '<span class="contact-icon">&#128196;</span><span>Resume</span></a>' +
                '</div>' +
            '</div>' +
        '</section>';
    }

    var BUILDERS = {
        'fit': fitSection,
        'ai-work': aiSection,
        'robotics': roboticsSection,
        'about': aboutSection,
        'journey': journeySection,
        'news': newsSection,
        'contact': contactSection
    };

    function footer(cfg) {
        var p = C.PROFILE;
        return '' +
        '<footer class="footer">' +
            '<div class="container footer-inner">' +
                '<p class="footer-name">' + esc(p.name) + '</p>' +
                '<nav class="footer-links" aria-label="Footer">' +
                    '<a href="' + esc(p.github) + '" target="_blank" rel="noopener">GitHub</a>' +
                    '<a href="' + esc(p.linkedin) + '" target="_blank" rel="noopener">LinkedIn</a>' +
                    '<a href="mailto:' + esc(p.email) + '">Email</a>' +
                    '<a href="' + esc(p.resume) + '">Resume</a>' +
                    '<a href="' + esc(p.demo) + '">Live demo</a>' +
                    '<a href="/">ooster.house</a>' +
                '</nav>' +
                (cfg.footerNote ? '<p class="footer-note">' + esc(cfg.footerNote) + '</p>' : '') +
            '</div>' +
        '</footer>';
    }

    /* Case study bodies live in inert <template>s and are cloned into the
       shared modal by openCaseStudyModal in script.js. */
    function caseTemplates(cfg) {
        return pick(C.AI_WORK, (cfg.aiWork || {}).items).map(function (p) {
            return '<template id="case-' + p.entry.id + '">' + p.entry.caseStudy + '</template>';
        }).join('');
    }

    function modals() {
        var closeIcon =
            '<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M10 10L30 30M30 10L10 30" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>';
        return '' +
        '<div id="project-modal" class="project-modal">' +
            '<div class="modal-backdrop" onclick="closeProjectModal()"></div>' +
            '<div class="modal-content">' +
                '<button class="modal-close" onclick="closeProjectModal()" aria-label="Close modal">' +
                    closeIcon + '</button>' +
                '<div class="modal-body" id="modal-body"></div>' +
            '</div>' +
        '</div>' +
        '<div id="resume-modal" class="project-modal">' +
            '<div class="modal-backdrop" onclick="closeResumeModal()"></div>' +
            '<div class="modal-content">' +
                '<button class="modal-close" onclick="closeResumeModal()" aria-label="Close resume modal">' +
                    closeIcon + '</button>' +
                '<div class="modal-body resume-modal-body">' +
                    '<div class="pdf-container resume-pdf-container">' +
                        '<iframe src="' + esc(C.PROFILE.resume) +
                        '" loading="lazy" frameborder="0" allowfullscreen="" title="Resume PDF"></iframe>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    /* ----------------------------------------------------------- not found */

    function notFound() {
        /* Never echo the requested path back into the page. */
        return '' +
        '<main class="page-missing">' +
            '<div class="container">' +
                '<p class="page-missing-code">404</p>' +
                '<h1>This page does not exist.</h1>' +
                '<p>Check the address, or head back to the main site.</p>' +
                '<a href="/" class="cta-button">Go to ooster.house</a>' +
            '</div>' +
        '</main>';
    }

    /* ------------------------------------------------------------- bootstrap */

    function slugFromLocation() {
        var params = new URLSearchParams(global.location.search);
        var override = params.get('company');
        if (override) return override.toLowerCase();
        return global.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    }

    function render() {
        var mount = document.getElementById('app');
        if (!mount) return;

        var slug = slugFromLocation();
        var cfg = Object.prototype.hasOwnProperty.call(COMPANIES, slug)
            ? COMPANIES[slug]
            : null;

        if (!cfg) {
            document.title = 'Not found | ' + C.PROFILE.name;
            mount.innerHTML = notFound();
            document.body.classList.add('is-missing');
            return;
        }

        applyTheme(cfg.theme);
        document.title = cfg.title || (C.PROFILE.name + ' for ' + cfg.company);
        var desc = document.querySelector('meta[name="description"]');
        if (desc && cfg.description) desc.setAttribute('content', cfg.description);

        var keys = activeSections(cfg);
        mount.innerHTML =
            navBar(cfg, keys) +
            hero(cfg) +
            keys.map(function (k) { return BUILDERS[k](cfg); }).join('') +
            footer(cfg) +
            caseTemplates(cfg) +
            modals();
    }

    render();
})(window);
