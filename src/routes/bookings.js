const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /bookings → all bookings
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM bookings ORDER BY id');
    res.json(rows);
  } catch (err) { next(err); }
});

// GET /bookings/:id → single booking with customer and room info
router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT b.*, c.id as customer_id, c.name as customer_name, c.email as customer_email
       FROM bookings b LEFT JOIN customers c ON b.customer_id = c.id WHERE b.id=$1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });

    // fetch rooms
    const rooms = await db.query(
      `SELECT r.* FROM room_bookings rb JOIN rooms r ON rb.room_id=r.id WHERE rb.booking_id=$1`,
      [req.params.id]
    );
    const result = rows[0];
    result.rooms = rooms.rows;
    res.json(result);
  } catch (err) { next(err); }
});

// POST /bookings → create booking with multiple rooms
router.post('/', async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { customer_id, start_date, end_date, room_ids = [] } = req.body;
    await client.query('BEGIN');
    const insertBooking = await client.query(
      'INSERT INTO bookings(customer_id, start_date, end_date) VALUES($1,$2,$3) RETURNING *',
      [customer_id, start_date, end_date]
    );
    const booking = insertBooking.rows[0];
    for (const room_id of room_ids) {
      await client.query('INSERT INTO room_bookings(booking_id, room_id) VALUES($1,$2)', [booking.id, room_id]);
    }
    await client.query('COMMIT');
    res.status(201).json(booking);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
});

// PUT /bookings/:id → update booking or assigned rooms
router.put('/:id', async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    const { customer_id, start_date, end_date, room_ids } = req.body;
    await client.query('BEGIN');
    const { rows } = await client.query('UPDATE bookings SET customer_id=$1, start_date=$2, end_date=$3 WHERE id=$4 RETURNING *', [customer_id, start_date, end_date, req.params.id]);
    if (!rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Not found' }); }
    if (Array.isArray(room_ids)) {
      await client.query('DELETE FROM room_bookings WHERE booking_id=$1', [req.params.id]);
      for (const room_id of room_ids) {
        await client.query('INSERT INTO room_bookings(booking_id, room_id) VALUES($1,$2)', [req.params.id, room_id]);
      }
    }
    await client.query('COMMIT');
    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
});

// DELETE /bookings/:id → delete booking and associated room_bookings
router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM bookings WHERE id=$1', [req.params.id]);
    res.status(204).end();
  } catch (err) { next(err); }
});

// POST /bookings/:bookingId/rooms/:roomId → assign a room to a booking
router.post('/:bookingId/rooms/:roomId', async (req, res, next) => {
  try {
    await db.query('INSERT INTO room_bookings(booking_id, room_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [req.params.bookingId, req.params.roomId]);
    res.status(201).end();
  } catch (err) { next(err); }
});

// DELETE /bookings/:bookingId/rooms/:roomId → remove a room from a booking
router.delete('/:bookingId/rooms/:roomId', async (req, res, next) => {
  try {
    await db.query('DELETE FROM room_bookings WHERE booking_id=$1 AND room_id=$2', [req.params.bookingId, req.params.roomId]);
    res.status(204).end();
  } catch (err) { next(err); }
});

// GET /bookings/:id/payment → payment info for this booking
router.get('/:id/payment', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM payments WHERE booking_id=$1', [req.params.id]);
    res.json(rows[0] || null);
  } catch (err) { next(err); }
});

module.exports = router;
