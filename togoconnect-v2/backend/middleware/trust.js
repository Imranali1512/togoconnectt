const db = require('../db/database');

// ── Abusive words — simple includes check (works in any language) ──
const ABUSIVE_WORDS = [
  // English
  'fuck','fucking','fucker','fuk','fck','f*ck',
  'shit','sh*t','shitt','bullshit',
  'bitch','b*tch','biatch',
  'asshole','ass hole','a**hole',
  'bastard','cunt','dick','pussy','cock','piss','crap',
  'whore','slut','nigger','faggot',
  'idiot','moron','stupid','dumbass','retard','loser','jerk',
  'kill you','kill him','kill her','gonna kill','want to kill',
  'murder','rape','terrorist','bomb threat',
  'scam','fraud','cheat','spam',
  // Urdu/Roman Urdu — common abusive
  'harami','haraami','haramy',
  'kutta','kutti','kutia','kutiya',
  'kamina','kameena','kaminay',
  'gandu','gaandu','gandu',
  'madarchod','maa ki','maaki','maadar',
  'bhenchod','bhen chod','bc ','bsdk',
  'chutiya','chootia','chutia',
  'sala ','saala','saalay',
  'randi','randii',
  'lund','lauda',
  'mc ','m.c.','b.c.',
  'bakwas','ullu','bevakoof','pagal',
  // French
  'merde','putain','connard','salope','enculé',
  'imbécile','crétin','nique ta',
  'batard','pute','fils de pute',
  // Togo/Local French
  'con de','va te faire',
];

function detectPatterns(text) {
  const t = text.toLowerCase();
  // Detect letter repetition tricks: fuuuck, shhit, etc.
  return /f[u*@]+c?k/i.test(t) ||
         /s[h*]+[i!1]+t/i.test(t) ||
         /b[i!1]+t[c]+h/i.test(t) ||
         /ch[u]+t[i]+[ya]+/i.test(t) ||
         /har[a]+m[i]+/i.test(t) ||
         /[gG][aA][nN][dD][uU]/i.test(t) ||
         /m[a]+[d]+[a]+r/i.test(t) ||
         /bh[e]+n[c]+h[o]+d/i.test(t);
}

const VIOLATION_POINTS = {
  abusive_message:   -10,
  abusive_listing:   -20,
  spam_listing:      -10,
  reported_by_user:  -5,
  admin_warning:     -15,
};

const RESTORE_POINTS = {
  good_review:       +2,
  completed_chat:    +1,
};

// Check text for abusive content — simple reliable includes
function detectAbuse(text) {
  if (!text) return { abusive: false, words: [] };
  const lower = text.toLowerCase().trim();

  const found = ABUSIVE_WORDS.filter(w => lower.includes(w.toLowerCase()));
  const hasPattern = detectPatterns(text);

  return { abusive: found.length > 0 || hasPattern, words: found };
}

// Deduct points from user
function deductPoints(userId, eventType, description, points) {
  const user = db.prepare('SELECT trust_score, restricted FROM users WHERE id = ?').get(userId);
  if (!user) return;

  const newScore = Math.max(0, (user.trust_score || 100) + points); // points is negative
  const restricted = newScore <= 0 ? 1 : 0;

  db.prepare('UPDATE users SET trust_score = ?, restricted = ? WHERE id = ?')
    .run(newScore, restricted, userId);
  db.prepare('INSERT INTO trust_events (user_id, event_type, description, points) VALUES (?, ?, ?, ?)')
    .run(userId, eventType, description, points);

  return { newScore, restricted };
}

// Add points (reward good behavior)
function addPoints(userId, eventType, description, points) {
  const user = db.prepare('SELECT trust_score FROM users WHERE id = ?').get(userId);
  if (!user) return;
  const newScore = Math.min(100, (user.trust_score || 100) + points);
  db.prepare('UPDATE users SET trust_score = ? WHERE id = ?').run(newScore, userId);
  db.prepare('INSERT INTO trust_events (user_id, event_type, description, points) VALUES (?, ?, ?, ?)')
    .run(userId, eventType, description, points);
  return { newScore };
}

// Middleware: block restricted users from actions
function blockRestricted(req, res, next) {
  if (req.user && req.user.restricted) {
    return res.status(403).json({
      message: 'Your account has been restricted due to violations of our community guidelines. You cannot perform this action.',
      restricted: true,
      trust_score: req.user.trust_score || 0,
    });
  }
  next();
}

module.exports = { detectAbuse, deductPoints, addPoints, blockRestricted, VIOLATION_POINTS };
