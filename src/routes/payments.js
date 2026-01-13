const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middlewares/auth');

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM payments ORDER BY id');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM payments WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// POST /bookings/:bookingId/payment → create payment for a booking
router.post('/bookings/:bookingId/payment', auth, async (req, res, next) => {
  try {
    const { amount, method } = req.body;
    const { rows } = await db.query('INSERT INTO payments(booking_id, amount, method) VALUES($1,$2,$3) RETURNING *', [req.params.bookingId, amount, method]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

// GET /payments/:id/booking → booking + customer info for this payment
router.get('/:id/booking', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT p.*, b.*, c.id as customer_id, c.name as customer_name, c.email as customer_email
       FROM payments p JOIN bookings b ON p.booking_id=b.id LEFT JOIN customers c ON b.customer_id=c.id WHERE p.id=$1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
