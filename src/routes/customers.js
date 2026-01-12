const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM customers ORDER BY id');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM customers WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { fullname, phone } = req.body;
    const hashPhone = await bcrypt.hash(phone)
    if (!fullname || !phone) return res.status(400).json({ error: 'name and email required' });
    const { rows } = await db.query('INSERT INTO customers(fullname,phone) VALUES($1,$2) RETURNING *', [fullname, hashPhone]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const { rows } = await db.query('UPDATE customers SET name=$1, email=$2 WHERE id=$3 RETURNING *', [name, email, req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM customers WHERE id=$1', [req.params.id]);
    res.status(204).end();
  } catch (err) { next(err); }
});

// GET /customers/:id/bookings → all bookings of the customer with rooms info
router.get('/:id/bookings', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT b.*, rb.room_id, r.number as room_number, r.price as room_price
       FROM bookings b
       LEFT JOIN room_bookings rb ON b.id = rb.booking_id
       LEFT JOIN rooms r ON rb.room_id = r.id
       WHERE b.customer_id=$1 ORDER BY b.start_date DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /customers/:id/reviews → reviews by customer with room info
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT rv.*, r.id as room_id, r.number as room_number
       FROM reviews rv LEFT JOIN rooms r ON rv.room_id = r.id
       WHERE rv.customer_id = $1 ORDER BY rv.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
