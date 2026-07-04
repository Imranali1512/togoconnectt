const jwt = require('jsonwebtoken');
const db = require('../db/database');

const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = db.prepare('SELECT id, name, email, role, plan, plan_expires_at, city, bio, avatar, phone, trust_score, restricted, restricted_until, restrict_count FROM users WHERE id = ?').get(decoded.id);
      if (!user) return res.status(401).json({ message: 'User not found' });

      // Auto-lift suspension if restricted_until has passed
      if (user.restricted && user.restricted_until) {
        const now = new Date();
        const until = new Date(user.restricted_until);
        if (now > until) {
          db.prepare("UPDATE users SET restricted=0, trust_score=30, restricted_until=NULL WHERE id=?").run(user.id);
          db.prepare("INSERT INTO trust_events (user_id,event_type,description,points) VALUES (?,?,?,?)").run(user.id,'auto_restore','Suspension period ended — account auto-restored',0);
          db.prepare("UPDATE listings SET active=1 WHERE seller_id=?").run(user.id);
          user.restricted = 0;
          user.restricted_until = null;
        }
      }

      // Check plan expiry — only if plan_expires_at is explicitly set
      if (user.plan !== 'none' && user.plan_expires_at) {
        const now = new Date();
        const expires = new Date(user.plan_expires_at);
        if (now > expires) {
          db.prepare("UPDATE users SET plan = 'none', plan_expires_at = NULL WHERE id = ?").run(user.id);
          db.prepare("UPDATE billing SET status = 'expired' WHERE user_id = ? AND status = 'active'").run(user.id);
          db.prepare("UPDATE listings SET active = 0 WHERE seller_id = ?").run(user.id);
          user.plan = 'none';
          user.plan_expires_at = null;
        }
      }
      // If plan is set but no expiry date — keep plan active (valid purchase)

      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };
