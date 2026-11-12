-- Phase 2: place creation and search.
--
-- - create_place(): manual creation by a signed-in user (RLS applies: security invoker).
-- - import_google_place(): only callable by the `places` Edge Function (service role),
--   so a client can't attach an arbitrary google_place_id to a place.
-- - search_places(): typo-tolerant catalog search (pg_trgm), also used to warn about
--   likely duplicates before creating a place.
-- - Location provenance: Google terms allow caching coordinates for ~30 days, so
--   Google-sourced locations record when they were fetched and get refreshed by a
--   scheduled job (added once the Google key exists). Device locations never expire.

create extension if not exists unaccent with schema extensions;

create type location_source as enum ('google', 'device');

alter table places
  add column location_source     location_source,
  add column location_fetched_at timestamptz,
  add constraint location_source_matches
    check ((location is null) = (location_source is null)),
  add constraint google_location_has_fetch_time
    check (location_source is distinct from 'google' or location_fetched_at is not null);

create index places_google_refresh_ix on places (location_fetched_at)
  where location_source = 'google';

-- ---------------------------------------------------------------------
-- Slugs: "Café Ávila" -> "cafe-avila", then "-2", "-3"... if taken.
-- ---------------------------------------------------------------------
create or replace function place_slug_base(p_name text)
returns text
language sql stable
set search_path = public, extensions
as $$
  select coalesce(
    nullif(left(trim(both '-' from regexp_replace(lower(unaccent(p_name)), '[^a-z0-9]+', '-', 'g')), 60), ''),
    'lugar'
  );
$$;

-- Security definer: slugs are globally unique, so this must see every row,
-- not only the ones the caller's RLS view shows. It only reveals whether a slug exists.
create or replace function next_place_slug(p_name text)
returns text
language plpgsql stable
security definer
set search_path = public, extensions
as $$
declare
  base text := place_slug_base(p_name);
  candidate text := base;
  n int := 1;
begin
  while exists (select 1 from places where slug = candidate) loop
    n := n + 1;
    candidate := base || '-' || n;
  end loop;
  return candidate;
end;
$$;

revoke execute on function place_slug_base(text) from public, anon;
revoke execute on function next_place_slug(text) from public, anon;
grant execute on function next_place_slug(text) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- Manual creation (delivery-only ventures, places Google doesn't know)
-- ---------------------------------------------------------------------
create or replace function create_place(
  p_name             text,
  p_kind             place_kind,
  p_service_modes    service_mode[],
  p_city_id          smallint,
  p_area_id          int default null,
  p_lat              double precision default null,
  p_lng              double precision default null,
  p_address          text default null,
  p_instagram        text default null,
  p_whatsapp         text default null,
  p_payment_methods  payment_method[] default '{}',
  p_has_generator    boolean default null,
  p_has_parking      boolean default null,
  p_tag_ids          smallint[] default '{}',
  p_service_area_ids int[] default '{}'
)
returns table (id uuid, slug text)
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  v_id   uuid;
  v_slug text;
  v_has_location boolean := p_lat is not null and p_lng is not null;
begin
  if (select auth.uid()) is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if cardinality(p_tag_ids) > 3 then
    raise exception 'too many tags' using errcode = '22023';
  end if;
  if 'delivery' = any(p_service_modes) and cardinality(p_service_area_ids) = 0 then
    raise exception 'delivery requires at least one service area' using errcode = '22023';
  end if;

  for attempt in 1..3 loop
    v_slug := next_place_slug(p_name);
    begin
      insert into places (
        name, slug, kind, service_modes, location, location_source, address,
        city_id, area_id, instagram, whatsapp, payment_methods,
        has_generator, has_parking, created_by
      ) values (
        trim(p_name), v_slug, p_kind, p_service_modes,
        case when v_has_location
             then st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography end,
        case when v_has_location then 'device'::location_source end,
        nullif(trim(p_address), ''),
        p_city_id, p_area_id,
        nullif(trim(p_instagram), ''), nullif(trim(p_whatsapp), ''),
        p_payment_methods, p_has_generator, p_has_parking, (select auth.uid())
      )
      returning places.id into v_id;
      exit;
    exception when unique_violation then
      -- Another insert took the same slug between the check and the insert.
      if attempt = 3 then raise; end if;
    end;
  end loop;

  insert into place_tags (place_id, tag_id)
  select v_id, unnest(p_tag_ids);

  insert into place_service_areas (place_id, area_id)
  select v_id, unnest(p_service_area_ids);

  return query select v_id, v_slug;
end;
$$;

revoke execute on function create_place from public, anon;
grant execute on function create_place to authenticated;

-- ---------------------------------------------------------------------
-- Google import (Edge Function only). Idempotent on google_place_id.
-- ---------------------------------------------------------------------
create or replace function import_google_place(
  p_user_id         uuid,
  p_google_place_id text,
  p_name            text,
  p_lat             double precision,
  p_lng             double precision,
  p_address         text,
  p_city_id         smallint,
  p_kind            place_kind default 'restaurant'
)
returns table (id uuid, slug text, created boolean)
language plpgsql
security invoker
set search_path = public, extensions
as $$
declare
  v_id   uuid;
  v_slug text;
begin
  select p.id, p.slug into v_id, v_slug from places p where p.google_place_id = p_google_place_id;
  if found then
    return query select v_id, v_slug, false;
    return;
  end if;

  for attempt in 1..3 loop
    v_slug := next_place_slug(p_name);
    begin
      insert into places (
        name, slug, kind, service_modes, location, location_source, location_fetched_at,
        address, city_id, google_place_id, created_by
      ) values (
        trim(p_name), v_slug, p_kind, '{dine_in}',
        st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography, 'google', now(),
        nullif(trim(p_address), ''), p_city_id, p_google_place_id, p_user_id
      )
      returning places.id into v_id;
      exit;
    exception when unique_violation then
      -- Same Google place imported concurrently: return the winner.
      select p.id, p.slug into v_id, v_slug from places p where p.google_place_id = p_google_place_id;
      if found then
        return query select v_id, v_slug, false;
        return;
      end if;
      if attempt = 3 then raise; end if;
    end;
  end loop;

  return query select v_id, v_slug, true;
end;
$$;

revoke execute on function import_google_place from public, anon, authenticated;
grant execute on function import_google_place to service_role;

-- ---------------------------------------------------------------------
-- Catalog search (typo tolerant). RLS applies.
-- ---------------------------------------------------------------------
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
  select p.id, p.slug, p.name, p.kind, p.service_modes,
         a.name, p.address, p.google_place_id,
         similarity(p.name, q)
  from places p
  left join areas a on a.id = p.area_id
  where p.city_id = p_city_id
    and p.status = 'active'
    and char_length(trim(q)) >= 2
    and (p.name % q or p.name ilike '%' || trim(q) || '%')
  order by similarity(p.name, q) desc, p.name
  limit least(max_results, 50);
$$;

revoke execute on function search_places from public;
grant execute on function search_places to anon, authenticated;
