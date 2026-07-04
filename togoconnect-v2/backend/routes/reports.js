const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { protect } = require('../middleware/auth');
const https = require('https');

// ── Groq AI Analysis ──
async function analyzeReport(reason, listingTitle, reportCount) {
  const defaultResult = { verdict: 'suspicious', confidence: 50, severity: 'low', reasoning: 'AI unavailable' };
  if (!process.env.GROQ_API_KEY) return defaultResult;

  const prompt = `You are a content moderation AI for TogoConnect marketplace.

Report submitted by user:
- Report reason: "${reason}"
${listingTitle ? `- About listing: "${listingTitle}"` : ''}
- User being reported has ${reportCount} total reports

Your task: Decide if this report is worth acting on.

Guidelines:
- "Fake or misleading listing": suspicious unless reason explains exactly what is fake
- "Wrong price": suspicious unless there is clear evidence described
- "Spam/duplicate": suspicious — hard to verify
- "Illegal service": suspicious unless service name clearly illegal
- "Scam/fraud": valid only if specific fraud behavior is described
- "Harassment/abuse": valid if specific behavior described
- Short vague reasons = suspicious or fake
- Do NOT flag listing content as "abusive" just because someone reports it

Verdict rules:
- valid: clear evidence of real harm described in reason
- suspicious: unclear, vague, or unverifiable — needs human review  
- fake: obviously false, vendetta, or nonsensical

Respond ONLY with JSON (no other text):
{"verdict":"suspicious","confidence":55,"severity":"low","reasoning":"Reason is vague with no specific evidence"}`;

  return new Promise((resolve) => {
    const body = JSON.stringify({
      model: 'llama-3.1-8b-instant',
      max_tokens: 200,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }]
    });

    const req = https.request({
      hostname: 'api.groq.com',
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const text = JSON.parse(data).choices?.[0]?.message?.content || '';
          const match = text.match(/\{[^}]+\}/);
          if (match) {
            const parsed = JSON.parse(match[0]);
            resolve(parsed);
          } else resolve(defaultResult);
        } catch { resolve(defaultResult); }
      });
    });
    req.on('error', () => resolve(defaultResult));
    req.setTimeout(10000, () => { req.destroy(); resolve(defaultResult); });
    req.write(body); req.end();
  });
}

// ── Apply action based on AI verdict ──
function applyAIAction(reportedUserId, ai, reportCount) {
  const user = db.prepare('SELECT trust_score, restricted FROM users WHERE id=?').get(reportedUserId);
  if (!user || user.restricted) return { action: 'already_restricted', pts: 0 };

  let action = 'flagged';
  let pts = 0;

  if (ai.verdict === 'valid' && ai.confidence >= 85 && ai.severity === 'high') {
    action = 'warned'; pts = -20;
  } else if (ai.verdict === 'valid' && ai.confidence >= 70) {
    action = 'warned'; pts = -10;
  } else if (ai.verdict === 'valid' && ai.confidence >= 50) {
    action = 'flagged'; pts = -5;
  } else if (ai.verdict === 'suspicious') {
    action = 'flagged'; pts = 0;
  }
  // fake — no action on reported user

  // Count escalation (on top of AI)
  if (reportCount >= 6) { action = 'restricted'; pts = -100; }
  else if (reportCount >= 5 && action === 'flagged') { action = 'warned'; pts = Math.min(pts || -10, -10); }

  if (pts !== 0) {
    const newScore = Math.max(0, (user.trust_score || 100) + pts);
    const nowRestricted = action === 'restricted' || newScore <= 0 ? 1 : 0;
    db.prepare('UPDATE users SET trust_score=?, restricted=? WHERE id=?').run(newScore, nowRestricted, reportedUserId);
    db.prepare("INSERT INTO trust_events (user_id,event_type,description,points) VALUES (?,?,?,?)")
      .run(reportedUserId, 'auto_report_action', `AI ${ai.verdict} ${ai.confidence}%: ${ai.reasoning}`, pts);
    if (nowRestricted) db.prepare("UPDATE listings SET active=0 WHERE seller_id=?").run(reportedUserId);
  } else if (action === 'restricted') {
    db.prepare("UPDATE users SET restricted=1, trust_score=0 WHERE id=?").run(reportedUserId);
    db.prepare("UPDATE listings SET active=0 WHERE seller_id=?").run(reportedUserId);
    db.prepare("INSERT INTO trust_events (user_id,event_type,description,points) VALUES (?,?,?,?)")
      .run(reportedUserId, 'auto_restrict', `Auto-restricted at ${reportCount} reports`, -100);
  }

  return { action, pts };
}

