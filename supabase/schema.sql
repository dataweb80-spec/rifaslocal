-- =============================================
-- RIFALOCAL — Schema inicial
-- =============================================

-- Extensiones
create extension if not exists "pgcrypto";

-- =============================================
-- USUARIOS / ORGANIZADORES
-- =============================================
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  nombre       text not null,
  email        text not null,
  telefono     text,
  mp_user_id   text,           -- ID de MercadoPago del organizador
  mp_email     text,           -- Email MP vinculado
  rol          text not null default 'organizador' check (rol in ('organizador', 'admin')),
  activo       boolean default true,
  created_at   timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "perfil propio" on public.profiles
  for all using (auth.uid() = id);

create policy "admin todo" on public.profiles
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and rol = 'admin')
  );

-- =============================================
-- RIFAS
-- =============================================
create table public.rifas (
  id              uuid primary key default gen_random_uuid(),
  organizador_id  uuid not null references public.profiles(id),
  titulo          text not null,
  descripcion     text,
  imagen_url      text,
  precio_numero   numeric(10,2) not null check (precio_numero > 0),
  cantidad_numeros integer not null check (cantidad_numeros between 10 and 1000),
  estado          text not null default 'borrador'
                    check (estado in ('borrador','activa','llena','sorteando','finalizada','cancelada')),
  ganador_numero  integer,
  ganador_id      uuid references public.profiles(id),
  fecha_limite    timestamptz,        -- opcional: límite para llenarse
  sorteo_en       timestamptz,        -- cuándo se realizó el sorteo
  slug            text unique not null,
  terminos_ok     boolean default false,  -- organizador aceptó T&C
  comision_plat   numeric(5,4) default 0.10,  -- 10% plataforma
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.rifas enable row level security;

create policy "rifas publicas activas" on public.rifas
  for select using (estado in ('activa','llena','sorteando','finalizada'));

create policy "organizador gestiona sus rifas" on public.rifas
  for all using (auth.uid() = organizador_id);

create policy "admin todo rifas" on public.rifas
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and rol = 'admin')
  );

-- =============================================
-- NÚMEROS DE RIFA
-- =============================================
create table public.numeros_rifa (
  id          uuid primary key default gen_random_uuid(),
  rifa_id     uuid not null references public.rifas(id) on delete cascade,
  numero      integer not null,
  estado      text not null default 'disponible'
                check (estado in ('disponible','reservado','pagado')),
  comprador_id uuid references public.profiles(id),
  comprador_nombre text,    -- por si compran sin cuenta
  comprador_tel    text,
  mp_preference_id text,   -- ID preferencia MP
  mp_payment_id    text,   -- ID pago MP confirmado
  monto_pagado     numeric(10,2),
  reservado_en     timestamptz,
  pagado_en        timestamptz,
  created_at       timestamptz default now(),
  unique(rifa_id, numero)
);

alter table public.numeros_rifa enable row level security;

create policy "numeros publicos" on public.numeros_rifa
  for select using (true);

create policy "comprador ve sus numeros" on public.numeros_rifa
  for select using (auth.uid() = comprador_id);

create policy "sistema inserta numeros" on public.numeros_rifa
  for insert with check (true);  -- solo vía API con service_role

-- =============================================
-- PAGOS / COMISIONES
-- =============================================
create table public.pagos (
  id                uuid primary key default gen_random_uuid(),
  numero_id         uuid not null references public.numeros_rifa(id),
  rifa_id           uuid not null references public.rifas(id),
  mp_payment_id     text unique not null,
  monto_total       numeric(10,2) not null,
  comision_plat     numeric(10,2) not null,
  monto_organizador numeric(10,2) not null,
  estado_mp         text not null,  -- approved, pending, rejected
  mp_split_status   text,           -- estado del split/transfer
  created_at        timestamptz default now()
);

alter table public.pagos enable row level security;

create policy "admin ve pagos" on public.pagos
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and rol = 'admin')
  );

create policy "organizador ve sus pagos" on public.pagos
  for select using (
    exists (
      select 1 from public.rifas r
      where r.id = rifa_id and r.organizador_id = auth.uid()
    )
  );

-- =============================================
-- TÉRMINOS Y CONDICIONES ACEPTADOS
-- =============================================
create table public.aceptaciones_tyc (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id),
  version     text not null default '1.0',
  ip          text,
  user_agent  text,
  aceptado_en timestamptz default now()
);

-- =============================================
-- FUNCIÓN: generar números al crear rifa
-- =============================================
create or replace function public.generar_numeros_rifa(p_rifa_id uuid, p_cantidad integer)
returns void language plpgsql security definer as $$
declare
  i integer;
begin
  for i in 1..p_cantidad loop
    insert into public.numeros_rifa (rifa_id, numero)
    values (p_rifa_id, i)
    on conflict do nothing;
  end loop;
end;
$$;

-- =============================================
-- FUNCIÓN: sortear ganador (solo admin/sistema)
-- =============================================
create or replace function public.ejecutar_sorteo(p_rifa_id uuid)
returns integer language plpgsql security definer as $$
declare
  v_ganador    integer;
  v_cantidad   integer;
begin
  select cantidad_numeros into v_cantidad from public.rifas where id = p_rifa_id;

  -- Ganador aleatorio entre números pagados
  select numero into v_ganador
  from public.numeros_rifa
  where rifa_id = p_rifa_id and estado = 'pagado'
  order by random()
  limit 1;

  if v_ganador is null then
    raise exception 'No hay números pagados para sortear';
  end if;

  update public.rifas
  set estado = 'finalizada',
      ganador_numero = v_ganador,
      sorteo_en = now(),
      ganador_id = (
        select comprador_id from public.numeros_rifa
        where rifa_id = p_rifa_id and numero = v_ganador
      )
  where id = p_rifa_id;

  return v_ganador;
end;
$$;

-- =============================================
-- UPDATED_AT automático
-- =============================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger rifas_updated_at before update on public.rifas
  for each row execute function public.set_updated_at();
