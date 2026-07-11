const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { protect } = require('../middleware/auth');
const { blockRestricted } = require('../middleware/trust');

// POST /api/bookings — request a meeting
router.post('/', protect, blockRestricted, (req, res) => {
  try {
    const { seller_id, listing_id, message, meeting_date } = req.body;
    if (!seller_id) return res.status(400).json({ message: 'Seller required' });
    if (parseInt(seller_id) === req.user.id) return res.status(400).json({ message: 'Cannot book yourself' });

    const seller = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(seller_id);
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    const listing = listing_id ? db.prepare('SELECT title FROM listings WHERE id = ?').get(listing_id) : null;

    const result = db.prepare(
      'INSERT INTO bookings (client_id, seller_id, listing_id, message, meeting_date) VALUES (?,?,?,?,?)'
    ).run(req.user.id, seller_id, listing_id || null, message || '', meeting_date || '');

    // Send email notification to seller (non-blocking)
    if (process.env.SMTP_USER && process.env.SMTP_USER !== 'your-gmail@gmail.com') {
      try {
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: 587, secure: false,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        });
        transporter.sendMail({
          from: `"TogoConnect" <${process.env.SMTP_USER}>`,
          to: seller.email,
          subject: `New meeting request — ${req.user.name}`,
          html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2 style="color:#0f6e56">New Meeting Request</h2>
            <p>Hi ${seller.name},</p>
            <p><strong>${req.user.name}</strong> has requested a meeting with you${listing ? ` about <strong>${listing.title}</strong>` : ''}.</p>
            ${meeting_date ? `<p><strong>Proposed date:</strong> ${meeting_date}</p>` : ''}
            ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
            <a href="${process.env.SITE_URL || 'http://localhost:5173'}/dashboard?tab=bookings" style="display:inline-block;background:#1D9E75;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:16px">
              View in Dashboard
            </a>
            <p style="color:#9ca3af;font-size:12px;margin-top:24px">TogoConnect — The trusted marketplace for Togo</p>
          </div>`
        }).catch(e => console.log('[Booking email]', e.message));
      } catch(e) {}
    }

    res.status(201).json({ id: result.lastInsertRowid, message: 'Meeting request sent!' });
  } catch(err) { res.status(500).json({ message: err.message }); }
});

// GET /api/bookings — get my bookings (as seller or client)
router.get('/', protect, (req, res) => {
  try {
    const { role } = req.query;
    let bookings;
    if (role === 'seller') {
      bookings = db.prepare(`
        SELECT b.*, u.name as client_name, u.email as client_email, l.title as listing_title
        FROM bookings b
        LEFT JOIN users u ON b.client_id = u.id
        LEFT JOIN listings l ON b.listing_id = l.id
        WHERE b.seller_id = ? ORDER BY b.created_at DESC
      `).all(req.user.id);
    } else {
      bookings = db.prepare(`
        SELECT b.*, u.name as seller_name, u.email as seller_email, l.title as listing_title
        FROM bookings b
        LEFT JOIN users u ON b.seller_id = u.id
        LEFT JOIN listings l ON b.listing_id = l.id
        WHERE b.client_id = ? ORDER BY b.created_at DESC
      `).all(req.user.id);
    }
    res.json(bookings);
  } catch(err) { res.status(500).json({ message: err.message }); }
});

// PUT /api/bookings/:id — update status + notify client
router.put('/:id', protect, (req, res) => {
  try {
    const { status } = req.body;
    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Not found' });
    if (booking.seller_id !== req.user.id && booking.client_id !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });

    db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, req.params.id);

    // Notify client when seller accepts/declines
    if (status === 'accepted' || status === 'declined') {
      const client = db.prepare('SELECT name, email FROM users WHERE id = ?').get(booking.client_id);
      const seller = db.prepare('SELECT name FROM users WHERE id = ?').get(booking.seller_id);
      const listing = booking.listing_id ? db.prepare('SELECT title FROM listings WHERE id = ?').get(booking.listing_id) : null;

      if (client && process.env.SMTP_USER && process.env.SMTP_USER !== 'your-gmail@gmail.com') {
        try {
          const nodemailer = require('nodemailer');
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: 587, secure: false,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
          });

          const isAccepted = status === 'accepted';
          transporter.sendMail({
            from: `"TogoConnect" <${process.env.SMTP_USER}>`,
            to: client.email,
            subject: isAccepted
              ? `✅ Meeting Accepted — ${seller?.name}`
              : `Meeting Request Update — ${seller?.name}`,
            html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <div style="background:${isAccepted?'#ecfdf5':'#fef2f2'};border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
                <div style="font-size:40px;margin-bottom:8px">${isAccepted?'✅':'❌'}</div>
                <h2 style="color:${isAccepted?'#065f46':'#991b1b'};margin:0">
                  Meeting ${isAccepted?'Accepted':'Declined'}
                </h2>
              </div>
              <p>Hi ${client.name},</p>
              <p><strong>${seller?.name}</strong> has ${isAccepted?'accepted':'declined'} your meeting request${listing?' for <strong>'+listing.title+'</strong>':''}.</p>
              ${isAccepted?`<p style="background:#f0fdf4;border-left:4px solid #16a34a;padding:12px 16px;border-radius:4px;color:#065f46;font-weight:600">
                Your meeting is confirmed! The seller will contact you at the agreed time.
              </p>`:'<p style="color:#6b7280">You can browse other services or send a new meeting request.</p>'}
              <a href="${process.env.SITE_URL||'http://localhost:5173'}/services"
                style="display:inline-block;background:#1D9E75;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;margin-top:16px">
                Browse Services
              </a>
              <p style="color:#9ca3af;font-size:12px;margin-top:24px">TogoConnect — The trusted marketplace for Togo</p>
            </div>`
          }).catch(e => console.log('[Booking notify]', e.message));
        } catch(e) {}
      }
    }

    res.json({ message: 'Updated', status });
  } catch(err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
