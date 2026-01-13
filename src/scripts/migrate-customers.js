const db = require('../db');

async function migrate() {
  try {
    // add fullname if missing
    await db.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS fullname TEXT`);
    // add phone if missing
    await db.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone TEXT`);
    // try to make phone unique (will fail if duplicates exist) — use a safe check
    try {
      await db.query(`ALTER TABLE customers ADD CONSTRAINT customers_phone_unique UNIQUE (phone)`);
    } catch (e) {
      // ignore unique constraint errors
    }

    // If old 'name' column exists, copy to fullname where fullname is null
    const { rows: nameCol } = await db.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='customers' AND column_name='name'`
    );
    if (nameCol.length) {
      await db.query(`UPDATE customers SET fullname = name WHERE fullname IS NULL AND name IS NOT NULL`);
      console.log('Copied `name` → `fullname` for existing rows');
    }

    // If old 'email' column exists, copy to phone where phone is null
    const { rows: emailCol } = await db.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='customers' AND column_name='email'`
    );
    if (emailCol.length) {
      await db.query(`UPDATE customers SET phone = email WHERE phone IS NULL AND email IS NOT NULL`);
      console.log('Copied `email` → `phone` for existing rows (note: values are not hashed)');
    }

    console.log('Migration complete');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed', err);
    process.exit(1);
  }
}

migrate();
