const db = require('../db')
const bcrypt = require('bcrypt')

async function seed() {
  try {
    // change these values as you like
    const fullname = 'Test User'
    const phonePlain = '12345'
    const hash = await bcrypt.hash(String(phonePlain), 10)

    const { rows } = await db.query('INSERT INTO customers(fullname, phone) VALUES($1,$2) ON CONFLICT (phone) DO NOTHING RETURNING *', [fullname, hash])
    if (rows[0]) console.log('Inserted user:', rows[0])
    else console.log('User already exists (or insert skipped)')
    process.exit(0)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

seed()
