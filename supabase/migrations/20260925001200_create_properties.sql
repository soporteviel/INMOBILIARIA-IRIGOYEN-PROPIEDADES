-- Propiedades de Noelia Irigoyen.
-- Proyecto exclusivo: beymsocusbarjwolyrlz.
-- Ejecutar el archivo completo, una sola vez, en el SQL Editor de ESE proyecto.
-- Va dentro de una transacción: si algo falla, no queda aplicada a medias.
-- Se puede repetir: no borra filas ni recrea la tabla.
-- No importa las propiedades ni las fotos de muestra.
-- Las fotos quedan para una etapa posterior (no hay columna de imágenes).

begin;

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  description text,
  location text,
  location_precision text,
  property_type text,
  operation text,
  price numeric(14, 2),
  currency text,
  price_on_request boolean not null default false,
  price_period text,
  bedrooms integer,
  bathrooms integer,
  rooms integer,
  garage integer,
  covered_area_m2 numeric(10, 2),
  total_area_m2 numeric(10, 2),
  land_area_m2 numeric(10, 2),
  features text[] not null default '{}',
  status text not null default 'BORRADOR',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.properties is
  'Fichas inmobiliarias. El precio nulo con price_on_request distingue Consultar de un monto. NULL en medidas significa dato desconocido; 0 es un cero real.';

comment on column public.properties.slug is
  'Identificador público estable. No se regenera al editar el título. No puede ser vacío ni solo espacios.';

comment on column public.properties.title is
  'Obligatorio también en borradores. No puede ser vacío ni solo espacios.';

comment on column public.properties.price is
  'Monto decimal. Nulo si no hay precio o si la ficha dice Consultar. Nunca usar 0 para Consultar.';

comment on column public.properties.featured is
  'Destacada, independiente del estado. La web pública todavía no lee esta tabla.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'properties_title_not_blank'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_title_not_blank
      check (length(btrim(title)) > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'properties_slug_not_blank'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_slug_not_blank
      check (length(btrim(slug)) > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'properties_location_precision'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_location_precision
      check (location_precision is null or location_precision in ('exact', 'approximate'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'properties_type'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_type
      check (property_type is null or property_type in ('Casa', 'Departamento', 'PH', 'Local', 'Lote'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'properties_operation'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_operation
      check (operation is null or operation in ('Venta', 'Alquiler', 'Temporal'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'properties_currency'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_currency
      check (currency is null or currency in ('ARS', 'USD'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'properties_price_period'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_price_period
      check (price_period is null or price_period in ('mes', 'semana', 'dia', 'temporada'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'properties_status'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_status
      check (status in ('BORRADOR', 'PUBLICADA', 'PAUSADA'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'properties_price_positive'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_price_positive
      check (price is null or price > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'properties_price_shape'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_price_shape
      check (
        (
          price_on_request = true
          and price is null
          and currency is null
        )
        or (
          price_on_request = false
          and (
            (price is null and currency is null)
            or (price is not null and currency is not null)
          )
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'properties_measures_nonnegative'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_measures_nonnegative
      check (
        (bedrooms is null or bedrooms >= 0)
        and (bathrooms is null or bathrooms >= 0)
        and (rooms is null or rooms >= 0)
        and (garage is null or garage >= 0)
        and (covered_area_m2 is null or covered_area_m2 >= 0)
        and (total_area_m2 is null or total_area_m2 >= 0)
        and (land_area_m2 is null or land_area_m2 >= 0)
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'properties_published_minimum'
      and conrelid = 'public.properties'::regclass
  ) then
    alter table public.properties
      add constraint properties_published_minimum
      check (
        status <> 'PUBLICADA'
        or (
          length(btrim(title)) > 0
          and location is not null
          and length(btrim(location)) > 0
          and property_type is not null
          and operation is not null
          and (
            price_on_request = true
            or (price is not null and currency is not null)
          )
          and (
            operation = 'Venta'
            or price_on_request = true
            or price_period is not null
          )
        )
      );
  end if;
end $$;

create unique index if not exists properties_slug_key on public.properties (slug);

create index if not exists properties_admin_list_idx
  on public.properties (status, updated_at desc);

create index if not exists properties_published_idx
  on public.properties (updated_at desc)
  where status = 'PUBLICADA';

create or replace function public.set_properties_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function public.set_properties_updated_at() from public, anon;
grant execute on function public.set_properties_updated_at() to authenticated;

drop trigger if exists properties_set_updated_at on public.properties;
create trigger properties_set_updated_at
before update on public.properties
for each row
execute function public.set_properties_updated_at();

alter table public.properties enable row level security;

drop policy if exists properties_public_read on public.properties;
create policy properties_public_read
on public.properties
for select
to anon, authenticated
using (status = 'PUBLICADA');

drop policy if exists properties_admin_read on public.properties;
create policy properties_admin_read
on public.properties
for select
to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists properties_admin_insert on public.properties;
create policy properties_admin_insert
on public.properties
for insert
to authenticated
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists properties_admin_update on public.properties;
create policy properties_admin_update
on public.properties
for update
to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists properties_admin_delete on public.properties;
create policy properties_admin_delete
on public.properties
for delete
to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

revoke all on table public.properties from public, anon, authenticated;
grant select on table public.properties to anon;
grant select, insert, update, delete on table public.properties to authenticated;

commit;
