const { Client } = require('pg')
const client = new Client({
  connectionString: 'postgresql://postgres:ePV9Zm7Dw9BKLQin@db.ezmbuyvabfikifhrndxy.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
})

const sql = `
alter table public.rifas add column if not exists mp_alias text;
alter table public.rifas add column if not exists tel_organizador text;
`

client.connect()
  .then(() => client.query(sql))
  .then(() => { console.log('✓ mp_alias y tel_organizador agregados'); client.end() })
  .catch(e => { console.error('Error:', e.message); client.end(); process.exit(1) })
