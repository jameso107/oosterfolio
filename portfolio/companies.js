/*
 * Company portfolio configs for ooster.house.
 *
 * Every entry here becomes a hidden page at ooster.house/<slug>. Nothing on the
 * public site links to them and they are marked noindex, so a page is only
 * reachable by typing the URL or by sending someone the link.
 *
 * To add a company:
 *   1. Copy the TEMPLATE block at the bottom of this file.
 *   2. Add it to COMPANIES under the slug you want in the URL.
 *   3. Deploy. No routing change is needed, /<slug> already resolves here.
 *
 * Field reference
 *   company       Display name of the company.
 *   role          The role this page is aimed at.
 *   title         <title> of the page.
 *   description   <meta name="description">, also used for the link preview.
 *   theme         Re-skins the entire site. Hex values plus matching
 *                 "R G B" channel strings, which translucent styles read.
 *   hero          kicker, subtitle, description, ctas, now.
 *   fit           The "Why <company>" block. This is the part worth writing well.
 *   aiWork        intro plus an ordered list of AI_WORK ids from content.js.
 *                 Each item may carry an "angle": one line on why it matters here.
 *   robotics      Same shape, over ROBOTICS ids.
 *   about         Set to an object to include the three Who I Am cards.
 *   journey       Set to an object to include the full timeline.
 *   news          Set to an object to include the press links.
 *   contact       Closing block above the footer.
 *   sections      Render order. A key with no config is skipped.
 *
 * Two standing copy rules: no em dashes in anything that renders, and only
 * facts that are already true elsewhere on this site.
 */
