const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { protect } = require('../middleware/auth');
const { detectAbuse, deductPoints, blockRestricted } = require('../middleware/trust');

const PLAN_LIMITS = { none: 0, basic: 1, standard: 10, premium: Infinity };

// GET /api/listings
router.get('/', (req, res) => {
  try {
    const { category, city, search, featured } = req.query;
    let query = `SELECT l.*, u.avatar as seller_avatar FROM listings l LEFT JOIN users u ON l.seller_id = u.id WHERE l.active = 1`;
    const params = [];
    if (category) { query += ' AND l.category = ?'; params.push(category); }
    if (city && city !== 'All locations') { query += ' AND l.city LIKE ?'; params.push(`%${city}%`); }
    if (req.query.region && req.query.region !== 'All regions') {
      // Filter by all cities in that region
      const regionCities = {
        'Région Maritime': ['Lomé','Agoè-Nyivé','Tsévié','Aneho','Vogan','Tabligbo','Kévé','Afagnan','Togblekopé'],
        'Région des Plateaux': ['Kpalimé','Atakpamé','Notsé','Badou','Anié','Blitta','Amlamé','Tohoun','Wahala'],
        'Région Centrale': ['Sokodé','Bafilo','Sotouboua','Tchamba','Blitta'],
        'Région de la Kara': ['Kara','Bassar','Niamtougou','Kandé','Guérin-Kouka','Pagouda'],
        'Région des Savanes': ['Dapaong','Mango','Sansanné-Mango','Cinkassé','Tandjouaré','Mandouri']
      };
      const cities = regionCities[req.query.region];
      if (cities) {
        const placeholders = cities.map(() => '?').join(',');
        query += ` AND l.city IN (${placeholders})`;
        params.push(...cities);
      }
    }
    if (featured) { query += ' AND l.featured = 1'; }
    if (search) {
      query += ' AND (l.title LIKE ? OR l.description LIKE ? OR l.category LIKE ? OR l.seller_name LIKE ? OR l.city LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }
    query += ' ORDER BY l.featured DESC, l.created_at DESC';
    const listings = db.prepare(query).all(...params);
    res.json(listings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/listings/my
router.get('/my', protect, (req, res) => {
  try {
    const listings = db.prepare('SELECT * FROM listings WHERE seller_id = ? AND active = 1 ORDER BY created_at DESC').all(req.user.id);
    const user = db.prepare('SELECT plan FROM users WHERE id = ?').get(req.user.id);
    const plan = user?.plan || 'basic';
    const limit = (plan in PLAN_LIMITS) ? PLAN_LIMITS[plan] : 1;
    res.json({ listings, plan, limit: limit === Infinity ? 'unlimited' : limit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/listings/:id
router.get('/:id', (req, res) => {
  try {
    const listing = db.prepare('SELECT * FROM listings WHERE id = ? AND active = 1').get(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });
    const seller = db.prepare('SELECT id, name, city, bio, avatar, phone FROM users WHERE id = ?').get(listing.seller_id);
    const reviews = db.prepare('SELECT * FROM reviews WHERE listing_id = ? ORDER BY created_at DESC').all(listing.id);
    // Get extra images
    const images = db.prepare('SELECT * FROM listing_images WHERE listing_id = ? ORDER BY is_primary DESC').all(listing.id);
    res.json({ ...listing, seller, reviews, images });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/listings
router.post('/', protect, blockRestricted, (req, res) => {
  try {
    const user = db.prepare('SELECT plan FROM users WHERE id = ?').get(req.user.id);
    const plan = user?.plan || 'basic';
    const limit = (plan in PLAN_LIMITS) ? PLAN_LIMITS[plan] : 1;
    const current = db.prepare('SELECT COUNT(*) as c FROM listings WHERE seller_id = ? AND active = 1').get(req.user.id);

    if (limit === 0) {
      return res.status(403).json({
        message: 'You need a paid plan to list services. Please upgrade.',
        upgrade: true
      });
    }
    if (limit !== Infinity && current.c >= limit) {
      return res.status(403).json({
        message: `Your ${plan} plan allows only ${limit} listing${limit > 1 ? 's' : ''}. Please upgrade.`,
        upgrade: true
      });
    }

    const { title, description, category, price, price_type, city, is_remote, image, images } = req.body;
    if (!title || !category || !price) return res.status(400).json({ message: 'Title, category and price are required' });

    // Check title and description for abuse
    const abuseCheck = detectAbuse((title || '') + ' ' + (description || ''));
    if (abuseCheck.abusive) {
      deductPoints(req.user.id, 'abusive_listing', `Abusive listing content: "${abuseCheck.words.join(', ')}"`, -20);
      return res.status(400).json({
        message: `Your listing contains inappropriate content. Trust score reduced by 20 points.`,
        warned: true,
      });
    }

    const result = db.prepare(`
      INSERT INTO listings (title, description, category, price, price_type, city, is_remote, seller_id, seller_name, image, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(title, description || '', category, Number(price), price_type || 'fixed',
           city || 'Lome', is_remote ? 1 : 0, req.user.id, req.user.name, image || '');

    const listingId = result.lastInsertRowid;

    // Save extra images
    if (images && images.length > 0) {
      const insImg = db.prepare('INSERT INTO listing_images (listing_id, url, is_primary) VALUES (?, ?, ?)');
      images.forEach((url, i) => insImg.run(listingId, url, i === 0 ? 1 : 0));
    }

    // Double-check listing is active
    db.prepare('UPDATE listings SET active = 1 WHERE id = ?').run(listingId);
    res.status(201).json(db.prepare('SELECT * FROM listings WHERE id = ?').get(listingId));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/listings/:id
router.put('/:id', protect, (req, res) => {
  try {
    const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Not found' });
    if (listing.seller_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });

    const { title, description, category, price, price_type, city, is_remote, image, images } = req.body;
    db.prepare(`UPDATE listings SET title=?, description=?, category=?, price=?, price_type=?, city=?, is_remote=?, image=? WHERE id=?`)
      .run(title, description || '', category, Number(price), price_type || 'fixed',
           city || 'Lome', is_remote ? 1 : 0, image || listing.image, req.params.id);

    // Replace images if provided
    if (images !== undefined) {
      db.prepare('DELETE FROM listing_images WHERE listing_id = ?').run(req.params.id);
      if (images.length > 0) {
        const insImg = db.prepare('INSERT INTO listing_images (listing_id, url, is_primary) VALUES (?, ?, ?)');
        images.forEach((url, i) => insImg.run(req.params.id, url, i === 0 ? 1 : 0));
      }
    }

    res.json(db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/listings/:id
router.delete('/:id', protect, (req, res) => {
  try {
    const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Not found' });
    if (listing.seller_id !== req.user.id) return res.status(403).json({ message: 'Not authorized' });
    db.prepare('UPDATE listings SET active = 0 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Listing deleted', id: parseInt(req.params.id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/listings/:id/review
router.post('/:id/review', protect, (req, res) => {
  try {
    const { rating, comment } = req.body;
    const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const existing = db.prepare('SELECT id FROM reviews WHERE listing_id = ? AND user_id = ?').get(req.params.id, req.user.id);

    if (existing) {
      // Update review
      db.prepare('UPDATE reviews SET rating = ?, comment = ? WHERE id = ?')
        .run(Number(rating), comment || '', existing.id);
    } else {
      // New review
      db.prepare('INSERT INTO reviews (listing_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?)')
        .run(req.params.id, req.user.id, req.user.name, Number(rating), comment || '');

      // +2 trust score for seller on new review
      const seller = db.prepare('SELECT trust_score FROM users WHERE id = ?').get(listing.seller_id);
      if (seller) {
        const newScore = Math.min(100, (seller.trust_score || 100) + 2);
        db.prepare('UPDATE users SET trust_score = ? WHERE id = ?').run(newScore, listing.seller_id);
        db.prepare("INSERT INTO trust_events (user_id, event_type, description, points) VALUES (?, ?, ?, ?)")
          .run(listing.seller_id, 'good_review', `New review on: ${listing.title}`, 2);
      }
    }

    // Recalculate stats
    const stats = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE listing_id = ?').get(req.params.id);
    db.prepare('UPDATE listings SET rating = ?, num_reviews = ? WHERE id = ?').run(stats.avg || 0, stats.cnt, req.params.id);

    res.status(201).json({ message: existing ? 'Review updated' : 'Review added', updated: !!existing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/listings/:id/review — delete own review
router.delete('/:id/review', protect, (req, res) => {
  try {
    const listing = db.prepare('SELECT * FROM listings WHERE id = ?').get(req.params.id);
    if (!listing) return res.status(404).json({ message: 'Listing not found' });

    const review = db.prepare('SELECT * FROM reviews WHERE listing_id = ? AND user_id = ?').get(req.params.id, req.user.id);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    db.prepare('DELETE FROM reviews WHERE id = ?').run(review.id);

    // Recalculate stats
    const stats = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as cnt FROM reviews WHERE listing_id = ?').get(req.params.id);
    db.prepare('UPDATE listings SET rating = ?, num_reviews = ? WHERE id = ?').run(stats.avg || 0, stats.cnt, req.params.id);

    // Remove +2 trust score that was given for this review
    const seller = db.prepare('SELECT trust_score FROM users WHERE id = ?').get(listing.seller_id);
    if (seller) {
      const newScore = Math.max(0, (seller.trust_score || 0) - 2);
      db.prepare('UPDATE users SET trust_score = ? WHERE id = ?').run(newScore, listing.seller_id);
      db.prepare("INSERT INTO trust_events (user_id, event_type, description, points) VALUES (?, ?, ?, ?)")
        .run(listing.seller_id, 'review_deleted', `Review removed from: ${listing.title}`, -2);
    }

    res.json({ message: 'Review deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;
