const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// In-memory store for failed login attempts and lockout (for demo; use DB for production)
const loginAttempts = {};
const MAX_ATTEMPTS = 3;
const LOCKOUT_TIME = 5 * 60 * 1000; // 5 minutes in ms
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Missing token' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

router.post('/signup', async (req, res) => {
  const { email, password, role = 'user' } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  try {
    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({ message: 'User already exists.' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
      [email, password_hash, role]
    );
    res.status(201).json({ message: 'Signup successful.' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Login endpoint with rate-limiting
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }
  // Check lockout
  const attempt = loginAttempts[email];
  if (attempt && attempt.lockedUntil && Date.now() < attempt.lockedUntil) {
    const wait = Math.ceil((attempt.lockedUntil - Date.now()) / 1000);
    return res.status(429).json({ message: `Too many failed attempts. Try again in ${wait} seconds.` });
  }
  try {
    const userResult = await pool.query('SELECT id, password_hash, role FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      // Increment failed attempts
      loginAttempts[email] = attempt ? { count: attempt.count + 1, lockedUntil: attempt.lockedUntil } : { count: 1 };
      if (loginAttempts[email].count >= MAX_ATTEMPTS) {
        loginAttempts[email].lockedUntil = Date.now() + LOCKOUT_TIME;
      }
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    const user = userResult.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      loginAttempts[email] = attempt ? { count: attempt.count + 1, lockedUntil: attempt.lockedUntil } : { count: 1 };
      if (loginAttempts[email].count >= MAX_ATTEMPTS) {
        loginAttempts[email].lockedUntil = Date.now() + LOCKOUT_TIME;
      }
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    // Success: reset attempts
    delete loginAttempts[email];
    // Issue JWT
    const token = jwt.sign({ id: user.id, email, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ message: 'Login successful.', role: user.role, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// Users endpoint - accessible only to admins
router.get('/users', authenticateToken, async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  try {
    const result = await pool.query('SELECT id, email, role FROM users');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users.' });
  }
});

module.exports = router;
