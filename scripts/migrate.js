const { Client } = require('pg')

const client = new Client({
  connectionString: 'postgresql://postgres:ePV9Zm7Dw9BKLQin@db.ezmbuyvabfikifhrndxy.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
})

const sql = `
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  nombre       text not null,
  email        text not null,
  telefono     text,
  mp_user_id   text,
  mp_email     text,
  rol          text not null default 'organizador' check (rol in ('organizador', 'admin')),
  activo       boolean default true,
  created_at   timestamptz default now()
);
alter table public.profiles enable row level security;
do $d$ begin
  create policy "perfil propio" on public.profiles for all using (auth.uid() = id);
exception when duplicate_object then null; end $d$;

create table if not exists public.rifas (
  id              uuid primary key default gen_random_uuid(),
  organizador_id  uuid references public.profiles(id),
  titulo          text not null,
  descripcion     text,
  imagen_url      text,
  precio_numero   numeric(10,2) not null check (precio_numero > 0),
  cantidad_numeros integer not null check (cantidad_numeros between 10 and 1000),
  estado          text not null default 'borrador'
                    check (estado in ('borrador','activa','llena','sorteando','finalizada','cancelada')),
  ganador_numero  integer,
  ganador_id      uuid references public.profiles(id),
  fecha_limite    timestamptz,
  sorteo_en       timestamptz,
  slug            text unique not null,
  terminos_ok     boolean default false,
  comision_plat   numeric(5,4) default 0.10,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);
alter table public.rifas enable row level security;
do $d$ begin
  create policy "rifas publicas" on public.rifas for select using (estado in ('activa','llena','sorteando','finalizada'));
exception when duplicate_object then null; end $d$;
do $d$ begin
  create policy "service todo rifas" on public.rifas for all using (true) with check (true);
exception when duplicate_object then null; end $d$;

create table if not exists public.numeros_rifa (
  id               uuid primary key default gen_random_uuid(),
  rifa_id          uuid not null references public.rifas(id) on delete cascade,
  numero           integer not null,
  estado           text not null default 'disponible' check (estado in ('disponible','reservado','pagado')),
  comprador_id     uuid references public.profiles(id),
  comprador_nombre text,
  comprador_tel    text,
  mp_preference_id text,
  mp_payment_id    text,
  monto_pagado     numeric(10,2),
  reservado_en     timestamptz,
  pagado_en        timestamptz,
  created_at       timestamptz default now(),
  unique(rifa_id, numero)
);
alter table public.numeros_rifa enable row level security;
do $d$ begin
  create policy "numeros publicos" on public.numeros_rifa for select using (true);
exception when duplicate_object then null; end $d$;
do $d$ begin
  create policy "service todo numeros" on public.numeros_rifa for all using (true) with check (true);
exception when duplicate_object then null; end $d$;

create table if not exists public.pagos (
  id                uuid primary key default gen_random_uuid(),
  numero_id         uuid references public.numeros_rifa(id),
  rifa_id           uuid not null references public.rifas(id),
  mp_payment_id     text unique not null,
  monto_total       numeric(10,2) not null,
  comision_plat     numeric(10,2) not null,
  monto_organizador numeric(10,2) not null,
  estado_mp         text not null,
  mp_split_status   text,
  created_at        timestamptz default now()
);
alter table public.pagos enable row level security;
do $d$ begin
  create policy "service todo pagos" on public.pagos for all using (true) with check (true);
exception when duplicate_object then null; end $d$;

create table if not exists public.aceptaciones_tyc (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id),
  version     text not null default '1.0',
  ip          text,
  user_agent  text,
  aceptado_en timestamptz default now()
);

create or replace function public.generar_numeros_rifa(p_rifa_id uuid, p_cantidad integer)
returns void language plpgsql security definer as $$
declare i integer;
begin
  for i in 1..p_cantidad loop
    insert into public.numeros_rifa (rifa_id, numero) values (p_rifa_id, i) on conflict do nothing;
  end loop;
end;
$$;

create or replace function public.ejecutar_sorteo(p_rifa_id uuid)
returns integer language plpgsql security definer as $$
declare v_ganador integer;
begin
  select numero into v_ganador from public.numeros_rifa
  where rifa_id = p_rifa_id and estado = 'pagado' order by random() limit 1;
  if v_ganador is null then raise exception 'No hay numeros pagados'; end if;
  update public.rifas set estado='finalizada', ganador_numero=v_ganador, sorteo_en=now(),
    ganador_id=(select comprador_id from public.numeros_rifa where rifa_id=p_rifa_id and numero=v_ganador)
  where id=p_rifa_id;
  return v_ganador;
end;
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists rifas_updated_at on public.rifas;
create trigger rifas_updated_at before update on public.rifas for each row execute function public.set_updated_at();
`

async function run() {
  try {
    await client.connect()
    console.log('✓ Conectado a Supabase')
    await client.query(sql)
    console.log('✓ Schema aplicado')
    console.log('  Tablas: profiles, rifas, numeros_rifa, pagos, aceptaciones_tyc')
    console.log('  Funciones: generar_numeros_rifa, ejecutar_sorteo')
    console.log('  Triggers: rifas_updated_at')
  } catch (err) {
    console.error('✗ Error:', err.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
