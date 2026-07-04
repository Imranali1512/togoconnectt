require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

require('./db/database');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/listings', require('./routes/listings'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/trust', require('./routes/trust'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/reports', require('./routes/reports'));

app.get('/', (req, res) => res.json({ message: 'TogoConnect API running', db: 'SQLite' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`\n Server running on http://localhost:${PORT}\n`));
