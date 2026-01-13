const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// POST /auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'phone required' });

    // customers store hashed phone in `phone` column (see customers POST)
    // only select rows where phone is present to avoid compare errors
    const { rows } = await db.query('SELECT id, fullname, phone FROM customers WHERE phone IS NOT NULL');
    let user = null;
    for (const r of rows) {
      if (!r.phone) continue;
      try {
        const ok = await bcrypt.compare(String(phone), r.phone);
        if (ok) { user = r; break; }
      } catch (e) {
        console.error('bcrypt.compare failed for customer id', r.id, e && e.message);
        continue;
      }
    }
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const secret = process.env.JWT_SECRET || 'secret';
    const jwtOptions = {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: process.env.JWT_ISSUER || 'team-work',
      audience: process.env.JWT_AUDIENCE || 'team-work-users',
      algorithm: 'HS256',
    };
    const token = jwt.sign({ id: user.id, fullname: user.fullname }, secret, jwtOptions);
    res.json({ token, user: { id: user.id, fullname: user.fullname } });
  } catch (err) { console.error('Auth login error', err); next(err); }
});

module.exports = router;
