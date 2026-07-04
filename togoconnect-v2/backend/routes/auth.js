const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/database');
const { protect } = require('../middleware/auth');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// ── POST /api/auth/register ──
router.post('/register', (req, res) => {
  try {
    const { name, email, password, role, city } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Please fill all required fields' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Please enter a valid email address' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const emailLower = email.toLowerCase().trim();
    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(emailLower);
    if (exists) return res.status(409).json({ message: 'An account with this email already exists. Please log in instead.' });

    const hashed = bcrypt.hashSync(password, 10);
    const result = db.prepare(
      'INSERT INTO users (name, email, password, role, city, plan) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(name.trim(), emailLower, hashed, role || 'buyer', city || 'Lomé', 'none');

    const user = db.prepare('SELECT id, name, email, role, role_admin, plan, city, phone, avatar FROM users WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ ...user, token: generateToken(user.id), isNew: true });
  } catch (err) {
    if (err.message?.includes('UNIQUE constraint failed'))
      return res.status(409).json({ message: 'An account with this email already exists. Please log in instead.' });
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── POST /api/auth/login ──
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) return res.status(401).json({ message: 'No account found with this email address' });

    const match = bcrypt.compareSync(password, user.password);
    if (!match) return res.status(401).json({ message: 'Incorrect password. Please try again.' });

    const { password: _, ...safe } = user;
    res.json({ ...safe, token: generateToken(user.id), isNew: false });
  } catch (err) {
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── GET /api/auth/me ──
router.get('/me', protect, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, role_admin, plan, plan_expires_at, city, bio, avatar, phone, trust_score, restricted, restricted_until, restrict_count FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// ── PUT /api/auth/profile ──
router.put('/profile', protect, (req, res) => {
  try {
    const { name, city, bio, phone, avatar } = req.body;
    db.prepare('UPDATE users SET name=?, city=?, bio=?, phone=?, avatar=? WHERE id=?')
      .run(name || req.user.name, city ?? req.user.city, bio ?? '', phone ?? '', avatar ?? '', req.user.id);
    res.json(db.prepare('SELECT id, name, email, role, role_admin, plan, plan_expires_at, city, bio, avatar, phone FROM users WHERE id=?').get(req.user.id));
  } catch (err) {
    res.status(500).json({ message: 'Update failed' });
  }
});

// ── PUT /api/auth/password ──
router.put('/password', protect, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Both fields required' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(currentPassword, user.password))
      return res.status(401).json({ message: 'Current password is incorrect' });
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 10), req.user.id);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Password update failed' });
  }
});

// ── PUT /api/auth/plan ──
router.put('/plan', protect, (req, res) => {
  try {
    const { plan } = req.body;
    const valid = ['none', 'basic', 'standard', 'premium'];
    if (!valid.includes(plan)) return res.status(400).json({ message: 'Invalid plan' });
    db.prepare('UPDATE users SET plan = ? WHERE id = ?').run(plan, req.user.id);
    const updated = db.prepare('SELECT id, name, email, role, role_admin, plan, plan_expires_at, city, bio, avatar, phone, trust_score, restricted, restricted_until, restrict_count FROM users WHERE id = ?').get(req.user.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Plan update failed' });
  }
});

// ── POST /api/auth/forgot-password ──
router.post('/forgot-password', (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email.toLowerCase().trim());
    // Always respond with success to prevent email enumeration
    if (!user) return res.json({ message: 'If this email exists, a reset link has been sent.' });

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' '); // 1 hour

    // Invalidate old tokens
    db.prepare("UPDATE password_resets SET used = 1 WHERE user_id = ?").run(user.id);
    // Save new token
    db.prepare("INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)").run(user.id, token, expiresAt);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    // Send email — runs in background, never crashes server
    console.log('[Password Reset] Link for', user.email, ':', resetLink);
    if (process.env.SMTP_USER && process.env.SMTP_PASS && 
        !process.env.SMTP_USER.includes('your-gmail')) {
      setImmediate(async () => {
        try {
          const nodemailer = require('nodemailer');
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          });
          await transporter.sendMail({
            from: `"TogoConnect" <${process.env.SMTP_USER}>`,
            to: user.email,
            subject: 'Reset your TogoConnect password',
            html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <h2 style="color:#0f1923">Reset your password</h2>
              <p style="color:#6b7280">Hi ${user.name}, click the button below to reset your password.</p>
              <div style="margin:24px 0">
                <a href="${resetLink}" style="background:#1D9E75;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">Reset Password</a>
              </div>
              <p style="color:#9ca3af;font-size:13px">Link expires in 1 hour. If you didn't request this, ignore this email.</p>
              <p style="color:#9ca3af;font-size:12px">Or copy: ${resetLink}</p>
            </div>`,
          });
          console.log('[Email] Sent to', user.email);
        } catch (mailErr) {
          console.log('[Email] Failed:', mailErr.message);
        }
      });
    } else {
      console.log('[Email] SMTP not configured. Reset link above can be used directly.');
    }

    res.json({ message: 'If this email exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── POST /api/auth/reset-password ──
router.post('/reset-password', (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and password are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const reset = db.prepare("SELECT * FROM password_resets WHERE token = ? AND used = 0").get(token);
    if (!reset) return res.status(400).json({ message: 'Invalid or expired reset link. Please request a new one.' });

    const now = new Date();
    const expires = new Date(reset.expires_at);
    if (now > expires) return res.status(400).json({ message: 'This reset link has expired. Please request a new one.' });

    // Update password
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), reset.user_id);
    // Mark token used
    db.prepare('UPDATE password_resets SET used = 1 WHERE id = ?').run(reset.id);

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// ── GET /api/auth/verify-reset-token/:token ──
router.get('/verify-reset-token/:token', (req, res) => {
  try {
    const reset = db.prepare("SELECT * FROM password_resets WHERE token = ? AND used = 0").get(req.params.token);
    if (!reset) return res.status(400).json({ valid: false, message: 'Invalid or already used link' });
    if (new Date() > new Date(reset.expires_at)) return res.status(400).json({ valid: false, message: 'Link expired' });
    res.json({ valid: true });
  } catch (err) {
    res.status(500).json({ valid: false });
  }
});

module.exports = router;
