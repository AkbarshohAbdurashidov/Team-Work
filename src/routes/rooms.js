const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middlewares/auth');

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM rooms ORDER BY id');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT r.*, rt.id as room_type_id, rt.name as room_type_name, rt.description as room_type_description
       FROM rooms r LEFT JOIN room_types rt ON r.room_type_id = rt.id WHERE r.id=$1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const { number, room_type_id, price } = req.body;
    const { rows } = await db.query(
      'INSERT INTO rooms(number, room_type_id, price) VALUES($1,$2,$3) RETURNING *',
      [number, room_type_id, price]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    const { number, room_type_id, price } = req.body;
    const { rows } = await db.query(
      'UPDATE rooms SET number=$1, room_type_id=$2, price=$3 WHERE id=$4 RETURNING *',
      [number, room_type_id, price, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    await db.query('DELETE FROM rooms WHERE id=$1', [req.params.id]);
    res.status(204).end();
  } catch (err) { next(err); }
});

// GET /rooms/:id/reviews → all reviews for this room with customer info
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT rv.*, c.id as customer_id, c.name as customer_name, c.email as customer_email
       FROM reviews rv LEFT JOIN customers c ON rv.customer_id = c.id WHERE rv.room_id=$1 ORDER BY rv.created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /rooms/:id/bookings → all bookings for this room with customer info
router.get('/:id/bookings', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT b.*, c.id as customer_id, c.name as customer_name, c.email as customer_email
       FROM room_bookings rb
       JOIN bookings b ON rb.booking_id = b.id
       LEFT JOIN customers c ON b.customer_id = c.id
       WHERE rb.room_id = $1 ORDER BY b.start_date DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
