const express = require('express');
const router = express.Router();
const db = require('../db/database');
const bcrypt = require('bcryptjs');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const { deductPoints, addPoints } = require('../middleware/trust');

router.use(protect, adminOnly);

// ── STATS ──
router.get('/stats', (req, res) => {
  try {
    const totalUsers     = db.prepare("SELECT COUNT(*) as c FROM users WHERE role_admin=0").get().c;
    const restricted     = db.prepare("SELECT COUNT(*) as c FROM users WHERE restricted=1").get().c;
    const totalListings  = db.prepare("SELECT COUNT(*) as c FROM listings").get().c;
    const activeListings = db.prepare("SELECT COUNT(*) as c FROM listings WHERE active=1").get().c;
    const pendingReports = db.prepare("SELECT COUNT(*) as c FROM reports WHERE status='pending'").get().c;
    const totalMessages  = db.prepare("SELECT COUNT(*) as c FROM messages").get().c;
    const activePlans    = db.prepare("SELECT COUNT(*) as c FROM users WHERE plan!='none' AND role_admin=0").get().c;
    const revenue        = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM billing WHERE status='active'").get().total;
    res.json({ totalUsers, restricted, totalListings, activeListings, pendingReports, totalMessages, activePlans, revenue });
  } catch(err){ res.status(500).json({ message: err.message }); }
});

// ── USERS ──
router.get('/users', (req, res) => {
  try {
    const { search, filter } = req.query;
    let q = `SELECT u.*, 
      (SELECT COUNT(*) FROM listings WHERE seller_id=u.id AND active=1) as active_listings,
      (SELECT COUNT(*) FROM reports WHERE reported_user_id=u.id) as report_count,
      (SELECT COUNT(*) FROM messages WHERE sender_id=u.id OR receiver_id=u.id) as message_count
      FROM users u WHERE u.role_admin=0`;
    const p = [];
    if (search) { q += " AND (u.name LIKE ? OR u.email LIKE ?)"; p.push(`%${search}%`,`%${search}%`); }
    if (filter==='restricted') q += " AND u.restricted=1";
    else if (filter==='warned') q += " AND u.trust_score<80 AND u.restricted=0";
    else if (filter==='active') q += " AND u.plan!='none'";
    q += " ORDER BY u.created_at DESC";
    res.json(db.prepare(q).all(...p));
  } catch(err){ res.status(500).json({ message: err.message }); }
});

router.get('/users/:id', (req, res) => {
  try {
    const user = db.prepare("SELECT *, (SELECT COUNT(*) FROM trust_events WHERE user_id=users.id AND event_type='admin_restrict') as restrict_count FROM users WHERE id=?").get(req.params.id);
    if (!user) return res.status(404).json({ message:'Not found' });
    const { password:_, ...safe } = user;
    const listings = db.prepare("SELECT * FROM listings WHERE seller_id=? ORDER BY created_at DESC").all(req.params.id);
    const billing  = db.prepare("SELECT * FROM billing WHERE user_id=? ORDER BY created_at DESC").all(req.params.id);
    const events   = db.prepare("SELECT * FROM trust_events WHERE user_id=? ORDER BY created_at DESC LIMIT 30").all(req.params.id);
    const reports  = db.prepare("SELECT r.*, u.name as reporter_name FROM reports r LEFT JOIN users u ON r.reporter_id=u.id WHERE r.reported_user_id=? ORDER BY r.created_at DESC").all(req.params.id);
    const messages = db.prepare("SELECT COUNT(*) as c FROM messages WHERE sender_id=? OR receiver_id=?").get(req.params.id, req.params.id);
    res.json({ ...safe, listings, billing, events, reports, message_count: messages.c });
  } catch(err){ res.status(500).json({ message: err.message }); }
});

// Create user
router.post('/users', (req, res) => {
  try {
    const { name, email, password, role, plan, city } = req.body;
    if (!name||!email||!password) return res.status(400).json({ message:'Name, email, password required' });
    const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase());
    if (exists) return res.status(409).json({ message:'Email already exists' });
    const hash = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO users (name,email,password,role,city,plan,trust_score) VALUES (?,?,?,?,?,?,?)').run(name, email.toLowerCase(), hash, role||'buyer', city||'Lomé', plan||'none', 100);
    res.status(201).json({ id: result.lastInsertRowid, message:'User created' });
  } catch(err){ res.status(500).json({ message: err.message }); }
});

