const pool = require('../config/db');

exports.getAll = async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM rooms');
  res.json(rows);
};

exports.getOne = async (req, res) => {
  const { rows } = await pool.query(
    `SELECT r.*, rt.name AS room_type
     FROM rooms r
     JOIN room_types rt ON r.room_type_id = rt.id
     WHERE r.id=$1`,
    [req.params.id]
  );
  res.json(rows[0]);
};

exports.create = async (req, res) => {
  const { room_number, price, room_type_id } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO rooms(room_number, price, room_type_id)
     VALUES($1,$2,$3) RETURNING *`,
    [room_number, price, room_type_id]
  );
  res.status(201).json(rows[0]);
};

exports.update = async (req, res) => {
  const { room_number, price, room_type_id } = req.body;
  const { rows } = await pool.query(
    `UPDATE rooms SET room_number=$1, price=$2, room_type_id=$3
     WHERE id=$4 RETURNING *`,
    [room_number, price, room_type_id, req.params.id]
  );
  res.json(rows[0]);
};

exports.remove = async (req, res) => {
  await pool.query('DELETE FROM rooms WHERE id=$1', [req.params.id]);
  res.sendStatus(204);
};
