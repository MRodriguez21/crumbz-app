-- Phase 4: the place profile and Explore read real visit data.
--
-- place_summary(): everything the place page shows, in one call. The score is the plain
-- average of each person's LATEST visit (founder decision): honest and immediate.
-- Rankings (phase 5) keep the precomputed Bayesian score for ordering.
--
-- explore_places(): Explore list + map pins. Near me (by distance, located places only),
-- or by area (located in it OR delivering to it) and/or category.
-- TODO(scale): the per-place averages here run per query; move to a precomputed table
-- when Explore gets heavy (rankings already are).

create or replace function place_summary(p_place_id uuid)
returns jsonb
language sql stable
security invoker
set search_path = public, extensions
as $$
  with latest as (
    -- Only each person's most recent visit counts towards the score.
    select distinct on (user_id) user_id, rating, spend_per_person_usd
    from posts
    where place_id = p_place_id
    order by user_id, visited_on desc, created_at desc
  ),
  all_visits as (
    select * from posts where place_id = p_place_id
  )
  select jsonb_build_object(
    'location', (
      select case when location is null then null
                  else jsonb_build_object('lat', st_y(location::geometry), 'lng', st_x(location::geometry)) end
      from places where id = p_place_id
    ),
    'visits', (select count(*) from all_visits),
    'raters', (select count(*) from latest),
    'avg_rating', (select round(avg(rating)::numeric, 1) from latest),
    'distribution', jsonb_build_array(
      jsonb_build_object('label', '9–10', 'count', (select count(*) from latest where rating >= 9)),
      jsonb_build_object('label', '7–8', 'count', (select count(*) from latest where rating between 7 and 8)),
      jsonb_build_object('label', '1–6', 'count', (select count(*) from latest where rating <= 6))
    ),
    'spend', (
      select case when count(*) = 0 then null else jsonb_build_object(
        'low', round(percentile_cont(0.25) within group (order by spend_per_person_usd)::numeric, 2),
        'high', round(percentile_cont(0.75) within group (order by spend_per_person_usd)::numeric, 2),
        'visits', count(*)
      ) end
      from latest where spend_per_person_usd is not null
    ),
    'payments_visits', (select count(*) from all_visits where cardinality(payment_methods) > 0),
    'payments', coalesce((
      select jsonb_agg(jsonb_build_object('method', method, 'visits', n) order by n desc, method)
      from (
        select m as method, count(*) as n
        from all_visits, unnest(payment_methods) as m
        group by m
      ) pm
    ), '[]'::jsonb),
    'parking', jsonb_build_object(
      'yes', (select count(*) from all_visits where has_parking is true),
      'no', (select count(*) from all_visits where has_parking is false)
    ),
    'dishes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', id, 'name', name, 'recommended', recommend_count, 'mentions', mentions_count)
        order by recommend_count desc, mentions_count desc, name)
      from (
        select id, name, recommend_count, mentions_count from dishes
        where place_id = p_place_id and mentions_count > 0
        order by recommend_count desc, mentions_count desc, name
        limit 5
      ) d
    ), '[]'::jsonb),
    'photos', coalesce((
      select jsonb_agg(jsonb_build_object('id', id, 'path', storage_path, 'author', username)
        order by created_at desc)
      from (
        select ph.id, ph.storage_path, ph.created_at, pr.username
        from post_photos ph
        join posts p on p.id = ph.post_id
        join profiles pr on pr.id = p.user_id
        where p.place_id = p_place_id
        order by ph.created_at desc
        limit 12
      ) x
    ), '[]'::jsonb),
    'recent', coalesce((
      select jsonb_agg(v order by (v->>'created_at') desc)
      from (
        select jsonb_build_object(
          'id', p.id, 'rating', p.rating, 'mode', p.mode,
          'spend', p.spend_per_person_usd, 'visited_on', p.visited_on,
          'body', p.body, 'created_at', p.created_at,
          'author', jsonb_build_object(
            'username', pr.username, 'display_name', pr.display_name, 'avatar_path', pr.avatar_path),
          'cover', (select ph.storage_path from post_photos ph
                    where ph.post_id = p.id order by ph.position limit 1)
        ) as v
        from posts p join profiles pr on pr.id = p.user_id
        where p.place_id = p_place_id
        order by p.created_at desc
        limit 10
      ) r
    ), '[]'::jsonb)
  );
$$;

revoke execute on function place_summary from public;
grant execute on function place_summary to anon, authenticated;

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
    select c.*, s.raters, s.avg_rating
    from candidates c
    left join lateral (
      select count(*) as raters, round(avg(l.rating)::numeric, 1) as avg_rating
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
         dist, coalesce(raters, 0), avg_rating
  from scored
  order by
    dist nulls last,
    avg_rating desc nulls last,
    raters desc,
    name
  limit greatest(1, least(coalesce(p_limit, 60), 100));
$$;

revoke execute on function explore_places from public;
grant execute on function explore_places to anon, authenticated;
