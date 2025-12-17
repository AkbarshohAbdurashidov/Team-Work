
const { Pool } = require('pg');
require('dotenv').config();

function stripQuotes(v) {
  if (typeof v !== 'string') return v;
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  return v;
}

const connectionString = process.env.DATABASE_URL || process.env.DB_DATABASE_URL;
const host = process.env.PGHOST || process.env.DB_HOST || process.env.DBHOST;
const user = process.env.PGUSER || process.env.DB_USER || process.env.DBUSER;
let password = process.env.PGPASSWORD || process.env.DB_PASSWORD || process.env.DBPASSWORD;
password = stripQuotes(password);
const database = process.env.PGDATABASE || process.env.DB_NAME || process.env.DBDATABASE;
const port = process.env.PGPORT || process.env.DB_PORT || process.env.DBPORT;

const pool = new Pool({
  connectionString: connectionString ? stripQuotes(connectionString) : undefined,
  host: host ? stripQuotes(host) : undefined,
  user: user ? stripQuotes(user) : undefined,
  password: password !== undefined && password !== null ? String(password) : undefined,
  database: database ? stripQuotes(database) : undefined,
  port: port ? Number(port) : undefined,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
