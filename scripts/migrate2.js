const { Client } = require('pg')
const client = new Client({
  connectionString: 'postgresql://postgres:ePV9Zm7Dw9BKLQin@db.ezmbuyvabfikifhrndxy.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
})

const sql = `
alter table public.rifas add column if not exists tipo text not null default 'paga' check (tipo in ('paga','comercio'));
alter table public.rifas add column if not exists sorteo_metodo text not null default 'loteria' check (sorteo_metodo in ('loteria','automatico'));
alter table public.rifas add column if not exists loteria_fecha date;
alter table public.rifas add column if not exists loteria_numero integer;
alter table public.rifas add column if not exists precio_plan numeric(10,2);
`

client.connect()
  .then(() => client.query(sql))
  .then(() => { console.log('✓ Schema actualizado'); client.end() })
  .catch(e => { console.error('Error:', e.message); client.end(); process.exit(1) })
