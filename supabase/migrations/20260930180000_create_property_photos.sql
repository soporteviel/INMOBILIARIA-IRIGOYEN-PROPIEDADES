-- Fotos privadas de las propiedades de Noelia Irigoyen.
-- Proyecto exclusivo: beymsocusbarjwolyrlz.
-- Bucket R2: noelia-irigoyen-assets. Esta migración no toca almacenamiento.
-- Ejecutar el archivo completo, una sola vez, en el SQL Editor de ESE proyecto.
-- No borra propiedades ni fotos. Se puede repetir.
--
-- Limpieza de cargas abandonadas: una fila queda en "pending" hasta que el
-- servidor valida y guarda la imagen. Al abrir Fotos, las pendientes con más
-- de 1 hora pasan a "deleting" y recién ahí se intenta borrar el objeto en R2.
-- Si R2 falla, la fila y object_key quedan para reintentar, y no se muestran.
-- Borrar una propiedad marca sus fotos como "deleting" antes de tocar R2.
-- La ficha se borra solo cuando ya no quedan filas. Borrarla solo con SQL
-- deja los archivos en el bucket.
-- El máximo de 20 (pending + ready) lo impone un trigger, también en INSERT
-- o UPDATE directos y al cambiar property_id. "deleting" no ocupa cupo.

begin;

create table if not exists public.property_photos (
  id uuid primary key,
  property_id uuid not null references public.properties (id) on delete cascade,
  object_key text not null,
  position integer not null,
  width integer,
  height integer,
  byte_size integer,
  status text not null default 'pending',
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.property_photos is
  'Fotos del admin. object_key es la clave en R2, nunca una URL firmada. pending y ready cuentan para el límite de 20. deleting conserva la clave para reintentar y no se muestra. Sin lectura pública.';

comment on column public.property_photos.object_key is
  'Clave del objeto en el bucket privado. La genera el servidor. No guardar URLs firmadas.';

comment on column public.property_photos.is_cover is
  'Como máximo una portada por propiedad, y solo si la foto ya está lista.';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'property_photos_object_key_not_blank'
      and conrelid = 'public.property_photos'::regclass
  ) then
    alter table public.property_photos
      add constraint property_photos_object_key_not_blank
      check (length(btrim(object_key)) > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'property_photos_position_positive'
      and conrelid = 'public.property_photos'::regclass
  ) then
    alter table public.property_photos
      add constraint property_photos_position_positive
      check (position > 0);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'property_photos_status'
      and conrelid = 'public.property_photos'::regclass
  ) then
    alter table public.property_photos
      add constraint property_photos_status
      check (status in ('pending', 'ready', 'deleting'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'property_photos_ready_shape'
      and conrelid = 'public.property_photos'::regclass
  ) then
    alter table public.property_photos
      add constraint property_photos_ready_shape
      check (
        status <> 'ready'
        or (
          width is not null and width > 0
          and height is not null and height > 0
          and byte_size is not null and byte_size > 0
        )
      );
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'property_photos_cover_ready'
      and conrelid = 'public.property_photos'::regclass
  ) then
    alter table public.property_photos
      add constraint property_photos_cover_ready
      check (is_cover = false or status = 'ready');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'property_photos_measures_positive'
      and conrelid = 'public.property_photos'::regclass
  ) then
    alter table public.property_photos
      add constraint property_photos_measures_positive
      check (
        (width is null or width > 0)
        and (height is null or height > 0)
        and (byte_size is null or byte_size > 0)
      );
  end if;
end $$;

create unique index if not exists property_photos_object_key_key
  on public.property_photos (object_key);

create unique index if not exists property_photos_one_cover_idx
  on public.property_photos (property_id)
  where is_cover;

create index if not exists property_photos_property_position_idx
  on public.property_photos (property_id, position);

create or replace function public.set_property_photos_updated_at()
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

revoke all on function public.set_property_photos_updated_at() from public, anon;
grant execute on function public.set_property_photos_updated_at() to authenticated;

drop trigger if exists property_photos_set_updated_at on public.property_photos;
create trigger property_photos_set_updated_at
before update on public.property_photos
for each row
execute function public.set_property_photos_updated_at();

-- Cubre INSERT y UPDATE directos, no solo reserve_property_photo.
-- Bloquea la propiedad destino (y la origen si cambia property_id, en orden
-- de id para no trabarse) y cuenta pending + ready, sin la fila actual.
create or replace function public.enforce_property_photo_limit()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
  v_first uuid;
  v_second uuid;