// POST /api/reports
router.post('/', protect, async (req, res) => {
  try {
    const { reported_user_id, reported_listing_id, reason } = req.body;
    if (!reason?.trim()) return res.status(400).json({ message: 'Reason is required' });
    if (!reported_user_id && !reported_listing_id) return res.status(400).json({ message: 'Must report a user or listing' });
    if (reported_user_id && parseInt(reported_user_id) === req.user.id) return res.status(400).json({ message: 'Cannot report yourself' });

    // Per-listing duplicate check
    const existing = reported_listing_id
      ? db.prepare("SELECT id FROM reports WHERE reporter_id=? AND reported_listing_id=? AND created_at > datetime('now','-1 day')").get(req.user.id, reported_listing_id)
      : db.prepare("SELECT id FROM reports WHERE reporter_id=? AND reported_user_id=? AND reported_listing_id IS NULL AND created_at > datetime('now','-1 day')").get(req.user.id, reported_user_id || null);
    if (existing) return res.status(400).json({ message: 'You already reported this recently.' });

    const listing = reported_listing_id ? db.prepare('SELECT title FROM listings WHERE id=?').get(reported_listing_id) : null;
    const reportCount = reported_user_id
      ? db.prepare("SELECT COUNT(*) as c FROM reports WHERE reported_user_id=? AND status!='dismissed'").get(reported_user_id).c + 1
      : 0;

    // AI analysis
    const ai = await analyzeReport(reason, listing?.title || '', reportCount);

    // Reject fake reports
    if (ai.verdict === 'fake' && ai.confidence >= 80) {
      const reporter = db.prepare('SELECT trust_score FROM users WHERE id=?').get(req.user.id);
      const newScore = Math.max(0, (reporter.trust_score || 100) - 5);
      db.prepare('UPDATE users SET trust_score=? WHERE id=?').run(newScore, req.user.id);
      db.prepare("INSERT INTO trust_events (user_id,event_type,description,points) VALUES (?,?,?,?)").run(req.user.id, 'false_report', 'Submitted false report', -5);
      return res.status(400).json({ message: 'Your report appears to be invalid. False reports affect your trust score.' });
    }

    // Apply auto action
    const autoResult = reported_user_id ? applyAIAction(parseInt(reported_user_id), ai, reportCount) : { action: 'flagged', pts: 0 };

    const aiNote = `AI: ${ai.verdict} (${ai.confidence}%) — ${ai.reasoning}`;
    const autoNote = `Auto: ${autoResult.action}${autoResult.pts ? ` (${autoResult.pts} pts)` : ''}`;
    const status = autoResult.action === 'warned' || autoResult.action === 'restricted' ? 'auto_actioned' : 'pending';

    db.prepare('INSERT INTO reports (reporter_id, reported_user_id, reported_listing_id, reason, status, admin_note) VALUES (?,?,?,?,?,?)')
      .run(req.user.id, reported_user_id || null, reported_listing_id || null, reason, status, `${aiNote} | ${autoNote}`);

    const msgs = {
      restricted: 'Report submitted. Account has been automatically restricted.',
      warned: 'Report submitted. A warning has been issued automatically.',
      flagged: 'Report submitted. Our team will review it.',
    };
    res.status(201).json({ message: msgs[autoResult.action] || 'Report submitted.', auto_action: autoResult.action, ai_verdict: ai.verdict });
  } catch(err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
