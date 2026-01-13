const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middlewares/auth');

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM reviews ORDER BY id');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT rv.*, r.id as room_id, r.number as room_number, c.id as customer_id, c.name as customer_name
       FROM reviews rv
       LEFT JOIN rooms r ON rv.room_id = r.id
       LEFT JOIN customers c ON rv.customer_id = c.id
       WHERE rv.id=$1`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

// POST /rooms/:roomId/reviews → add review for a room by a customer
router.post('/rooms/:roomId/reviews', auth, async (req, res, next) => {
  try {
    const { customer_id, rating, comment } = req.body;
    const { rows } = await db.query('INSERT INTO reviews(room_id, customer_id, rating, comment) VALUES($1,$2,$3,$4) RETURNING *', [req.params.roomId, customer_id, rating, comment]);
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', auth, async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const { rows } = await db.query('UPDATE reviews SET rating=$1, comment=$2 WHERE id=$3 RETURNING *', [rating, comment, req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', auth, async (req, res, next) => {
  try {
    await db.query('DELETE FROM reviews WHERE id=$1', [req.params.id]);
    res.status(204).end();
  } catch (err) { next(err); }
});

// GET /rooms/:roomId/reviews is already covered in rooms route
// GET /customers/:customerId/reviews is covered in customers route

module.exports = router;
