/*
 * Shared content library for ooster.house.
 *
 * Every company page at /<slug> draws its copy from here and picks which of
 * these blocks to show, in what order, from portfolio/companies.js. The public
 * landing page (index.html) is deliberately static HTML instead, so it renders
 * without JavaScript and stays crawlable.
 *
 * Copy is the vetted ground truth. Two standing rules when editing:
 *   1. No em dashes in anything that renders on screen.
 *   2. Only facts that are already true elsewhere on this site.
 *
 * Plain script, no build step. Load order: content.js, companies.js, render.js.
 */
(function (global) {
    'use strict';

    var PROFILE = {
        name: 'James Oosterhouse',
        tagline: 'Engineer. Servant Leader. Believer.',
        blurb: 'I am a robotics engineer who cares most about the people who have to use what I build. Lately that has meant AI tools for businesses, robots that have to work with a crowd watching, and a summer at NASA JPL asking Mars operators whether they trust their software.',
        now: 'Founder &amp; CEO of SYZYGY.services.',
        recently: 'NASA JPL, where I studied how Mars mission operators trust AI tools.',
        email: 'jamesoo@umich.edu',
        linkedin: 'https://www.linkedin.com/in/james-oosterhouse/',
        github: 'https://github.com/jameso107',
        resume: '/26_resume.pdf',
        demo: '/demo/triage'
    };

    var ABOUT = [
        { title: "Maker of Things", body: "I'm a Robotics Engineering student at the University of Michigan, and my passion for engineering has burned bright since I joined a FIRST robotics team 8 years ago. Since then, my journey has developed my skills in programming, engineering management, strategic design, and so much more." },
        { title: "Servant Leader", body: "Society sees leadership as a pyramid, with leadership as a path to the top. In reality, flip the pyramid; the leader is at the bottom and should do everything they can to serve the team and their people. I've been blessed to lead many teams, from a state championship soccer team to a pro-bono engineering consulting group. Every moment has shown me how to love people." },
        { title: "Omnivore of Ideas", body: "My interests are nothing short of broad, and to me, that is what makes me who I am. A passionate Michigan sports fan, I recently served as an agent on six NIL deals. An amateur historian, I often deep-dive into topics such as World War II, Star Wars, computing, and more. These are just the tip of the iceberg in my journey as a lifelong omnivore of interests." },
    ];

    var AI_WORK = [
        {
            id: "triage",
            title: "TRIAGE",
            hook: "Working out why a Mars helicopter test went wrong.",
            chips: [
                "JPL Mission Critical Award",
                "Solo build",
                "Live public rebuild",
            ],
            demo: { href: "/demo/triage", label: "Try the demo" },
            caseStudy: `
        <p class="case-modal-kicker">AI Work / Case Study</p>
        <h2 class="case-title">TRIAGE: root cause analysis for a Mars helicopter</h2>
        <p class="case-summary">I spent a hackathon weekend at JPL building a dashboard that helps engineers work out why a Mars Sample Return helicopter test did not go the way they expected. I built it alone.</p>
        <div class="chip-row">
            <span class="chip">JPL Mission Critical Award</span>
            <span class="chip">Solo build</span>
            <span class="chip">Live public rebuild</span>
        </div>
        <div class="case-section">
            <h2>Context</h2>
            <p>Flight test data repeats, and there is a lot of it. Engineers were spending their time deciding whether a number was ordinary variation or a real problem, and getting that call wrong in either direction costs money.</p>
        </div>
        <div class="case-section">
            <h2>What I built</h2>
            <p>The statistics layer flags telemetry that falls outside the expected envelope. Fine-tuned internal local models then turn those flags into plain-language root cause narratives that an engineer can accept, edit, or reject. Nothing gets dispositioned without a person signing off on it.</p>
        </div>
        <div class="case-section">
            <h2>Outcome</h2>
            <p>It won the hackathon's Mission Critical Award, which I did not see coming.</p>
        </div>
        <div class="case-section">
            <h2>What I learned</h2>
            <p>In a review that matters, people believe a number they can work out themselves. That is why the statistics stay deterministic and the language model only writes the prose around them. I have built everything since the same way.</p>
        </div>
        <div class="case-section">
            <h2>Try it</h2>
            <p>The internal tool stays at JPL, so I rebuilt the idea in public on open NASA flight data. It replays Ingenuity flights in 3D with charts that move alongside them and example GenAI narratives.</p>
        </div>
        <div class="case-cta-row">
            <a href="/demo/triage" class="cta-button">Run the live demo</a>
        </div>
`
        },
        {
            id: "specinator",
            title: "SPECINATOR",
            hook: "Reading spec documents so a business development team does not have to.",
            chips: [
                "15 min to 4 min per document",
                "92% to 98% accuracy",
            ],
            caseStudy: `
        <p class="case-modal-kicker">AI Work / Case Study</p>
        <h2 class="case-title">SPECINATOR: reading the specs so the team does not have to</h2>
        <p class="case-summary">A tool I built through SYZYGY for an electrical engineering firm. Their business development team uses it to decide which jobs to chase.</p>
        <div class="chip-row">
            <span class="chip">15 min to 4 min per document</span>
            <span class="chip">92% to 98% accuracy</span>
        </div>
        <div class="case-section">
            <h2>Context</h2>
            <p>Every inbound opportunity started with somebody reading a long specification document to work out whether the firm could do the job. That took about 15 minutes a document and landed at 92% accuracy. The ones they got wrong were lost bids.</p>
        </div>
        <div class="case-section">
            <h2>What I built</h2>
            <p>SPECINATOR reads the document, pulls out the requirements that actually drive the decision, and hands back a recommendation with the source passages attached. That last part matters more than it sounds, because the team can check the answer without going back into the PDF. Underneath it is prompt design and retrieval over the firm's own specification library, and a person signs off on every accept or reject.</p>
        </div>
        <figure class="case-figure">
            <svg viewBox="0 0 920 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SPECINATOR pipeline: intake, extraction, structured recommendation, then human review, with review decisions feeding the next release.">
                <defs>
                    <marker id="spec-arrow-m" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--maize)"/>
                    </marker>
                </defs>
                <rect x="16" y="70" width="190" height="110" rx="12" fill="var(--blue-light)" stroke="var(--maize)" stroke-width="1.5"/>
                <text x="111" y="108" text-anchor="middle" fill="var(--maize)" font-family="Inter, sans-serif" font-size="16" font-weight="600">Intake</text>
                <text x="111" y="134" text-anchor="middle" fill="var(--white)" font-family="Inter, sans-serif" font-size="12.5">Inbound specification</text>
                <text x="111" y="152" text-anchor="middle" fill="var(--white)" font-family="Inter, sans-serif" font-size="12.5">document</text>
                <rect x="252" y="70" width="190" height="110" rx="12" fill="var(--blue-light)" stroke="var(--maize)" stroke-width="1.5"/>
                <text x="347" y="108" text-anchor="middle" fill="var(--maize)" font-family="Inter, sans-serif" font-size="16" font-weight="600">Extraction</text>
                <text x="347" y="134" text-anchor="middle" fill="var(--white)" font-family="Inter, sans-serif" font-size="12.5">Decision-relevant</text>
                <text x="347" y="152" text-anchor="middle" fill="var(--white)" font-family="Inter, sans-serif" font-size="12.5">requirements</text>
                <rect x="488" y="70" width="190" height="110" rx="12" fill="var(--blue-light)" stroke="var(--maize)" stroke-width="1.5"/>
                <text x="583" y="102" text-anchor="middle" fill="var(--maize)" font-family="Inter, sans-serif" font-size="16" font-weight="600">Recommendation</text>
                <text x="583" y="128" text-anchor="middle" fill="var(--white)" font-family="Inter, sans-serif" font-size="12.5">Structured fit call with</text>
                <text x="583" y="146" text-anchor="middle" fill="var(--white)" font-family="Inter, sans-serif" font-size="12.5">source passages attached</text>
                <rect x="724" y="70" width="180" height="110" rx="12" fill="var(--blue)" stroke="var(--maize)" stroke-width="2.5"/>
                <text x="814" y="102" text-anchor="middle" fill="var(--maize)" font-family="Inter, sans-serif" font-size="16" font-weight="600">Human review</text>
                <text x="814" y="128" text-anchor="middle" fill="var(--white)" font-family="Inter, sans-serif" font-size="12.5">BD engineer verifies,</text>
                <text x="814" y="146" text-anchor="middle" fill="var(--white)" font-family="Inter, sans-serif" font-size="12.5">accepts or rejects</text>
                <line x1="206" y1="125" x2="245" y2="125" stroke="var(--maize)" stroke-width="2" marker-end="url(#spec-arrow-m)"/>
                <line x1="442" y1="125" x2="481" y2="125" stroke="var(--maize)" stroke-width="2" marker-end="url(#spec-arrow-m)"/>
                <line x1="678" y1="125" x2="717" y2="125" stroke="var(--maize)" stroke-width="2" marker-end="url(#spec-arrow-m)"/>
                <path d="M 814 180 L 814 232 L 347 232 L 347 187" fill="none" stroke="var(--maize)" stroke-width="1.5" stroke-dasharray="6 5" marker-end="url(#spec-arrow-m)"/>
                <text x="580" y="252" text-anchor="middle" fill="var(--white)" opacity="0.8" font-family="Inter, sans-serif" font-size="12">Every accept/reject decision feeds the next release</text>
            </svg>
            <figcaption>SPECINATOR's pipeline. Built for a client's internal use, so this shows architecture rather than screenshots.</figcaption>
        </figure>
        <div class="case-section">
            <h2>How I tested it</h2>
            <p>Before every release I scored the outputs with an LLM-as-judge setup, then traced the failures back through the pipeline until I found what caused them and re-ran until that failure was gone.</p>
        </div>
        <div class="case-section">
            <h2>Outcome</h2>
            <p>Intake went from 15 minutes a document down to 4, and accuracy from 92% to 98%. The part the team cares about is that they now read everything that comes in, rather than picking which documents were worth the time.</p>
        </div>
`
        },
        {
            id: "koopsgpt",
            title: "KoopsGPT",
            hook: "The LLM suite Koops still runs every day.",
            chips: [
                "40+ daily users",
                "4,000+ hours/year saved",
            ],
            caseStudy: `
        <p class="case-modal-kicker">AI Work / Case Study</p>
        <h2 class="case-title">KoopsGPT: the tool Koops still uses</h2>
        <p class="case-summary">An LLM suite I pitched, built, and rolled out at Koops Automation Systems. It is still running there.</p>
        <div class="chip-row">
            <span class="chip">40+ daily users</span>
            <span class="chip">4,000+ hours/year saved</span>
        </div>
        <div class="case-section">
            <h2>Context</h2>
            <p>Quoting, contract review, and risk analysis at an automation builder means hours inside dense documents, plus a lot of knowledge that only lives in people's heads. I was an intern that summer. I asked leadership to let me build something for it, and they said yes.</p>
        </div>
        <div class="case-section">
            <h2>What I built</h2>
            <p>It sits on top of Koops's own data. Ask it to draft a quote and it works from past wins. Hand it a contract and it tells you where this one departs from precedent. Point it at a job and it flags the risk earlier than somebody reading cold would. I trained the team myself, sat with them while they used it, and built whatever they asked for next.</p>
        </div>
        <figure class="case-figure">
            <svg viewBox="0 0 920 330" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="KoopsGPT architecture: enterprise data sources feed a retrieval layer, three agents for quoting, contract review, and risk analysis draw on it, and the team works through one chat surface.">
                <defs>
                    <marker id="koops-arrow-m" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--maize)"/>
                    </marker>
                </defs>
                <rect x="16" y="240" width="888" height="74" rx="12" fill="var(--blue-light)" stroke="var(--maize)" stroke-width="1.5"/>
                <text x="460" y="270" text-anchor="middle" fill="var(--maize)" font-family="Inter, sans-serif" font-size="15" font-weight="600">Enterprise data sources</text>
                <text x="460" y="294" text-anchor="middle" fill="var(--white)" font-family="Inter, sans-serif" font-size="12.5">Quote history &#183; contracts &#183; project records &#183; engineering documents</text>
                <rect x="16" y="152" width="888" height="60" rx="12" fill="var(--blue-light)" stroke="var(--maize)" stroke-width="1.5"/>
                <text x="460" y="178" text-anchor="middle" fill="var(--maize)" font-family="Inter, sans-serif" font-size="15" font-weight="600">Retrieval layer (RAG)</text>
                <text x="460" y="198" text-anchor="middle" fill="var(--white)" font-family="Inter, sans-serif" font-size="12.5">Grounds every answer in the company's own precedent</text>
                <rect x="16" y="64" width="280" height="60" rx="12" fill="var(--blue-light)" stroke="var(--maize)" stroke-width="1.5"/>
                <text x="156" y="90" text-anchor="middle" fill="var(--maize)" font-family="Inter, sans-serif" font-size="14.5" font-weight="600">Quoting agent</text>
                <text x="156" y="110" text-anchor="middle" fill="var(--white)" font-family="Inter, sans-serif" font-size="12">Drafts against past wins</text>
                <rect x="320" y="64" width="280" height="60" rx="12" fill="var(--blue-light)" stroke="var(--maize)" stroke-width="1.5"/>
                <text x="460" y="90" text-anchor="middle" fill="var(--maize)" font-family="Inter, sans-serif" font-size="14.5" font-weight="600">Contract review agent</text>
                <text x="460" y="110" text-anchor="middle" fill="var(--white)" font-family="Inter, sans-serif" font-size="12">Compares to precedent</text>
                <rect x="624" y="64" width="280" height="60" rx="12" fill="var(--blue-light)" stroke="var(--maize)" stroke-width="1.5"/>
                <text x="764" y="90" text-anchor="middle" fill="var(--maize)" font-family="Inter, sans-serif" font-size="14.5" font-weight="600">Risk analysis agent</text>
                <text x="764" y="110" text-anchor="middle" fill="var(--white)" font-family="Inter, sans-serif" font-size="12">Flags exposure earlier</text>
                <rect x="270" y="6" width="380" height="34" rx="17" fill="var(--blue)" stroke="var(--maize)" stroke-width="2.5"/>
                <text x="460" y="28" text-anchor="middle" fill="var(--maize)" font-family="Inter, sans-serif" font-size="14" font-weight="600">Chat surface: one front door for the BD team</text>
                <line x1="460" y1="240" x2="460" y2="219" stroke="var(--maize)" stroke-width="2" marker-end="url(#koops-arrow-m)"/>
                <line x1="156" y1="152" x2="156" y2="131" stroke="var(--maize)" stroke-width="2" marker-end="url(#koops-arrow-m)"/>
                <line x1="460" y1="152" x2="460" y2="131" stroke="var(--maize)" stroke-width="2" marker-end="url(#koops-arrow-m)"/>
                <line x1="764" y1="152" x2="764" y2="131" stroke="var(--maize)" stroke-width="2" marker-end="url(#koops-arrow-m)"/>
                <line x1="460" y1="64" x2="460" y2="47" stroke="var(--maize)" stroke-width="2" marker-end="url(#koops-arrow-m)"/>
                <text x="880" y="30" text-anchor="end" fill="var(--white)" opacity="0.7" font-family="Inter, sans-serif" font-size="11.5">LLM APIs power each agent</text>
            </svg>
            <figcaption>KoopsGPT's architecture. It runs on internal company data, so there are no screenshots to show.</figcaption>
        </figure>
        <div class="case-section">
            <h2>Outcome</h2>
            <p>Around 40 people use it daily, and each of them gets back 2 or more hours a week. Across the company that comes to 4,000+ hours a year. It is still running now that my internship is over, and that is the part I am proudest of.</p>
        </div>
        <div class="case-section">
            <h2>What I learned</h2>
            <p>Getting people to use it was harder than building it. Watching where somebody hesitated and then fixing that one thing did more for usage than any model upgrade I tried.</p>
        </div>
`
        },
        {
            id: "jpl-research",
            title: "Do Experts Trust AI? (JPL Research)",
            hook: "A summer inside Mars operations, asking who trusts the AI.",
            chips: [
                "67% expert/novice trust gap",
                "NASA Shining Star Award (4 of 1,200+)",
            ],
            caseStudy: `
        <p class="case-modal-kicker">AI Work / Research</p>
        <h2 class="case-title">Do experts trust AI? Field research inside Mars operations</h2>
        <p class="case-summary">JPL put me in the room where Curiosity gets flown. I spent the summer watching how downlink operators used Faro, their GenAI analysis tool, and working out whether they trusted it.</p>
        <div class="chip-row">
            <span class="chip">67% expert/novice trust gap</span>
            <span class="chip">NASA Shining Star Award (4 of 1,200+)</span>
        </div>
        <div class="case-section">
            <h2>What I did</h2>
            <p>I sat with expert and novice operators through live operations. People are not always accurate about their own habits, so I wrote an instrument for it: a gaze tracker built on OpenFace 2.0 that ties eye position to whichever region of the screen a person is looking at. That gave me heatmaps and hard numbers on how much each of them leaned on Faro, which I could set next to what they told me in conversation.</p>
        </div>
        <figure class="case-figure">
            <svg viewBox="0 0 920 380" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Illustration of two operator screens. The novice operator's gaze concentrates on the GenAI analysis panel; the expert operator's gaze concentrates on raw telemetry. Labeled as an illustration, not actual study data.">
                <defs>
                    <radialGradient id="heat-hot-m" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="var(--maize)" stop-opacity="0.9"/>
                        <stop offset="45%" stop-color="#FF9E1B" stop-opacity="0.55"/>
                        <stop offset="100%" stop-color="#FF9E1B" stop-opacity="0"/>
                    </radialGradient>
                    <radialGradient id="heat-warm-m" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="var(--maize)" stop-opacity="0.5"/>
                        <stop offset="100%" stop-color="#FF9E1B" stop-opacity="0"/>
                    </radialGradient>
                </defs>
                <text x="235" y="28" text-anchor="middle" fill="var(--maize)" font-family="Inter, sans-serif" font-size="16" font-weight="600">Novice operator</text>
                <rect x="30" y="44" width="410" height="250" rx="10" fill="var(--blue-dark)" stroke="var(--maize)" stroke-width="1.5"/>
                <rect x="48" y="62" width="180" height="100" rx="6" fill="var(--blue-light)" opacity="0.85"/>
                <text x="138" y="80" text-anchor="middle" fill="var(--white)" opacity="0.75" font-family="Inter, sans-serif" font-size="11">Raw telemetry</text>
                <rect x="48" y="176" width="180" height="100" rx="6" fill="var(--blue-light)" opacity="0.85"/>
                <text x="138" y="194" text-anchor="middle" fill="var(--white)" opacity="0.75" font-family="Inter, sans-serif" font-size="11">Channel plots</text>
                <rect x="244" y="62" width="178" height="214" rx="6" fill="var(--blue-light)"/>
                <text x="333" y="80" text-anchor="middle" fill="var(--white)" opacity="0.9" font-family="Inter, sans-serif" font-size="11">GenAI analysis (Faro)</text>
                <ellipse cx="333" cy="170" rx="110" ry="95" fill="url(#heat-hot-m)"/>
                <ellipse cx="330" cy="230" rx="70" ry="50" fill="url(#heat-warm-m)"/>
                <ellipse cx="138" cy="110" rx="48" ry="34" fill="url(#heat-warm-m)"/>
                <text x="685" y="28" text-anchor="middle" fill="var(--maize)" font-family="Inter, sans-serif" font-size="16" font-weight="600">Expert operator</text>
                <rect x="480" y="44" width="410" height="250" rx="10" fill="var(--blue-dark)" stroke="var(--maize)" stroke-width="1.5"/>
                <rect x="498" y="62" width="180" height="100" rx="6" fill="var(--blue-light)"/>
                <text x="588" y="80" text-anchor="middle" fill="var(--white)" opacity="0.9" font-family="Inter, sans-serif" font-size="11">Raw telemetry</text>
                <rect x="498" y="176" width="180" height="100" rx="6" fill="var(--blue-light)"/>
                <text x="588" y="194" text-anchor="middle" fill="var(--white)" opacity="0.9" font-family="Inter, sans-serif" font-size="11">Channel plots</text>
                <rect x="694" y="62" width="178" height="214" rx="6" fill="var(--blue-light)" opacity="0.85"/>
                <text x="783" y="80" text-anchor="middle" fill="var(--white)" opacity="0.75" font-family="Inter, sans-serif" font-size="11">GenAI analysis (Faro)</text>
                <ellipse cx="588" cy="118" rx="105" ry="72" fill="url(#heat-hot-m)"/>
                <ellipse cx="585" cy="222" rx="85" ry="60" fill="url(#heat-hot-m)"/>
                <ellipse cx="783" cy="120" rx="45" ry="34" fill="url(#heat-warm-m)"/>
                <ellipse cx="330" cy="330" rx="16" ry="12" fill="url(#heat-hot-m)"/>
                <text x="354" y="335" fill="var(--white)" opacity="0.85" font-family="Inter, sans-serif" font-size="12.5">High gaze dwell</text>
                <ellipse cx="510" cy="330" rx="16" ry="12" fill="url(#heat-warm-m)"/>
                <text x="534" y="335" fill="var(--white)" opacity="0.85" font-family="Inter, sans-serif" font-size="12.5">Low gaze dwell</text>
                <text x="460" y="368" text-anchor="middle" fill="var(--maize)" opacity="0.9" font-family="Inter, sans-serif" font-size="12.5" font-weight="600">Illustration recreated to show the method. Not actual study data.</text>
            </svg>
            <figcaption>How the gaze tracking read out: novices leaned on the GenAI panel while experts kept their eyes on raw telemetry. A recreated illustration of the method, not actual study data.</figcaption>
        </figure>
        <div class="case-section">
            <h2>What I found</h2>
            <p>Expert operators mistrusted Faro, and the difference held up statistically: a 67% gap in trust between experts and novices. The newer operators leaned on it. The people who knew the most trusted it least.</p>
        </div>
        <div class="case-section">
            <h2>What happened next</h2>
            <p>I wrote a 5-point plan for getting Faro ready for mission-critical use and handed it to the team. JPL closed out my summer with the NASA Shining Star Award, one of 4 given to interns out of more than 1,200 across all the centers. I did not expect that one.</p>
        </div>
        <div class="case-section">
            <h2>Why it matters for building</h2>
            <p>That summer rearranged my priorities. Before I ask whether a model is good enough, I ask who is going to have to believe it, and what would make them. If the people who know the work best will not use the thing, nothing else about it matters much.</p>
        </div>
`
        },
    ];

    var ROBOTICS = [
        {
            id: "tshirt-cannon",
            title: "T-shirt Cannon Robot",
            imageClass: "tshirt-robot",
            image: "/1.jpg",
            role: "Project Manager & Engineer",
            description: "I designed, built, and programmed the world's most powerful mobile robotic t-shirt cannon. Alongside two of my friends, this out-of-work project was funded by Koops Automation and is used for marketing and community events. Our goal was to create a technically sound robot that demonstrates the coolness of STEM, while simultaneously promoting Koops Automation.",
            specHeading: "Technical Specs:",
            specs: [
                "<strong>Cannon:</strong> CO2-powered firing system operating at 150psi, range of 250+ feet, 4 projectile capacity",
                "<strong>Drivetrain:</strong> 8-wheel base geared for 9 fps, drop-center design, using 4 NEO brushless motors",
                "<strong>Turret:</strong> 2 DOF, 180° turret powered by 1 NEO geared 60:1, 115° dual chain pivot powered by 1 NEO geared 60:1",
                "<strong>Controls:</strong> FRC Control System (RoboRIO, Radio, PDP, VRM), Through-bore encoders, and limit switches",
            ],
            expandLabel: "Expand",
            media: `
        <div class="media-grid">
            <div class="linkedin-container">
                <iframe src="https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7378523807201837056?compact=1" height="399" width="504" loading="lazy" frameborder="0" allowfullscreen="" title="Embedded post"></iframe>
            </div>
            <div class="cad-image-container">
                <img src="/MAIN (1).png" alt="T-shirt Cannon Robot CAD Design" class="cad-image" loading="lazy">
            </div>
        </div>
        <div class="video-container" style="margin-top: 2rem;">
            <iframe width="560" height="315" src="https://www.youtube.com/embed/EB0If7glSUw?si=2TOg7lxQEfwLh_hw" title="YouTube video player" loading="lazy" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        </div>
`
        },
        {
            id: "ballbot",
            title: "Ballbot",
            imageClass: "ballbot",
            image: "/2.jpg",
            role: "Robotics Engineer",
            description: "Working with 2 other robotics majors, we built a self-balancing \"Ballbot\" from scratch. This project pushed our understanding of control systems and dynamic balancing. To learn more, view our technical report!",
            specHeading: "Technical Specs:",
            specs: [
                "<strong>Drivetrain:</strong> 3-omniwheel base with custom motor mounts for DC motors",
                "<strong>Controls:</strong> MBot control system using Raspberry Pi 4B and Pico microcontroller",
            ],
            expandLabel: "View Technical Report",
            media: `
        <div class="pdf-container">
            <iframe src="/ROB311 Final Report  (1).pdf" loading="lazy" frameborder="0" allowfullscreen="" title="Technical Report PDF"></iframe>
        </div>
`
        },
        {
            id: "haunted-house",
            title: "The Ghost of Alice Lloyd",
            imageClass: "haunted-house",
            image: "/3.jpg",
            role: "Coordinator & Engineer",
            description: "In my role as an RA, I planned, engineered, and performed an incredibly low budget yet effective haunted house for over 200 residents. Utilizing creative engineering solutions, we told the haunting story of Alice Lloyd.",
            specHeading: "Technical Elements:",
            specs: [
                "Living picture frame effect",
                "Pepper's Ghost illusion",
                "Black light effects",
                "6 JBL speakers for immersive audio",
                "Coordinated with talented actors (RAs)",
            ],
            expandLabel: "Expand",
            media: `
        <div class="video-container">
            <iframe width="560" height="315" src="https://www.youtube.com/embed/6TcMWkqsZzQ?si=h1kiuG4MnZrfGnak" title="YouTube video player" loading="lazy" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        </div>
`
        },
        {
            id: "robot-in-3-days",
            title: "Robot in 3 Days",
            imageClass: "robot-3-days",
            image: "/IMG_0220.jpg",
            role: "Robotics Engineer",
            description: "Working with a team of 15 FIRST Robotics alumni, we designed, fabricated, programmed, and refined a working robot for the 2026 FRC game in just 3 days. We created documentation and used our design to mentor and advise local FIRST Robotics teams. I personally led the overall robot design process, managed integration between subsystems, and developed the climb system. What a rewarding project!",
            specHeading: "Technical Elements:",
            specs: [
                "Active intake controlled by rack and pinion mechanism",
                "Large hopper with agitator and indexing mechanism",
                "Dual-flywheel shooter design direct driven by two Kraken X60 Motors",
                "Telescoping tube with custom hooks for skinny climb abilities",
                "West Coast Products Swerve X2 modules for holonomic control",
            ],
            expandLabel: "Expand",
            media: `
        <div class="video-container">
            <iframe width="560" height="315" src="https://www.youtube.com/embed/YR4UWzacF_8?si=MCvuIg_eLknkgzdp" title="YouTube video player" loading="lazy" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
        </div>
`
        },
        {
            id: "first-robotics",
            title: "FIRST Robotics",
            imageClass: "first-robotics",
            image: "/img-7986_orig.jpg",
            role: "Alumni, Volunteer, Mentor, & Advocate",
            description: "FIRST Robotics changed my life. I joined FTC Team 8529 in 2018, and FRC Team 107 shortly thereafter. The mentorship and student experience molded me into the person and engineer I am today. I love to win, but FIRST Robotics taught me how much fun it is to help others win as well. I am still actively involved in FIRST programs and look to give back to the program that gave so much to me.",
            specHeading: "Highlights:",
            specs: [
                "FIRST in Michigan Leadership Award Winner, World Championship Finalist",
                "Global Lead Correspondent for FUN Robotics Network",
                "Educated and mentored over 70 Michigan rookie teams since 2023",
                "Volunteered as a First Technical Advisor Assistant at 5 events",
                "Advocated for increased support of FIRST at the University of Michigan",
            ],
            expandLabel: "Expand",
            media: `
        <div class="image-collage">
            <img src="/471615613_10161969345297432_554194538844078805_n.jpg" alt="FIRST Robotics" loading="lazy">
            <img src="/8e94b5dd-c7e8-4c7d-9d15-e8ab9e6ca8ac_orig.jpg" alt="FIRST Robotics" loading="lazy">
            <img src="/img-0867_orig.jpg" alt="FIRST Robotics" loading="lazy">
            <img src="/img-1006_orig.jpg" alt="FIRST Robotics" loading="lazy">
            <img src="/img-2341_orig.jpg" alt="FIRST Robotics" loading="lazy">
            <img src="/img-7941-2_orig.jpg" alt="FIRST Robotics" loading="lazy">
        </div>
`
        },
    ];

    /* The three corrected figures (over $3 million, 3rd of 15, 15+ clients)
       each appear exactly once, here in the Journey. Keep it that way. */
    var JOURNEY = [
        { title: "A Strategic Competitor", body: "Ask anyone who knows me; I am a competitive person. I gave every ounce I had to win 3rd-grade recess football, but just as much effort to outsmart my classmates at Math Pentathlon games. My desire to win and be the best version of myself has shaped me from a young age." },
        { title: "FIRST Robotics Team 107", body: "In 8th grade, I joined FIRST Robotics and was instantly hooked. In high school, I became captain of Team R.O.B.O.T.I.C.S., learning that \"FIRST Robotics isn't kids building robots; it is robots building kids.\" My late mentor Bob Bonczyk left a lasting legacy on my life, and showed me how to compete with true compassion. I miss you, Bob." },
        { title: "Soccer State Championship & Servant Leadership", body: "Through soccer, I learned how to lead when I wasn't an all-star. I played goalkeeper under one of the best keepers in Michigan, and I learned how to lead from every position. I developed scouting systems and data analysis strategies that pushed our team to the next level, all the way to the state championship my senior year. My coaches created the \"James Oosterhouse Maroon & White Award\" to honor my efforts, and I am forever grateful for this team." },
        { title: "Koops Automation Systems - Project Engineering", body: "I began my professional career as a Project Engineering Intern at Koops Automation in February of 2023. I applied all of my knowledge from FIRST to industrial automation, and learned mountains in return. From CMM studies to sensor repairs to programming Kawasaki robots, I grew as an engineer exponentially throughout this 7 month internship. In addition to my responsibilities, I took the initiative to propose further FIRST robotics projects in Koops interests. I began coordinating the Bot in the Lot Expo, starting out with just 4 teams this summer. In addition, my friends and I spent over 100 hours after work creating Koopa Troopa, an FRC robot we took to competitions to recruit for Koops." },
        { title: "University of Michigan - Freshmen Year", body: "Matriculating at the University of Michigan was a dream come true. I bleed maize and blue pride and have started my beloved tradition of convincing my friends to stand at the Big House gates at the crack of dawn to earn front row seats every gameday. Just as exciting as our national championship in Football, my robotics skills took flight as I dove into AI for autonomous navigation, engineering applications of linear algebra, microprocessors and toys, and so many other niche topics. I learn just as much from my classmates as I do lecture, thus I am so thankful for our collaborative environment here in Ann Arbor." },
        { title: "Koops Automation Systems - Controls Engineering", body: "Returning to Koops for a second summer, I had the pleasure of diving deeper into the world of control systems. I developed PLC logic, debugged Keyence camera systems, trained Fanuc robots, and fixed issues live at customer facilities all over the United States. I traveled away from Koops 42% of this internship, and it brought to life the combination of customer service and technical expertise I know now is so important. I continued to grow my Bot in the Lot Expo, this year reaching over 200 attendees and creating 2 new full-time hires! I also worked with my same friends to develop a T-shirt cannon robot (see featured projects)." },
        { title: "University of Michigan - Sophomore Year", body: "Although our football team took a step down, the Michigan difference was never more clear in my life. After experiencing a game-changing class called \"Coaching as Leading\", I officially declared my minor in Coaching & Leadership through the Marsal Family School of Education. I got the privilege to dive into one of my favorite topics, human-robot interaction, designing better systems for people. Meanwhile, I took a leadership role in my club, Michigan Engineering Consulting Group. As a founding member in my freshman year, I was now leading a team of 10 consultants helping real businesses solve engineering problems. I also stepped in to lead our club's finance team, growing my business acumen in addition to technical know-how." },
        { title: "Koops Automation Systems - Business Development & AI", body: "This third summer at Koops looked a bit different, in the best way possible. On our business development and applications engineering team, I got to test the waters in sales and customer acquisition, producing professional bid packages, conceptual designs, financial justifications, and ROI analysis. I personally secured over $3 million in new automation projects, ranked 3rd of 15 on the summer sales team. I also began to recognize inefficiencies in our process, so I pitched leadership on building a custom LLM workflow to speed up quoting, and then I built it. KoopsGPT runs LLM APIs and retrieval over our own company data to help with quoting, contract review, and risk analysis, and I managed the rollout through the school year. Around 40 employees use it now, and each of them saves 2+ hours a week, which adds up to roughly 4,000+ hours a year. Bot in the Lot was back and bigger than ever, attracting over 400 students, 3 new hires, and 15 local teams!" },
        { title: "SYZYGY.Services", body: "After my experience at Koops, I realized that my problem-solving skills and AI aptitude were marketable skills. Through conversations with my network, I began to consult various businesses on AI integration through auditing, prototyping, and implementation of human-in-the-loop AI systems. Today there are six of us, and we take a job from the first conversation about what is actually broken all the way through to something running in production. Every release gets scored with LLM-as-judge evaluation and trace analysis before a client ever sees it. We work with 15+ clients now, and they are seeing 30 to 40% efficiency gains across their teams. This entrepreneurial experience has helped me grow as an engineer, leader, and person, and we're not done yet." },
        { title: "University of Michigan - Junior Year", body: "As an upperclassman, it is finally time to dig deep into what makes robotics so unique. My first semester was highlighted by a full-stack robotics class, where I developed a BB-8 style ballbot (see featured project). I also got to take another Human-robot interaction class, and breadth classes like Marketing Management and Positively Leading Teams. This semester, I'm taking classes in marine robotics, wearable sensor technology, and robotics communication. I even got to build a Robot in 3 days with my FIRST alumni club (see featured project)! Finally, I also began my role as a Resident Advisor for Alice Lloyd Hall. I even got to flex my creative muscles and develop a haunted house for all of my residents, using every resource available to put on an immersive show (see feature project)." },
        { title: "NASA Jet Propulsion Laboratory", body: "The summer of 2026 took me to Pasadena as an ethnographic software engineering intern at NASA JPL. I embedded with Mars Science Laboratory downlink operations to study how expert and novice operators actually use Faro, a GenAI analysis tool, during Curiosity rover operations. To measure what people did rather than what they said, I built a gaze tracking tool on OpenFace 2.0 that maps where operators look on screen. The study proved a statistically significant mistrust of Faro among expert operators, and I delivered a 5-point recommendation plan to prepare the tool for mission-critical use. At the JPL hackathon, I solo-built TRIAGE, a root cause analysis dashboard for the Mars Sample Return helicopter that won the Mission Critical Award for the best JPL solution. JPL closed out the summer by giving me the NASA Shining Star Award, which still does not feel real. I came home thinking about trust a lot more than I think about models." },
        { title: "What's Next", body: "Throughout my journey, I've learned that I love to win. Even more so, I love to help others win. My ideal career uses my creative and technical skills to help others win, and have some fun along the way." },
        { title: "Where I'm From (Thanks, George Ella Lyon)", body: "While I look ahead to where I'm going, it is most important to remember where I'm from. I am so thankful for my family and friends, the people who have made an impact on my life. To the mentors who have shown me what it looks like to believe in myself: Thank you." },
    ];

    var NEWS = [
        { href: "https://marsal.umich.edu/our-impact/value-coaching-and-leadership-engineering", icon: "📰", title: "Marsal Family School of Education", blurb: "Value of Coaching and Leadership in Engineering", cta: "Read Article →" },
        { href: "https://www.youtube.com/watch?v=wCjJ5-mNigc", icon: "🎥", title: "ESPN Interview", blurb: "Watch my interview with ESPN3's Robotics Gameday broadcast", cta: "Watch Video →" },
        { href: "https://www.fox17online.com/news/morning-news/community-of-creation-robotics-team-members-gain-life-skills-and-friendship", icon: "📺", title: "FOX 17 West Michigan", blurb: "Community of Creation: Robotics team members gain life skills and friendship", cta: "Read Article →" },
    ];

    global.PortfolioContent = {
        PROFILE: PROFILE,
        ABOUT: ABOUT,
        AI_WORK: AI_WORK,
        ROBOTICS: ROBOTICS,
        JOURNEY: JOURNEY,
        NEWS: NEWS
    };
})(window);
