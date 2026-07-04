const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'togoconnect.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'buyer',
    plan TEXT DEFAULT 'none',
    city TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    avatar TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS listing_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    url TEXT NOT NULL,
    is_primary INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(id)
  );

  CREATE TABLE IF NOT EXISTS billing (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    plan TEXT NOT NULL,
    amount INTEGER NOT NULL,
    period TEXT NOT NULL,
    started_at DATETIME NOT NULL,
    expires_at DATETIME NOT NULL,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    category TEXT NOT NULL,
    price REAL NOT NULL,
    price_type TEXT DEFAULT 'fixed',
    city TEXT NOT NULL,
    is_remote INTEGER DEFAULT 0,
    seller_id INTEGER NOT NULL,
    seller_name TEXT,
    image TEXT DEFAULT '',
    rating REAL DEFAULT 0,
    num_reviews INTEGER DEFAULT 0,
    featured INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    user_name TEXT,
    rating INTEGER NOT NULL,
    comment TEXT DEFAULT '',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES listings(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (receiver_id) REFERENCES users(id)
  );
`);

// Add columns if missing (for existing DBs)
try { db.exec(`ALTER TABLE users ADD COLUMN plan TEXT DEFAULT 'none'`); } catch(e) {}
try { db.exec(`CREATE TABLE IF NOT EXISTS password_resets (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, token TEXT NOT NULL UNIQUE, expires_at DATETIME NOT NULL, used INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`); } catch(e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN trust_score INTEGER DEFAULT 100`); } catch(e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN restricted INTEGER DEFAULT 0`); } catch(e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN restricted_until DATETIME`); } catch(e) {}
try { db.exec(`ALTER TABLE reviews ADD COLUMN updated_at DATETIME`); } catch(e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN restrict_count INTEGER DEFAULT 0`); } catch(e) {}
try { db.exec(`CREATE TABLE IF NOT EXISTS trust_events (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, event_type TEXT NOT NULL, description TEXT, points INTEGER NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id))`); } catch(e) {}
try { db.exec(`CREATE TABLE IF NOT EXISTS reports (id INTEGER PRIMARY KEY AUTOINCREMENT, reporter_id INTEGER NOT NULL, reported_user_id INTEGER, reported_listing_id INTEGER, reason TEXT NOT NULL, status TEXT DEFAULT 'pending', admin_note TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`); } catch(e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN role_admin INTEGER DEFAULT 0`); } catch(e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN phone TEXT DEFAULT ''`); } catch(e) {}
try { db.exec(`ALTER TABLE users ADD COLUMN plan_expires_at DATETIME`); } catch(e) {}
try { db.exec(`CREATE TABLE IF NOT EXISTS listing_images (id INTEGER PRIMARY KEY AUTOINCREMENT, listing_id INTEGER NOT NULL, url TEXT NOT NULL, is_primary INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`); } catch(e) {}
try { db.exec(`CREATE TABLE IF NOT EXISTS billing (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, plan TEXT NOT NULL, amount INTEGER NOT NULL, period TEXT NOT NULL, started_at DATETIME NOT NULL, expires_at DATETIME NOT NULL, status TEXT DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`); } catch(e) {}

// Seed: Kossi Seller (seller@test.com) owns 10 listings, Ama Client is buyer
const listingCount = db.prepare('SELECT COUNT(*) as c FROM listings').get();
if (listingCount.c === 0) {
  const bcrypt = require('bcryptjs');
  const hash = bcrypt.hashSync('demo123', 10);

  // ── Seller: Kossi Seller — Standard plan (10 listings) ──
  const seller = db.prepare(
    `INSERT INTO users (name, email, password, role, plan, city) VALUES (?, ?, ?, ?, ?, ?)`
  ).run('Kossi Seller', 'seller@test.com', hash, 'seller', 'standard', 'Lomé');
  const sid = seller.lastInsertRowid;

  // ── Client: Ama Client — Basic plan (buyer) ──
  db.prepare(
    `INSERT INTO users (name, email, password, role, plan, city) VALUES (?, ?, ?, ?, ?, ?)`
  ).run('Ama Client', 'client@test.com', hash, 'buyer', 'basic', 'Lomé');

  // ── 10 listings all owned by Kossi Seller ──
  const ins = db.prepare(`INSERT INTO listings (title, description, category, price, price_type, city, is_remote, seller_id, seller_name, rating, num_reviews, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  [
    ['Expert Plumbing Repairs & Installation', 'Professional plumbing services including pipe installation, leak repairs, bathroom fitting, and emergency call-outs. Over 10 years of experience.', 'Plumbing', 15000, 'from', 'Lomé', 0, sid, 'Kossi Seller', 0, 0, 1],
    ['Mobile Barber — Fresh Cuts at Home', 'I come to you! Get a fresh cut, beard trim, or skin fade without leaving your home. Available 7 days a week across Lomé.', 'Barber', 5000, 'fixed', 'Lomé', 0, sid, 'Kossi Seller', 0, 0, 1],
    ['Math & Science Tutoring (Lycée level)', 'Specialising in mathematics and physical sciences for lycée students. Online sessions via video call. Exam preparation and homework help.', 'Tutoring', 8000, 'fixed', 'Remote', 1, sid, 'Kossi Seller', 0, 0, 1],
    ['Event & Wedding Photography', 'Capturing your most important moments. Weddings, traditional ceremonies, corporate events, portraits. Full day coverage available.', 'Photography', 75000, 'from', 'Lomé', 0, sid, 'Kossi Seller', 0, 0, 1],
    ['Laptop & Phone Repair', 'Fast and reliable repair service for all brands. Screen replacement, battery, software issues. Warranty on all repairs.', 'Tech', 10000, 'from', 'Sokodé', 0, sid, 'Kossi Seller', 0, 0, 1],
    ['Home Cleaning Service', 'Professional home and office cleaning. Bring all equipment. Weekly, bi-weekly or one-time service available.', 'Cleaning', 12000, 'fixed', 'Lomé', 0, sid, 'Kossi Seller', 0, 0, 1],
    ['Custom Tailoring & Traditional Wear', 'Expert tailoring for traditional and modern wear. Measurements taken at home. Ready in 5-7 days.', 'Tailoring', 20000, 'from', 'Kpalimé', 0, sid, 'Kossi Seller', 0, 0, 1],
    ['Website & Logo Design', 'Professional web design and branding. Responsive websites, logo packages, social media kits. Portfolio available on request.', 'Design', 50000, 'from', 'Remote', 1, sid, 'Kossi Seller', 0, 0, 1],
    ['AC Repair & Installation', 'Fast AC repair, gas refill, and new unit installation. Same-day emergency service available across Lomé.', 'Tech', 12000, 'from', 'Lomé', 0, sid, 'Kossi Seller', 0, 0, 0],
    ['Electrical Wiring Services', 'Safe and certified electrical wiring for homes and offices. New installations and fault repairs.', 'Tech', 25000, 'from', 'Lomé', 0, sid, 'Kossi Seller', 0, 0, 0],
  ].forEach(d => ins.run(...d));

  // ── Admin (permanent) ──
  db.prepare(
    `INSERT INTO users (name, email, password, role, city, plan, role_admin) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run('Admin', 'admin@togoconnect.com', hash, 'admin', 'Lomé', 'premium', 1);

  console.log('✅ Seeded: Kossi Seller | Ama Client | Admin (admin@togoconnect.com) | password: demo123');
}

// Always ensure admin account exists
const adminExists = db.prepare("SELECT id FROM users WHERE email='admin@togoconnect.com'").get();
if (!adminExists) {
  const bcrypt = require('bcryptjs');
  db.prepare(`INSERT INTO users (name,email,password,role,city,plan,role_admin,trust_score) VALUES (?,?,?,?,?,?,?,?)`)
    .run('Admin','admin@togoconnect.com', bcrypt.hashSync('demo123',10),'admin','Lomé','premium',1,100);
  console.log('✅ Admin account created: admin@togoconnect.com / demo123');
}

console.log('✅ SQLite database ready');
module.exports = db;
