const pool = require('../config/db');

exports.getAll = async (_, res) => {
  const { rows } = await pool.query('SELECT * FROM customers');
  res.json(rows);
};

exports.getOne = async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM customers WHERE id=$1',
    [req.params.id]
  );
  res.json(rows[0]);
};

exports.create = async (req, res) => {
  const { full_name, email, phone } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO customers(full_name,email,phone)
     VALUES($1,$2,$3) RETURNING *`,
    [full_name, email, phone]
  );
  res.status(201).json(rows[0]);
};

exports.update = async (req, res) => {
  const { full_name, email, phone } = req.body;
  const { rows } = await pool.query(
    `UPDATE customers SET full_name=$1,email=$2,phone=$3
     WHERE id=$4 RETURNING *`,
    [full_name, email, phone, req.params.id]
  );
  res.json(rows[0]);
};

exports.remove = async (req, res) => {
  await pool.query('DELETE FROM customers WHERE id=$1', [req.params.id]);
  res.sendStatus(204);
};
