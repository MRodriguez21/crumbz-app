-- Accent- and case-insensitive place search: "cafe avla" finds "Café Ávila".
-- unaccent() isn't immutable, so it can't back an index directly; this wrapper pins
-- the dictionary, which makes it safe to mark immutable.

create or replace function immutable_unaccent(p text)
returns text
language sql immutable parallel safe strict
set search_path = public, extensions
as $$
  select extensions.unaccent('extensions.unaccent'::regdictionary, p);
$$;

create index places_name_norm_trgm_ix on places
  using gin (immutable_unaccent(lower(name)) extensions.gin_trgm_ops);

create or replace function search_places(
  q           text,
  p_city_id   smallint,
  max_results int default 20
)
returns table (
  id uuid, slug text, name text, kind place_kind, service_modes service_mode[],
  area_name text, address text, google_place_id text, match_score real
)
language sql stable
security invoker
set search_path = public, extensions
as $$
  with norm as (select immutable_unaccent(lower(trim(q))) as nq)
  select p.id, p.slug, p.name, p.kind, p.service_modes,
         a.name, p.address, p.google_place_id,
         greatest(similarity(immutable_unaccent(lower(p.name)), norm.nq),
                  word_similarity(norm.nq, immutable_unaccent(lower(p.name))))
  from places p
  cross join norm
  left join areas a on a.id = p.area_id
  where p.city_id = p_city_id
    and p.status = 'active'
    and char_length(norm.nq) >= 2
    and (immutable_unaccent(lower(p.name)) % norm.nq
         or norm.nq <% immutable_unaccent(lower(p.name))
         or immutable_unaccent(lower(p.name)) like '%' || norm.nq || '%')
  order by 9 desc, p.name
  limit least(max_results, 50);
$$;
