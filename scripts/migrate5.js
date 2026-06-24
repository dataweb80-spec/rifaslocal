const { Client } = require('pg')
const client = new Client({
  connectionString: 'postgresql://postgres:ePV9Zm7Dw9BKLQin@db.ezmbuyvabfikifhrndxy.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
})

const sql = `
alter table public.rifas add column if not exists comprobante_pago_url text;
`

client.connect()
  .then(() => client.query(sql))
  .then(() => { console.log('✓ Columna comprobante_pago_url agregada'); client.end() })
  .catch(e => { console.error('Error:', e.message); client.end(); process.exit(1) })
