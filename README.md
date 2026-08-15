# ooster.house

Personal portfolio of James Oosterhouse: AI engineer, founder, roboticist. Live at [ooster.house](https://ooster.house).

The site is a static single page (plain HTML, CSS, and JavaScript, no framework) with pre-rendered case study pages and one interactive demo, deployed on Vercel.

## What's here

| Route | What it is |
|---|---|
| `/` | Home: AI work, robotics builds, journey timeline |
| `/work/triage` | Case study: root cause analysis for a Mars helicopter (JPL hackathon, Mission Critical Award) |
| `/work/specinator` | Case study: AI decision support for an engineering BD team |
| `/work/koopsgpt` | Case study: an agentic LLM suite in production at a manufacturer |
| `/work/jpl-research` | Research: how Mars operators trust GenAI (NASA JPL ethnographic study) |
| `/demo/triage` | **TRIAGE: Flight Edition**, a live public rebuild of the TRIAGE concept |

## TRIAGE: Flight Edition (the demo)

The internal TRIAGE was built at the JPL hackathon to disposition Mars Sample Return helicopter anomalies. It stays at JPL, so `/demo/triage` rebuilds the concept in public, on public data. It is not affiliated with or endorsed by NASA or JPL.

**The problem.** Flight test data is repeatable but dense. Engineers burn time separating expected variance from something actually wrong, and a wrong call in either direction is expensive.

**The data.** The public Ingenuity (Mars 2020 helicopter) flight log: all 72 flights with per-flight duration, max altitude, distance, max groundspeed, and mission notes, compiled from NASA status reports via Wikipedia's List of Ingenuity flights. Bundled as a static file (`demo/flights-data.js`), so the demo needs zero API calls to work.

**The experience.** A 3D replay of any of the 72 flights over procedural Mars-style terrain (hand-rolled canvas projection, zero dependencies), with playback at 0.25x to 4x, a scrubber, drag-to-orbit with momentum, and synchronized strip charts (altitude, groundspeed, distance) with fleet-envelope reference lines. Flight paths and channel curves are reconstructed from the recorded summaries: deterministic (seeded per flight), anchored to the recorded numbers, and always labeled with a RECONSTRUCTED badge, the same honesty rule the original flight deck used. Alarm banners (LINK LOST, EARLY TERMINATION, ENVELOPE EXCEEDANCE) fire from the deterministic flags during replay.

**The architecture.**

```
flights-data.js (72 public flights)
        |
deterministic layer (client-side, demo/triage.js)
  median + MAD robust z-scores per metric, |z| >= 2.5 flags,
  plus event flags mined from the record notes
        |
flight reconstruction (client-side, seeded per flight)
  3D replay over procedural terrain + synchronized strip charts,
  labeled RECONSTRUCTED FROM SUMMARY DATA
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

Then open `http://localhost:8000`. Clean URLs (`/work/triage` instead of `/work/triage.html`) are handled by Vercel's `cleanUrls` in production.

The live narrative endpoint (`api/narrative.js`) runs as a Vercel serverless function and needs `ANTHROPIC_API_KEY` set in the Vercel project. Without it the endpoint returns 503 and the demo keeps working in cached mode; unplugging the key is a supported state, not an outage.

## Stack

Plain HTML/CSS/JS, one Vercel serverless function, `@anthropic-ai/sdk`, and zero client-side dependencies. The demo chart is hand-rolled SVG.
