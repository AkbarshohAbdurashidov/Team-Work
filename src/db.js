
const { Pool } = require('pg');
const path = require('path');
// Load .env from project root when running from subfolders (robust for different CWDs)
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

function asString(v) {
  if (v === undefined || v === null) return undefined;
  return String(v).trim();
}

function stripQuotes(v) {
  if (typeof v !== 'string') return v;
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  return v;
}

const connectionString = asString(process.env.DATABASE_URL || process.env.DB_DATABASE_URL);
const host = asString(process.env.PGHOST || process.env.DB_HOST || process.env.DBHOST);
const user = asString(process.env.PGUSER || process.env.DB_USER || process.env.DBUSER);
let password = asString(process.env.PGPASSWORD || process.env.DB_PASSWORD || process.env.DBPASSWORD);
if (password !== undefined) password = stripQuotes(password);
const database = asString(process.env.PGDATABASE || process.env.DB_NAME || process.env.DBDATABASE);
const portEnv = process.env.PGPORT || process.env.DB_PORT || process.env.DBPORT;
const port = portEnv ? Number(asString(portEnv)) : undefined;

// debug info (safe): show presence, not actual secrets
if (process.env.NODE_ENV !== 'production') {
  console.log('DB config:', {
    connectionString: connectionString ? '<<present>>' : undefined,
    host, user, password: password ? '<<present>>' : undefined, database, port
  });
}

const pool = new Pool({
  connectionString: connectionString ? stripQuotes(connectionString) : undefined,
  host: host ? stripQuotes(host) : undefined,
  user: user ? stripQuotes(user) : undefined,
  password: password !== undefined && password !== null ? String(password) : undefined,
  database: database ? stripQuotes(database) : undefined,
  port: port ? Number(port) : undefined,
  ssl: (function(){
    const envSsl = asString(process.env.DB_SSL || process.env.PGSSLMODE || '');
    const needSsl = envSsl === 'true' || envSsl === 'require' || /render/i.test(host || '') || /sslmode=require/i.test(connectionString || '');
    return needSsl ? { rejectUnauthorized: false } : undefined;
  })(),
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
