const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { protect } = require('../middleware/auth');
const { blockRestricted } = require('../middleware/trust');

// ── Central expiry check function — reused everywhere ──
function checkAndExpireUser(userId) {
  const user = db.prepare('SELECT id, plan, plan_expires_at FROM users WHERE id = ?').get(userId);
  if (!user || user.plan === 'none' || !user.plan_expires_at) return false;

  const now = new Date();
  const expires = new Date(user.plan_expires_at);

  if (now > expires) {
    db.prepare("UPDATE users SET plan = 'none', plan_expires_at = NULL WHERE id = ?").run(userId);
    db.prepare("UPDATE billing SET status = 'expired' WHERE user_id = ? AND status = 'active'").run(userId);
    db.prepare("UPDATE listings SET active = 0 WHERE seller_id = ?").run(userId);
    return true; // expired
  }
  return false; // still active
}

// ── Run expiry check for ALL users (called on server start + every hour) ──
function runGlobalExpiryCheck() {
  const users = db.prepare("SELECT id FROM users WHERE plan != 'none' AND plan_expires_at IS NOT NULL").all();
  let expired = 0;
  users.forEach(u => { if (checkAndExpireUser(u.id)) expired++; });
  if (expired > 0) console.log(`[Billing] ${expired} plan(s) expired and listings hidden.`);
}

// Run on startup
runGlobalExpiryCheck();
// Run every hour
setInterval(runGlobalExpiryCheck, 60 * 60 * 1000);

// Export for use in middleware
module.exports.checkAndExpireUser = checkAndExpireUser;

// GET /api/billing/status
router.get('/status', protect, (req, res) => {
  try {
    // Always check expiry first
    const justExpired = checkAndExpireUser(req.user.id);
    if (justExpired) {
      return res.json({ plan: 'none', expired: true, days_left: 0, message: 'Your plan has expired. Your listings have been hidden.' });
    }

    const user = db.prepare('SELECT id, plan, plan_expires_at FROM users WHERE id = ?').get(req.user.id);
    const active = db.prepare("SELECT * FROM billing WHERE user_id = ? AND status = 'active' ORDER BY expires_at DESC LIMIT 1").get(req.user.id);

    if (user.plan_expires_at) {
      const now = new Date();
      const expires = new Date(user.plan_expires_at);
      const daysLeft = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));
      return res.json({
        plan: user.plan,
        expires_at: user.plan_expires_at,
        days_left: daysLeft,
        active_billing: active,
        warning: daysLeft <= 5,
        expired: false,
      });
    }

    res.json({ plan: user.plan, expires_at: null, days_left: null, active_billing: active, expired: false });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/billing — billing history
router.get('/', protect, (req, res) => {
  try {
    const records = db.prepare('SELECT * FROM billing WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/billing/purchase
router.post('/purchase', protect, blockRestricted, (req, res) => {
  try {
    const { plan, period, amount } = req.body;
    const valid = ['basic', 'standard', 'premium'];
    if (!valid.includes(plan)) return res.status(400).json({ message: 'Invalid plan' });

    const now = new Date();
    const expires = new Date(now);
    if (period === 'yearly') {
      expires.setFullYear(expires.getFullYear() + 1);
    } else {
      expires.setMonth(expires.getMonth() + 1);
    }

    const startedAt = now.toISOString().slice(0, 19).replace('T', ' ');
    const expiresAt = expires.toISOString().slice(0, 19).replace('T', ' ');

    // Cancel previous active billing
    db.prepare("UPDATE billing SET status = 'cancelled' WHERE user_id = ? AND status = 'active'").run(req.user.id);

    // New billing record
    db.prepare(
      'INSERT INTO billing (user_id, plan, amount, period, started_at, expires_at, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(req.user.id, plan, amount, period, startedAt, expiresAt, 'active');

    // Update user
    db.prepare('UPDATE users SET plan = ?, plan_expires_at = ? WHERE id = ?').run(plan, expiresAt, req.user.id);

    // Re-activate all hidden listings (if user renews after expiry)
    db.prepare('UPDATE listings SET active = 1 WHERE seller_id = ?').run(req.user.id);

    const updatedUser = db.prepare('SELECT id, name, email, role, plan, plan_expires_at, city, bio, avatar, phone FROM users WHERE id = ?').get(req.user.id);
    res.json({ ...updatedUser, message: 'Plan activated successfully', expires_at: expiresAt });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
module.exports.checkAndExpireUser = checkAndExpireUser;
module.exports.runGlobalExpiryCheck = runGlobalExpiryCheck;
