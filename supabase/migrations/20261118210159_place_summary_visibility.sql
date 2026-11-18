-- Phase 4 hardening (code review):
-- - place_summary() returns null for places the caller can't see (closed/rejected are
--   hidden by RLS on places); before, anyone with the id still got its visits and photos.
-- - Index for "each person's latest visit at a place", used by place_summary and by
--   explore_places for every candidate place.

create index if not exists posts_place_user_latest_ix
  on posts (place_id, user_id, visited_on desc, created_at desc);

create or replace function place_summary(p_place_id uuid)
returns jsonb
language sql stable
security invoker
set search_path = public, extensions
as $$
  -- RLS on places hides closed/rejected places: if the caller can't see the place,
  -- they get nothing from its visits either.
  with visible as (
    select 1 from places where id = p_place_id
  ),
  latest as (
    -- Only each person's most recent visit counts towards the score.
    select distinct on (user_id) user_id, rating, spend_per_person_usd
    from posts
    where place_id = p_place_id
    order by user_id, visited_on desc, created_at desc
  ),
  all_visits as (
    select * from posts where place_id = p_place_id
  )
  select case when not exists (select 1 from visible) then null else jsonb_build_object(
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
      -- Every visit of the last year counts: what people spent doesn't depend on whether
      -- it was their latest visit (only the score does).
      select case when count(*) = 0 then null else jsonb_build_object(
        'low', round(percentile_cont(0.25) within group (order by spend_per_person_usd)::numeric, 2),
        'high', round(percentile_cont(0.75) within group (order by spend_per_person_usd)::numeric, 2),
        'visits', count(*)
      ) end
      from all_visits
      where spend_per_person_usd is not null
        and visited_on > (now() at time zone 'America/Caracas')::date - 365
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
  ) end;
$$;

revoke execute on function place_summary from public;
grant execute on function place_summary to anon, authenticated;
