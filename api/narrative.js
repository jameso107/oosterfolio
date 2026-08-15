// TRIAGE: Flight Edition. Live narrative endpoint (Vercel serverless function).
// The Anthropic API key lives server-side only. Without a key the endpoint returns 503
// and the demo keeps working in cached mode; the page never shows a dead spinner.
const Anthropic = require('@anthropic-ai/sdk');

const MODEL = process.env.TRIAGE_MODEL || 'claude-opus-5';
const RATE_LIMIT = 10;              // live calls per IP per hour
const RATE_WINDOW_MS = 60 * 60 * 1000;
const DAILY_CAP = 200;              // global ceiling per serverless instance per day
const rateByIp = new Map();
let dailyCount = 0;
let dailyStamp = '';

const CATEGORIES = [
  'nominal',
  'planned-deviation',
  'operational-incident',
  'navigation-anomaly',
  'communications-loss',
  'early-termination',
];

const SYSTEM_PROMPT = [
  'You are the narrative layer of TRIAGE: Flight Edition, a public demo of a root cause',
  'analysis pattern for Mars helicopter flight data. A deterministic layer has already',
  'computed fleet statistics and flags; your job is to turn those flags into a short,',
  'plain-language root cause narrative a reviewing engineer can accept, edit, or reject.',
  'Rules: never compute, re-derive, or invent numbers; repeat provided numbers verbatim',
  'or describe them qualitatively. Ground every claim in the provided flags and record',
  'notes. Choose exactly one category from: ' + CATEGORIES.join(', ') + '.',
  'Set confidence to low, medium, or high based on how completely the record explains',
  'the flags. Keep the narrative to 2 to 4 sentences. Do not use em dashes.',
].join(' ');

function clampString(value, max) {
  if (typeof value !== 'string') return '';
  return value.slice(0, max);
}

function clampNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only.' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({
      error: 'Live mode is not configured on this deployment. Cached mode keeps working.',
    });
  }

  const today = new Date().toISOString().slice(0, 10);
  if (today !== dailyStamp) {
    dailyStamp = today;
    dailyCount = 0;
  }
  if (dailyCount >= DAILY_CAP) {
    return res.status(429).json({
      error: 'The live demo hit its daily budget. Cached mode keeps working.',
    });
  }

  const ip =
    (String(req.headers['x-forwarded-for'] || '').split(',')[0] || '').trim() ||
    (req.socket && req.socket.remoteAddress) ||
    'unknown';
  const now = Date.now();
  const hits = (rateByIp.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (hits.length >= RATE_LIMIT) {
    return res.status(429).json({
      error: 'Rate limit reached: 10 live calls per hour. Cached mode keeps working.',
    });
  }
  hits.push(now);
  rateByIp.set(ip, hits);

  const body = req.body || {};
  const flight = Math.max(1, Math.min(72, Math.round(clampNumber(body.flight))));
  const metrics = Array.isArray(body.metrics) ? body.metrics.slice(0, 6) : [];
  const flags = Array.isArray(body.flags) ? body.flags.slice(0, 8) : [];
  const metricLines = metrics
    .map((m) => {
      const label = clampString(m.label, 40);
      const value = clampNumber(m.value);
      const unit = clampString(m.unit, 8);
      const z = clampNumber(m.z);
      return label + ': ' + value + ' ' + unit + ' (robust z = ' + z.toFixed(2) + ')';
    })
    .join('\n');
  const flagLines = flags.map((f) => '- ' + clampString(f, 160)).join('\n') || '- none';
  const summary = clampString(body.summary, 400);
  const note = clampString(body.note, 320);

  const userPrompt = [
    'Flight ' + flight + ' (' + clampString(body.date, 40) + ', Sol ' + clampNumber(body.sol) + ').',
    '',
    'Metrics vs fleet envelope (median and MAD over all 72 flights, flag threshold |z| >= 2.5):',
    metricLines,
    '',
    'Deterministic flags:',
    flagLines,
    '',
    'Public record notes: ' + (summary || 'none'),
    note ? 'Pre-flight events: ' + note : '',
    '',
    'Write the root cause narrative.',
  ]
    .filter((line) => line !== '')
    .join('\n');

  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1500,
      output_config: {
        effort: 'low',
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              category: { type: 'string', enum: CATEGORIES },
              confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
              narrative: { type: 'string' },
            },
            required: ['category', 'confidence', 'narrative'],
            additionalProperties: false,
          },
        },
      },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

    if (response.stop_reason === 'refusal') {
      return res.status(502).json({
        error: 'The model declined this request. Cached mode keeps working.',
      });
    }
    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock) {
      return res.status(502).json({
        error: 'The model returned no text. Cached mode keeps working.',
      });
    }
    dailyCount += 1;
    const parsed = JSON.parse(textBlock.text);
    return res.status(200).json({
      category: parsed.category,
      confidence: parsed.confidence,
      narrative: clampString(parsed.narrative, 1200),
      model: MODEL,
    });
  } catch (err) {
    const status = err && err.status ? err.status : 500;
    return res.status(status === 429 ? 429 : 502).json({
      error: 'The live call failed. Cached mode keeps working.',
    });
  }
};
