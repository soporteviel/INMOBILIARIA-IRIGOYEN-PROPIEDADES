-- Lectura pública de fotos listas que pertenecen a una propiedad PUBLICADA.
-- No abre el bucket, no cambia DNS y no otorga escrituras a anon.
-- La clave del objeto sigue en la fila: el sitio la lee en el servidor
-- y no acepta una clave enviada por el visitante.
-- Las políticas de admin quedan igual y siguen cubriendo borradores y pausadas.

begin;

drop policy if exists property_photos_public_read on public.property_photos;
create policy property_photos_public_read
on public.property_photos
for select
to anon, authenticated
using (
  status = 'ready'
  and exists (
    select 1
    from public.properties
    where properties.id = property_photos.property_id
      and properties.status = 'PUBLICADA'
  )
);

grant select on table public.property_photos to anon;

commit;
