const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM room_types ORDER BY id');
    res.json(rows);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM room_types WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const { rows } = await db.query(
      'INSERT INTO room_types(name, description) VALUES($1,$2) RETURNING *',
      [name, description]
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const { rows } = await db.query(
      'UPDATE room_types SET name=$1, description=$2 WHERE id=$3 RETURNING *',
      [name, description, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await db.query('DELETE FROM room_types WHERE id=$1', [req.params.id]);
    res.status(204).end();
  } catch (err) { next(err); }
});

// Join endpoint: all rooms of a specific room type
router.get('/:id/rooms', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM rooms WHERE room_type_id=$1 ORDER BY id', [req.params.id]);
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
