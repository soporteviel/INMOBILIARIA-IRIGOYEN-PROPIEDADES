alter table public.properties
  drop constraint if exists properties_type;

alter table public.properties
  add constraint properties_type
  check (
    property_type is null
    or property_type in (
      'Casa',
      'Departamento',
      'PH',
      'Local',
      'Oficina',
      'Cochera',
      'Lote',
      'Terreno'
    )
  );
