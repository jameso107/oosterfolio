# ooster.house

Personal portfolio of James Oosterhouse: AI engineer, founder, roboticist. Live at [ooster.house](https://ooster.house).

Plain HTML, CSS, and JavaScript. No framework and no build step, deployed on Vercel.

## What's here

| Route | Listed | What it is |
|---|---|---|
| `/` | yes | Landing page: the opening animation, the photo wall, a short highlights block, and the links |
| `/demo/triage` | yes | **TRIAGE: Flight Edition**, a live public rebuild of the TRIAGE concept |
| `/<company>` | **no** | A portfolio aimed at one company, for example `/nasa` |
| `/disney` | **no** | A hand-built page for Walt Disney Imagineering |

## Company pages

Each company page is the full portfolio (why this company, AI work with pop-out case studies, robotics builds, who I am, the journey timeline, press, contact) reordered and re-framed for one employer, on that employer's color scheme.

**They are unlisted, not secret.** Nothing on the site links to them, they are absent from `sitemap.xml`, and `company.html` carries `noindex, nofollow, noarchive`. The only way in is typing the URL or following a link James sent. Anyone who has the link can open it, so treat these as public if shared.

### Adding a company

1. Open `portfolio/companies.js`, copy the `TEMPLATE` block at the bottom of the file, and add it to `COMPANIES` under the slug you want in the URL.
2. Deploy. `/<slug>` already routes here, so no routing change is needed.

### When a company outgrows the template

Vercel checks the filesystem before it checks rewrites, so a `<slug>.html` at the repo root takes over `/<slug>` on its own and never reaches the `/:slug` rewrite. No routing change, and the config system keeps working for everyone else.

`/disney` does this. It is a hand-built Imagineering page with three things the shared template does not have:

- **A castle opening animation.** Two tall towers over a low middle, so the silhouette reads as a castle from the front and as an M between "JA" and "ES", the same joke the Block M plays on the landing page. Its own `sessionStorage` key, so it does not interfere with the main intro.
- **A playable show control cue sheet** for The Ghost of Alice Lloyd: 19 cues against a hall plan that responds as the show runs. Marked as a reconstruction, the same honesty rule the TRIAGE demo follows.
- **An interactive Pepper's Ghost diagram**, with the glass at a true 45 degrees so the optics in the drawing actually work.

Copy still comes from `portfolio/content.js`, so the case studies, projects, and timeline are not duplicated. `disney.js` builds its project modals with its own `openShowcase(id)` rather than `script.js`'s DOM-scraping `openProjectModal`, which frees the cards to look however they like.

### How it fits together

```
vercel.json         rewrites /:slug -> /company (after the filesystem, so
                    /demo/triage and every asset still win). The destination
                    is the clean URL, not /company.html: under cleanUrls the
                    .html path only matches the redirect phase, so a rewrite
                    pointed at it resolves to nothing and falls through to 404.
company.html        the shell: noindex tags, stylesheets, #app, script order
portfolio/
  content.js        every reusable block of copy: PROFILE, ABOUT, AI_WORK
                    (with the case study bodies), ROBOTICS, JOURNEY, NEWS
  companies.js      one config per company: theme, hero, why-us cards, and
                    which content blocks to show in what order
  render.js         reads the slug from the URL, applies the theme, and writes
                    the page synchronously before script.js wires up behavior
  portfolio.css     the few components that only exist on a company page
disney.html         hand-built Imagineering page, see above. Wins /disney
                    from the filesystem, so the rewrite never sees it
  portfolio/disney.js, disney.css   its animation, sections, and interactives
index.html          the landing page, deliberately static so it renders with
                    JavaScript off and stays crawlable
styles.css          shared base. Colors go through theme slots (--maize,
                    --blue, --accent-rgb, ...) so a company theme re-skins
                    the whole site by overriding nine custom properties
```

An unknown slug renders a 404 view instead of a company page. Because it is served through a rewrite it returns HTTP 200, so a mistyped link looks like a 404 to a person but not to a crawler. The `noindex` tag covers the crawler case.

Two standing copy rules when editing `content.js` or `companies.js`: no em dashes in anything that renders, and only facts that are already true elsewhere on this site.

## TRIAGE: Flight Edition (the demo)

The internal TRIAGE was built at the JPL hackathon to disposition Mars Sample Return helicopter anomalies. It stays at JPL, so `/demo/triage` rebuilds the concept in public, on public data. It is not affiliated with or endorsed by NASA or JPL.

**The problem.** Flight test data is repeatable but dense. Engineers burn time separating expected variance from something actually wrong, and a wrong call in either direction is expensive.

**The data.** The public Ingenuity (Mars 2020 helicopter) flight log: all 72 flights with per-flight duration, max altitude, distance, max groundspeed, and mission notes, compiled from NASA status reports via Wikipedia's List of Ingenuity flights. Bundled as a static file (`demo/flights-data.js`), so the demo needs zero API calls to work.

**The experience.** One flight, told end to end: Flight 6 (sol 91), the first in-flight anomaly on another planet. A 3D replay over the real Jezero Crater landscape (USGS Mars 2020 CTX DEM and orthomosaic, public domain, a 10 km window centered on Octavia E. Butler Landing, with real landmarks like Kodiak butte and the western delta), rendered with a hand-rolled canvas projection, zero dependencies, with a procedural fallback if the terrain assets fail. Playback runs 0.25x to 4x with a scrubber, a slow cinematic orbit, and drag-to-orbit with momentum. Synchronized strip charts (altitude, groundspeed, pitch excursion) carry fleet-envelope and alert lines. The flight path and channel curves are reconstructed from the recorded summary: deterministic, anchored to the recorded numbers, dramatized where the record describes the event (the T+54s navigation glitch and the up-to-20-degree tilting), and always labeled with a RECONSTRUCTED badge, the same honesty rule the original flight deck used. The NAVIGATION ANOMALY alarm comes on at T+54s and stays on through touchdown.

Terrain credit: NASA/JPL-Caltech/USGS. The heightmap is elevation packed 16-bit (R*256+G) over a 10 km window, decoded in the browser exactly the way the original flight deck's baked assets are. The helicopter is NASA/JPL-Caltech's public-domain Ingenuity model (the same Draco glTF the original bundles), decoded and decimated offline to about 5,900 triangles, rendered with painter-sorted flat shading, scaled to the original's 18 m visibility span, with the two coaxial rotor assemblies counter-rotating at its calm 1.2 rad/s. The replay opens on a low hero shot of the craft on the pad with the western delta behind it.

**The architecture.**

```
flights-data.js (72 public flights, fleet envelope statistics)
        |
deterministic layer (client-side, demo/triage.js)
  median + MAD robust z-scores per metric, |z| >= 2.5 flags,
  plus event flags mined from the record notes
        |
flight reconstruction (client-side, seeded, Flight 6)
  3D replay over the real Jezero terrain (USGS Mars 2020 CTX DEM)
  + synchronized strip charts, labeled RECONSTRUCTED FROM SUMMARY DATA
        |
narrative layer (example GenAI narratives)
  cached by default: pre-computed outputs for every flight
  live option:  POST /api/narrative -> Vercel function -> Anthropic API
                (strict JSON schema out; the key never reaches the browser)
        |
human-in-the-loop review
  accept / edit / reject, every disposition recorded locally
        |
evals (collapsed section)
  22-case golden set, exact match on category, LLM-as-judge scores,
  per-case traces (inputs, flags, prompt, output, reference, verdict)
```

The design rule carried over from the original: numbers are computed, never generated. The deterministic layer owns every statistic; the language model only narrates, and a human makes the call.

**Cost and reliability guardrails.** Cached mode is the default and works offline from the API at zero marginal cost. Live mode is rate-limited to 10 calls per IP per hour with a small token cap and a global daily ceiling; any failure falls back to the cached narrative, so the page never strands a visitor on an error.

## Evaluation methodology

The golden set (`demo/golden-set.js`) is 22 labeled cases drawn from the public flight record. Each case pins an expected anomaly category (out of six: nominal, planned-deviation, operational-incident, navigation-anomaly, communications-loss, early-termination) and a reference narrative.

Two scores, both computed live in the Evals tab from the shipped data files:

1. **Exact match on anomaly category** against the golden label.
2. **LLM-as-judge** (Claude, cached run): each narrative scored 1 to 5 for category correctness, grounding in the record, and calibration of confidence, with a written rationale per case.

Every case has a full trace: inputs, deterministic flags, the exact system and user prompts, the model output, the reference narrative, and the judge verdict, so a failure can be traced back through the pipeline to its root cause.

### Results (cached run)

| Measure | Result |
|---|---|
| Golden set size | 22 cases across all 6 categories |
| Category exact match | 22/22 |
| Mean judge score | 4.86 / 5 |
| Cases passing the judge bar (4+) | 22/22 |

A note on the perfect match rate: that is the deterministic-first design doing its job, not the model being clever. Categories follow tightly from computed flags plus record notes, so the judge score on narrative quality is where the discriminating signal lives (the three 4/5 cases are the ones with sparse or ambiguous public records: flights 22, 50, and 71).

## Running locally

Static site, no build step:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`. Two routing behaviors come from `vercel.json` and are absent from a plain static server: clean URLs (`/demo/triage` instead of `/demo/triage.html`) and the `/:slug` rewrite that serves company pages. To preview a company page without that rewrite, open `company.html` with the slug as a query parameter:

```bash
open "http://localhost:8000/company.html?company=disney"
```

For the real routing, run `vercel dev` instead.

The live narrative endpoint (`api/narrative.js`) runs as a Vercel serverless function and needs `ANTHROPIC_API_KEY` set in the Vercel project. Without it the endpoint returns 503 and the demo keeps working in cached mode; unplugging the key is a supported state, not an outage.

## Stack

Plain HTML/CSS/JS, one Vercel serverless function, `@anthropic-ai/sdk`, and zero client-side dependencies. Company pages are rendered client-side from plain scripts, no bundler. The demo chart is hand-rolled SVG.