begin
  if (select auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'admin' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if new.status is distinct from 'pending' and new.status is distinct from 'ready' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.property_id is distinct from new.property_id then
    if old.property_id < new.property_id then
      v_first := old.property_id;
      v_second := new.property_id;
    else
      v_first := new.property_id;
      v_second := old.property_id;
    end if;
    perform 1 from public.properties where id = v_first for update;
    perform 1 from public.properties where id = v_second for update;
  else
    perform 1 from public.properties where id = new.property_id for update;
  end if;

  if not exists (select 1 from public.properties where id = new.property_id) then
    raise exception 'not_found' using errcode = 'P0002';
  end if;

  select count(*) into v_count
  from public.property_photos
  where property_id = new.property_id
    and status in ('pending', 'ready')
    and id is distinct from new.id;

  if v_count >= 20 then
    raise exception 'photo_limit' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_property_photo_limit() from public, anon;
grant execute on function public.enforce_property_photo_limit() to authenticated;

drop trigger if exists property_photos_enforce_limit on public.property_photos;
create trigger property_photos_enforce_limit
before insert or update on public.property_photos
for each row
execute function public.enforce_property_photo_limit();

-- Reserva un cupo con la fila de la propiedad bloqueada, así dos cargas
-- simultáneas no pueden pasar de 20 aunque sean pestañas distintas.
create or replace function public.reserve_property_photo(
  p_id uuid,
  p_property_id uuid,
  p_object_key text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
  v_position integer;
begin
  if (select auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'admin' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  perform 1 from public.properties where id = p_property_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;

  select count(*) into v_count
  from public.property_photos
  where property_id = p_property_id
    and status in ('pending', 'ready');

  if v_count >= 20 then
    raise exception 'photo_limit' using errcode = 'P0001';
  end if;

  select coalesce(max(position), 0) + 1 into v_position
  from public.property_photos
  where property_id = p_property_id;

  insert into public.property_photos (id, property_id, object_key, position, status, is_cover)
  values (p_id, p_property_id, p_object_key, v_position, 'pending', false);

  return p_id;
end;
$$;

revoke all on function public.reserve_property_photo(uuid, uuid, text) from public, anon;
grant execute on function public.reserve_property_photo(uuid, uuid, text) to authenticated;

create or replace function public.reorder_property_photos(
  p_property_id uuid,
  p_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
  v_match integer;
begin
  if (select auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'admin' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  perform 1 from public.properties where id = p_property_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;

  select count(*) into v_count
  from public.property_photos
  where property_id = p_property_id
    and status in ('pending', 'ready');

  if v_count <> coalesce(cardinality(p_ids), 0) then
    raise exception 'invalid_order' using errcode = '22023';
  end if;

  if (select count(distinct item) from unnest(p_ids) as item) <> v_count then
    raise exception 'invalid_order' using errcode = '22023';
  end if;

  select count(*) into v_match
  from public.property_photos
  where property_id = p_property_id
    and status in ('pending', 'ready')
    and id = any (p_ids);

  if v_match <> v_count then
    raise exception 'invalid_order' using errcode = '22023';
  end if;

  update public.property_photos as photo
  set position = ordered.ord
  from (
    select id, ordinality::integer as ord
    from unnest(p_ids) with ordinality as listed(id, ordinality)
  ) as ordered
  where photo.id = ordered.id
    and photo.property_id = p_property_id
    and photo.status in ('pending', 'ready');
end;
$$;

revoke all on function public.reorder_property_photos(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_property_photos(uuid, uuid[]) to authenticated;

create or replace function public.set_property_photo_cover(
  p_property_id uuid,
  p_photo_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.jwt() -> 'app_metadata' ->> 'role') is distinct from 'admin' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  perform 1 from public.properties where id = p_property_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.property_photos
    where id = p_photo_id
      and property_id = p_property_id
      and status = 'ready'
  ) then
    raise exception 'not_found' using errcode = 'P0002';
  end if;

  update public.property_photos
  set is_cover = false
  where property_id = p_property_id
    and is_cover;

  update public.property_photos
  set is_cover = true
  where id = p_photo_id
    and property_id = p_property_id;
end;
$$;

revoke all on function public.set_property_photo_cover(uuid, uuid) from public, anon;
grant execute on function public.set_property_photo_cover(uuid, uuid) to authenticated;

alter table public.property_photos enable row level security;

drop policy if exists property_photos_admin_read on public.property_photos;
create policy property_photos_admin_read
on public.property_photos
for select
to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists property_photos_admin_insert on public.property_photos;
create policy property_photos_admin_insert
on public.property_photos
for insert
to authenticated
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists property_photos_admin_update on public.property_photos;
create policy property_photos_admin_update
on public.property_photos
for update
to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists property_photos_admin_delete on public.property_photos;
create policy property_photos_admin_delete
on public.property_photos
for delete
to authenticated
using ((select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

revoke all on table public.property_photos from public, anon, authenticated;
grant select, insert, update, delete on table public.property_photos to authenticated;

commit;
