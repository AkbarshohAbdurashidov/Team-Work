const pool = require('../config/db');

exports.getAll = async (_, res) => {
  const { rows } = await pool.query('SELECT * FROM room_types');
  res.json(rows);
};

exports.getOne = async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM room_types WHERE id=$1',
    [req.params.id]
  );
  res.json(rows[0]);
};

exports.create = async (req, res) => {
  const { name, description } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO room_types(name, description) VALUES($1,$2) RETURNING *',
    [name, description]
  );
  res.status(201).json(rows[0]);
};

exports.update = async (req, res) => {
  const { name, description } = req.body;
  const { rows } = await pool.query(
    'UPDATE room_types SET name=$1, description=$2 WHERE id=$3 RETURNING *',
    [name, description, req.params.id]
  );
  res.json(rows[0]);
};

exports.remove = async (req, res) => {
  await pool.query('DELETE FROM room_types WHERE id=$1', [req.params.id]);
  res.sendStatus(204);
};

/* JOIN */
exports.getRoomsByType = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT r.* FROM rooms r WHERE r.room_type_id=$1`,
    [req.params.id]
  );
  res.json(rows);
};
