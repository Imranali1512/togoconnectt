const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { protect } = require('../middleware/auth');
const { detectAbuse, deductPoints, blockRestricted } = require('../middleware/trust');

// GET /api/messages/unread-count  ← MUST be before /:userId
router.get('/unread-count', protect, (req, res) => {
  try {
    // Active conversations count
    const chats = db.prepare(`
      SELECT COUNT(DISTINCT CASE WHEN sender_id=? THEN receiver_id ELSE sender_id END) as c
      FROM messages WHERE sender_id=? OR receiver_id=?
    `).get(req.user.id, req.user.id, req.user.id);
    const unread = db.prepare(`SELECT COUNT(*) as c FROM messages WHERE receiver_id=? AND read=0`).get(req.user.id);
    res.json({ count: chats.c, unread: unread.c });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages — all messages, grouped into conversations
router.get('/', protect, (req, res) => {
  try {
    const messages = db.prepare(`
      SELECT m.*,
        s.name as sender_name,
        r.name as receiver_name,
        l.title as listing_title,
        l.image as listing_image,
        l.category as listing_category
      FROM messages m
      LEFT JOIN users s ON m.sender_id = s.id
      LEFT JOIN users r ON m.receiver_id = r.id
      LEFT JOIN listings l ON m.listing_id = l.id
      WHERE m.sender_id = ? OR m.receiver_id = ?
      ORDER BY m.created_at DESC
    `).all(req.user.id, req.user.id);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/conversation/:userId — full chat between 2 users
router.get('/conversation/:userId', protect, (req, res) => {
  try {
    const otherId = parseInt(req.params.userId);
    if (isNaN(otherId)) return res.status(400).json({ message: 'Invalid user ID' });

    const msgs = db.prepare(`
      SELECT m.*,
        s.name as sender_name,
        r.name as receiver_name,
        l.title as listing_title
      FROM messages m
      LEFT JOIN users s ON m.sender_id = s.id
      LEFT JOIN users r ON m.receiver_id = r.id
      LEFT JOIN listings l ON m.listing_id = l.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `).all(req.user.id, otherId, otherId, req.user.id);

    // Mark incoming as read
    db.prepare(`UPDATE messages SET read = 1 WHERE receiver_id = ? AND sender_id = ?`)
      .run(req.user.id, otherId);

    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/messages — send a message
router.post('/', protect, blockRestricted, (req, res) => {
  try {
    const { receiver_id, listing_id, text } = req.body;
    if (!text?.trim() || !receiver_id) return res.status(400).json({ message: 'Missing fields' });

    // Cannot message yourself
    if (parseInt(receiver_id) === req.user.id) {
      return res.status(400).json({ message: 'Cannot message yourself' });
    }

    // Abuse detection
    const abuse = detectAbuse(text);
    if (abuse.abusive) {
      deductPoints(req.user.id, 'abusive_message', `Abusive message detected: "${abuse.words.join(', ')}"`, -10);
      const updatedUser = require('../db/database').prepare('SELECT trust_score, restricted FROM users WHERE id = ?').get(req.user.id);
      if (updatedUser.restricted) {
        return res.status(403).json({
          message: 'Your account has been restricted due to abusive language.',
          restricted: true,
          trust_score: updatedUser.trust_score,
        });
      }
      return res.status(400).json({
        message: `Warning: Your message contains inappropriate content. This has been recorded and your trust score reduced. (${updatedUser.trust_score}/100 points remaining)`,
        warned: true,
        trust_score: updatedUser.trust_score,
      });
    }

    const result = db.prepare(
      'INSERT INTO messages (sender_id, receiver_id, listing_id, text) VALUES (?, ?, ?, ?)'
    ).run(req.user.id, parseInt(receiver_id), listing_id || null, text.trim());

    const msg = db.prepare(`
      SELECT m.*, s.name as sender_name, r.name as receiver_name, l.title as listing_title
      FROM messages m
      LEFT JOIN users s ON m.sender_id = s.id
      LEFT JOIN users r ON m.receiver_id = r.id
      LEFT JOIN listings l ON m.listing_id = l.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