// Delete user
router.delete('/users/:id', (req, res) => {
  try {
    db.prepare('UPDATE listings SET active=0 WHERE seller_id=?').run(req.params.id);
    db.prepare('DELETE FROM users WHERE id=?').run(req.params.id);
    res.json({ message:'User deleted' });
  } catch(err){ res.status(500).json({ message: err.message }); }
});

// Restrict/restore — progressive suspension
router.put('/users/:id/restrict', (req, res) => {
  try {
    const { restrict, reason, manual_days } = req.body;
    const user = db.prepare('SELECT restrict_count FROM users WHERE id=?').get(req.params.id);

    if (restrict) {
      const count = (user?.restrict_count || 0) + 1;

      // Progressive: 1st=7d, 2nd=15d, 3rd=30d, 4th+=permanent
      let days = 0;
      let label = '';
      if (manual_days) {
        days = parseInt(manual_days);
        label = `${days} days (manual)`;
      } else if (count === 1) { days = 7; label = '7 days (1st offense)'; }
      else if (count === 2) { days = 15; label = '15 days (2nd offense)'; }
      else if (count === 3) { days = 30; label = '30 days (3rd offense)'; }
      else { days = 0; label = 'Permanent (4th+ offense)'; }

      const until = days > 0
        ? new Date(Date.now() + days * 86400000).toISOString().slice(0,19).replace('T',' ')
        : null;

      db.prepare("UPDATE users SET restricted=1, trust_score=0, restrict_count=?, restricted_until=? WHERE id=?")
        .run(count, until, req.params.id);
      db.prepare("UPDATE listings SET active=0 WHERE seller_id=?").run(req.params.id);
      db.prepare("INSERT INTO trust_events (user_id,event_type,description,points) VALUES (?,?,?,?)")
        .run(req.params.id, 'admin_restrict', `Restricted: ${reason||'Policy violation'} — ${label}`, -100);
    } else {
      db.prepare("UPDATE users SET restricted=0, trust_score=30, restricted_until=NULL WHERE id=?").run(req.params.id);
      db.prepare("UPDATE listings SET active=1 WHERE seller_id=?").run(req.params.id);
      db.prepare("INSERT INTO trust_events (user_id,event_type,description,points) VALUES (?,?,?,?)")
        .run(req.params.id, 'admin_restore', 'Account restored by admin', 30);
    }
    res.json({ message: restrict?'Restricted':'Restored' });
  } catch(err){ res.status(500).json({ message: err.message }); }
});

// Adjust score
router.put('/users/:id/adjust-score', (req, res) => {
  try {
    const { points, reason } = req.body;
    if (points===undefined||points===''||!reason) return res.status(400).json({ message:'Points and reason required' });
    const pts = parseInt(points);
    const user = db.prepare('SELECT trust_score, restricted FROM users WHERE id=?').get(req.params.id);
    if (!user) return res.status(404).json({ message:'User not found' });
    const newScore = Math.max(0, Math.min(100, (user.trust_score||100) + pts));
    // Auto restrict if hits 0, auto unrestrict if admin gives positive points and score > 0
    let restricted = user.restricted;
    if (newScore <= 0) restricted = 1;
    if (pts > 0 && newScore > 0) restricted = 0; // Admin manually restoring
    db.prepare('UPDATE users SET trust_score=?, restricted=? WHERE id=?').run(newScore, restricted, req.params.id);
    if (restricted && !user.restricted) db.prepare('UPDATE listings SET active=0 WHERE seller_id=?').run(req.params.id);
    if (!restricted && user.restricted) db.prepare('UPDATE listings SET active=1 WHERE seller_id=?').run(req.params.id);
    db.prepare('INSERT INTO trust_events (user_id,event_type,description,points) VALUES (?,?,?,?)').run(req.params.id,'admin_adjustment',`Admin: ${reason}`,pts);
    res.json({ trust_score: newScore, restricted, message:`Score updated to ${newScore}` });
  } catch(err){ res.status(500).json({ message: err.message }); }
});

// ── REPORTS ──
router.get('/reports', (req, res) => {
  try {
    const { status } = req.query;
    let q = `SELECT r.*,
      u1.name as reporter_name, u1.email as reporter_email,
      u2.name as reported_name, u2.email as reported_email, u2.trust_score as reported_trust,
      l.title as listing_title
      FROM reports r
      LEFT JOIN users u1 ON r.reporter_id=u1.id
      LEFT JOIN users u2 ON r.reported_user_id=u2.id
      LEFT JOIN listings l ON r.reported_listing_id=l.id`;
    if (status) q += ` WHERE r.status='${status}'`;
    q += ' ORDER BY r.created_at DESC';
    res.json(db.prepare(q).all());
  } catch(err){ res.status(500).json({ message: err.message }); }
});

