-- Dev seed for crumbz-dev. Caracas and the base tags come from 0001_schema_mvp.sql.
-- Launch areas (CLAUDE.md §2: Las Mercedes, Altamira, Chacao) plus nearby zones.

insert into areas (city_id, name, slug)
select c.id, a.name, a.slug
from cities c
cross join (values
  ('Las Mercedes', 'las-mercedes'),
  ('Altamira', 'altamira'),
  ('Chacao', 'chacao'),
  ('Los Palos Grandes', 'los-palos-grandes'),
  ('La Castellana', 'la-castellana')
) as a(name, slug)
where c.slug = 'caracas'
on conflict do nothing;