(function (global) {
    'use strict';

    var COMPANIES = {

        /* ------------------------------------------------------------------
         * /disney is NOT here on purpose. It has a hand-built page at
         * disney.html in the repo root, and Vercel checks the filesystem
         * before it checks rewrites, so /disney resolves to that file and
         * never reaches the /:slug rewrite. Any company that outgrows this
         * template can do the same: drop <slug>.html at the root.
         * ------------------------------------------------------------------ */

        /* ----------------------------------------------------------------- */
        nasa: {
            company: 'NASA',
            role: 'Software Engineer',
            title: 'James Oosterhouse for NASA | Software Engineer',
            description: "A portfolio written for NASA. A summer inside Mars Science Laboratory operations, a hackathon build that won the Mission Critical Award, and robotics done under real constraints.",

            theme: {
                accent: '#FF5B3C',
                accentBright: '#FF7F63',
                accentRgb: '255 91 60',
                bg: '#050F2E',
                bgRgb: '5 15 46',
                bgLight: '#0E2350',
                bgLightRgb: '14 35 80',
                bgDark: '#02081C',
                bgDarkRgb: '2 8 28'
            },

            hero: {
                kicker: 'Written for NASA',
                subtitle: 'Software Engineer',
                description: "I spent the summer of 2026 at JPL as an ethnographic software engineering intern, sitting in with Mars Science Laboratory downlink operations. I wanted to know whether operators trusted Faro, the GenAI analysis tool they had been given, so I built a gaze tracking tool to measure where they actually looked. They did not trust it, and the gap between experts and novices came out at 67%. I wrote up the five things that would have to change before it could be trusted with mission-critical work. Over one weekend of the JPL hackathon I built TRIAGE, and it won the Mission Critical Award. I would like to come back.",
                ctas: [
                    { label: 'Why I fit here', href: '#fit' },
                    { label: 'Try the live demo', href: '/demo/triage', secondary: true }
                ],
                now: '<strong>Now:</strong> Founder &amp; CEO of SYZYGY.services. <strong>Recently:</strong> NASA JPL, where I studied how Mars mission operators trust AI tools.'
            },

            fit: {
                title: 'Why NASA',
                intro: "I have already worked in one of your buildings. Here is what I took from it and what I would bring back.",
                cards: [
                    {
                        title: 'I have already done this work here',
                        body: "Last summer I was inside Mars Science Laboratory downlink operations, watching how operators used Faro on live Curiosity shifts and measuring it with a gaze tracker I wrote for the study. The mistrust among the experts was statistically significant, and I left the team a plan for fixing it. JPL sent me home with the Shining Star Award. The full write-up is further down this page."
                    },
                    {
                        title: "Numbers first, prose second",
                        body: "TRIAGE took the Mission Critical Award at the JPL hackathon, and its rule is the one I use everywhere now. Every statistic is computed so a reviewer can work it out again, the language model only writes the sentences around those numbers, and an engineer makes the call. The public rebuild runs on real Ingenuity data if you want to check my arithmetic."
                    },
                    {
                        title: 'Robotics under real constraints',
                        body: "Before the AI work I was on a plant floor writing PLC logic and training industrial arms, usually with a line stopped and somebody waiting on me. There is a self-balancing ballbot further down this page with the controls written up. I am used to hardware that has to keep working when nobody is standing next to it."
                    }
                ]
            },

            aiWork: {
                intro: "Four things I have built, starting with the two that came out of JPL. One of them you can open and run yourself.",
                items: [
                    { id: 'triage', angle: "Built at the hackathon. Rebuilt in public on open NASA data so you can run it yourself." },
                    { id: 'jpl-research', angle: "The MSL downlink study, the gaze tracker I built to run it, and the plan I left behind." },
                    { id: 'koopsgpt', angle: "Proof the idea travels. People with deep domain knowledge chose to keep using this one." },
                    { id: 'specinator', angle: "Where I do my evaluation work: judge scoring and trace analysis before every release." }
                ]
            },

            robotics: {
                intro: "Robotics is where I learned to build hardware and software on a real deadline with a real budget.",
                items: [
                    { id: 'ballbot', angle: "Dynamic balancing, written up properly." },
                    { id: 'robot-in-3-days', angle: "Fifteen alumni, three days, one working robot." },
                    { id: 'tshirt-cannon', angle: "A pressurized launcher, a 2 DOF turret, and closed-loop control on a mobile base." },
                    { id: 'first-robotics', angle: "Eight years in the program that sends people to places like JPL." },
                    { id: 'haunted-house', angle: "What I do when the budget is nearly zero and it still has to work on the night." }
                ]
            },

            about: {},
            journey: {},
            news: {},

            contact: {
                title: "Let's Connect",
                description: "I would love to talk about coming back. Email reaches me quickest."
            },

            footerNote: 'Written for NASA. An independent application page, not affiliated with or endorsed by NASA or the Jet Propulsion Laboratory.',

            sections: ['fit', 'ai-work', 'robotics', 'about', 'journey', 'news', 'contact']
        }

    };

    /*
     * TEMPLATE. Copy this, drop it into COMPANIES above under a new slug, and
     * the page is live at ooster.house/<slug>. Delete any section you do not
     * want and remove its key from "sections".
     *
     *   acme: {
     *       company: 'Acme',
     *       role: 'Software Engineer',
     *       title: 'James Oosterhouse for Acme | Software Engineer',
     *       description: 'One sentence for the tab and the link preview.',
     *       theme: {
     *           accent: '#FFCB05', accentBright: '#FFD700', accentRgb: '255 203 5',
     *           bg: '#00274C', bgRgb: '0 39 76',
     *           bgLight: '#003A6B', bgLightRgb: '0 58 107',
     *           bgDark: '#001A33', bgDarkRgb: '0 26 51'
     *       },
     *       hero: {
     *           kicker: 'Written for the team at Acme',
     *           subtitle: 'Software Engineer',
     *           description: 'Two or three sentences aimed squarely at this company.',
     *           ctas: [
     *               { label: 'Why I fit here', href: '#fit' },
     *               { label: 'Try the live demo', href: '/demo/triage', secondary: true }
     *           ]
     *       },
     *       fit: {
     *           title: 'Why Acme',
     *           intro: 'One line setting up the three cards.',
     *           cards: [
     *               { title: 'Claim one', body: 'The evidence for it.' },
     *               { title: 'Claim two', body: 'The evidence for it.' },
     *               { title: 'Claim three', body: 'The evidence for it.' }
     *           ]
     *       },
     *       aiWork: {
     *           intro: 'Optional intro line.',
     *           items: [
     *               { id: 'triage', angle: 'Why this one matters to Acme.' },
     *               { id: 'koopsgpt' },
     *               { id: 'specinator' },
     *               { id: 'jpl-research' }
     *           ]
     *       },
     *       robotics: {
     *           intro: 'Optional intro line.',
     *           items: [
     *               { id: 'tshirt-cannon' }, { id: 'ballbot' },
     *               { id: 'haunted-house' }, { id: 'robot-in-3-days' },
     *               { id: 'first-robotics' }
     *           ]
     *       },
     *       about: {},
     *       journey: {},
     *       news: {},
     *       contact: { title: 'Let us connect', description: 'How to reach me.' },
     *       footerNote: 'Written for Acme. An independent application page, not affiliated with or endorsed by Acme.',
     *       sections: ['fit', 'ai-work', 'robotics', 'about', 'journey', 'news', 'contact']
     *   }
     */

    global.PortfolioCompanies = COMPANIES;
})(window);