router.put('/reports/:id', (req, res) => {
  try {
    const { status, admin_note, action, override_points } = req.body;
    const report = db.prepare('SELECT * FROM reports WHERE id=?').get(req.params.id);
    if (!report) return res.status(404).json({ message:'Report not found' });

    const note = admin_note || '';
    db.prepare("UPDATE reports SET status=?, admin_note=? WHERE id=?").run(status, note, req.params.id);

    if (report.reported_user_id) {
      const user = db.prepare('SELECT trust_score, restricted FROM users WHERE id=?').get(report.reported_user_id);

      if (action === 'warn') {
        const pts = override_points ? parseInt(override_points) : -15;
        const newScore = Math.max(0, (user.trust_score||100) + pts);
        const restricted = newScore <= 0 ? 1 : user.restricted;
        db.prepare('UPDATE users SET trust_score=?, restricted=? WHERE id=?').run(newScore, restricted, report.reported_user_id);
        db.prepare("INSERT INTO trust_events (user_id,event_type,description,points) VALUES (?,?,?,?)").run(report.reported_user_id,'admin_manual',`Admin action: ${note||'Warning'}`,pts);
        if (restricted) db.prepare("UPDATE listings SET active=0 WHERE seller_id=?").run(report.reported_user_id);
      } else if (action === 'restrict') {
        db.prepare("UPDATE users SET restricted=1, trust_score=0 WHERE id=?").run(report.reported_user_id);
        db.prepare("UPDATE listings SET active=0 WHERE seller_id=?").run(report.reported_user_id);
        db.prepare("INSERT INTO trust_events (user_id,event_type,description,points) VALUES (?,?,?,?)").run(report.reported_user_id,'admin_restrict',`Admin restricted: ${note}`,-100);
      } else if (action === 'restore') {
        // Admin overrides — restores user
        db.prepare("UPDATE users SET restricted=0, trust_score=50 WHERE id=?").run(report.reported_user_id);
        db.prepare("UPDATE listings SET active=1 WHERE seller_id=?").run(report.reported_user_id);
        db.prepare("INSERT INTO trust_events (user_id,event_type,description,points) VALUES (?,?,?,?)").run(report.reported_user_id,'admin_restore',`Admin restored after report review: ${note}`,50);
      } else if (action === 'dismiss_restore') {
        // False report — restore points
        const restore = Math.min(100, (user.trust_score||0) + 10);
        db.prepare('UPDATE users SET trust_score=? WHERE id=?').run(restore, report.reported_user_id);
        db.prepare("INSERT INTO trust_events (user_id,event_type,description,points) VALUES (?,?,?,?)").run(report.reported_user_id,'false_report_restore',`Points restored: report dismissed as false`,10);
      }
    }
    res.json({ message:'Report updated with admin action' });
  } catch(err){ res.status(500).json({ message: err.message }); }
});

// ── LISTINGS ──
router.get('/listings', (req, res) => {
  try {
    const { search } = req.query;
    let q = `SELECT l.*, u.name as seller_name, u.email as seller_email, u.trust_score
      FROM listings l LEFT JOIN users u ON l.seller_id=u.id`;
    const p = [];
    if (search) { q += " WHERE l.title LIKE ? OR u.name LIKE ?"; p.push(`%${search}%`,`%${search}%`); }
    q += ' ORDER BY l.created_at DESC';
    res.json(db.prepare(q).all(...p));
  } catch(err){ res.status(500).json({ message: err.message }); }
});

router.delete('/listings/:id', (req, res) => {
  try {
    const l = db.prepare('SELECT seller_id FROM listings WHERE id=?').get(req.params.id);
    if (!l) return res.status(404).json({ message:'Not found' });
    db.prepare('UPDATE listings SET active=0 WHERE id=?').run(req.params.id);
    // No score deduction for admin listing removal — admin decides separately
    res.json({ message:'Removed' });
  } catch(err){ res.status(500).json({ message: err.message }); }
});

// ── BILLING OVERVIEW ──
router.get('/billing', (req, res) => {
  try {
    const records = db.prepare(`SELECT b.*, u.name as user_name, u.email as user_email
      FROM billing b LEFT JOIN users u ON b.user_id=u.id
      ORDER BY b.created_at DESC LIMIT 100`).all();
    res.json(records);
  } catch(err){ res.status(500).json({ message: err.message }); }
});

module.exports = router;
