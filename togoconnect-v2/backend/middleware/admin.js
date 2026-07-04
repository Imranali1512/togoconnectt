const db = require('../db/database');

const adminOnly = (req, res, next) => {
  const user = db.prepare('SELECT role_admin FROM users WHERE id = ?').get(req.user.id);
  if (!user || !user.role_admin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = { adminOnly };
