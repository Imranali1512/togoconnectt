const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { protect } = require('../middleware/auth');

// GET /api/trust/my — get my trust score and events
router.get('/my', protect, (req, res) => {
  try {
    const user = db.prepare('SELECT trust_score, restricted, restricted_until, restrict_count FROM users WHERE id = ?').get(req.user.id);
    const events = db.prepare(
      'SELECT * FROM trust_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 20'
    ).all(req.user.id);
    res.json({
      trust_score: user.trust_score ?? 100,
      restricted: !!user.restricted,
      restricted_until: user.restricted_until || null,
      restrict_count: user.restrict_count || 0,
      events,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
