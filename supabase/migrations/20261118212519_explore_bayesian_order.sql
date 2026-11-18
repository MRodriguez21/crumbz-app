-- Explore ordered by the Bayesian score, same formula as place_rankings:
--   score = (n * place_avg + 5 * global_avg) / (n + 5), latest visit per person only.
-- A place with a single 10 must not outrank one with forty 9s (CLAUDE.md §8).
-- The list still shows the raw average with its people count; only the order changes.
-- TODO(scale): the global average and per-place averages run per query; read the score
-- from place_rankings once pg_cron refreshes it (phase 5).

create or replace function explore_places(
  p_city_id   smallint,
  p_lat       double precision default null,
  p_lng       double precision default null,
  p_area_id   int default null,
  p_tag_slug  text default null,
  p_radius_m  int default 15000,
  p_limit     int default 60
)
returns table (
  id uuid, slug text, name text, kind place_kind, service_modes service_mode[],
  area_name text, lat double precision, lng double precision, distance_m double precision,
  raters bigint, avg_rating numeric
)
language sql stable
security invoker
set search_path = public, extensions
as $$
  with origin as (
    select case when p_lat is not null and p_lng is not null
                then st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography end as g
  ),
  global as (
    select coalesce(avg(rating), 7)::numeric as m
    from (
      select distinct on (user_id, place_id) rating
      from posts
      order by user_id, place_id, visited_on desc, created_at desc
    ) l
  ),
  candidates as (
    select p.*, a.name as area_label,
           case when o.g is not null and p.location is not null
                then st_distance(p.location, o.g) end as dist
    from places p
    cross join origin o
    left join areas a on a.id = p.area_id
    where p.city_id = p_city_id
      and p.status = 'active'
      -- Near me: only places with a location, within the radius (GiST index).
      and (o.g is null or (p.location is not null and st_dwithin(p.location, o.g, greatest(100, least(coalesce(p_radius_m, 15000), 50000)))))
      -- By area: located in it, or delivering to it.
      and (p_area_id is null or p.area_id = p_area_id or exists (
            select 1 from place_service_areas sa where sa.place_id = p.id and sa.area_id = p_area_id))
      and (p_tag_slug is null or exists (
            select 1 from place_tags pt join tags t on t.id = pt.tag_id
            where pt.place_id = p.id and t.slug = p_tag_slug))
  ),
  scored as (
    select c.*, s.raters, s.avg_raw,
           case when s.raters > 0
                then (s.raters * s.avg_raw + 5 * g.m) / (s.raters + 5) end as score
    from candidates c
    cross join global g
    left join lateral (
      select count(*) as raters, avg(l.rating)::numeric as avg_raw
      from (
        select distinct on (user_id) rating from posts
        where place_id = c.id
        order by user_id, visited_on desc, created_at desc
      ) l
    ) s on true
  )
  select id, slug, name, kind, service_modes, area_label,
         case when location is null then null else st_y(location::geometry) end,
         case when location is null then null else st_x(location::geometry) end,
         dist, coalesce(raters, 0), round(avg_raw, 1)
  from scored
  order by
    dist nulls last,
    score desc nulls last,
    raters desc,
    name
  limit greatest(1, least(coalesce(p_limit, 60), 100));
$$;

revoke execute on function explore_places from public;
grant execute on function explore_places to anon, authenticated;
