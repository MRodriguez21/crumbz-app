-- Phase 2 hardening (code review): places are only created through functions.
--
-- Before: `authenticated` kept table-level INSERT on places, so a signed-in user could
-- POST /rest/v1/places directly, attach a real venue's google_place_id to a fake place
-- (with their own WhatsApp) and block the genuine import. Now:
--   - no direct INSERT on places / place_tags / place_service_areas from the API roles;
--   - create_place() is security definer and enforces every rule the app's Zod schema does;
--   - import_google_place() rejects coordinates outside Venezuela and hidden places;
--   - contact formats are checked by the database too.

revoke insert on table places, place_tags, place_service_areas from anon, authenticated;

drop policy "create places" on places;
drop policy "tag own places" on place_tags;
drop policy "set service areas" on place_service_areas;

alter table places
  add constraint whatsapp_e164 check (whatsapp is null or whatsapp ~ '^\+[0-9]{8,15}$'),
  add constraint instagram_handle check (instagram is null or instagram ~ '^[a-z0-9._]{1,30}$');

-- Same bounds as isInVenezuela() in packages/shared.
create or replace function is_in_venezuela(p_lat double precision, p_lng double precision)
returns boolean
language sql immutable parallel safe
set search_path = public
as $$
  select p_lat between 0.6 and 12.3 and p_lng between -73.4 and -59.8;
$$;

-- Trim after truncating so a slug never ends in "-" (which made "foo--2").
create or replace function place_slug_base(p_name text)
returns text
language sql stable
set search_path = public, extensions
as $$
  select coalesce(
    nullif(trim(both '-' from left(regexp_replace(lower(unaccent(p_name)), '[^a-z0-9]+', '-', 'g'), 60)), ''),
    'lugar'
  );
$$;

-- Only the functions below call it now.
revoke execute on function next_place_slug(text) from authenticated;

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
security definer
set search_path = public, extensions
as $$
declare
  v_uid  uuid := auth.uid();
  v_id   uuid;
  v_slug text;
  v_has_location boolean := p_lat is not null and p_lng is not null;
  v_dine_in boolean := 'dine_in' = any(coalesce(p_service_modes, '{}'));
begin
  -- Security definer bypasses RLS: every rule is enforced here.
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if coalesce(cardinality(p_service_modes), 0) = 0 then
    raise exception 'at least one service mode' using errcode = '22023';
  end if;
  if coalesce(cardinality(p_tag_ids), 0) not between 1 and 3 then
    raise exception 'between 1 and 3 tags' using errcode = '22023';
  end if;
  if 'delivery' = any(p_service_modes) and coalesce(cardinality(p_service_area_ids), 0) = 0 then
    raise exception 'delivery requires at least one service area' using errcode = '22023';
  end if;
  if v_has_location and not is_in_venezuela(p_lat, p_lng) then
    raise exception 'location outside Venezuela' using errcode = '22023';
  end if;
  if v_dine_in and not v_has_location then
    raise exception 'dine-in requires a location' using errcode = '22023';
  end if;
  if p_area_id is not null
     and not exists (select 1 from areas a where a.id = p_area_id and a.city_id = p_city_id) then
    raise exception 'area does not belong to city' using errcode = '22023';
  end if;
  if exists (
    select 1 from unnest(coalesce(p_service_area_ids, '{}')) sa(area_id)
    where not exists (select 1 from areas a where a.id = sa.area_id and a.city_id = p_city_id)
  ) then
    raise exception 'service area does not belong to city' using errcode = '22023';
  end if;

  for attempt in 1..3 loop
    v_slug := next_place_slug(p_name);
    begin
      insert into places (
        name, slug, kind, service_modes, location, location_source, address,
        city_id, area_id, instagram, whatsapp, payment_methods,
        has_generator, has_parking, created_by
      ) values (
        trim(p_name), v_slug, p_kind,
        array(select distinct unnest(p_service_modes)),
        case when v_has_location
             then st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography end,
        case when v_has_location then 'device'::location_source end,
        nullif(trim(p_address), ''),
        p_city_id, case when v_dine_in then p_area_id end,
        nullif(trim(p_instagram), ''), nullif(trim(p_whatsapp), ''),
        coalesce(p_payment_methods, '{}'), p_has_generator, p_has_parking, v_uid
      )
      returning places.id into v_id;
      exit;
    exception when unique_violation then
      if attempt = 3 then raise; end if;
    end;
  end loop;

  insert into place_tags (place_id, tag_id)
  select distinct v_id, unnest(p_tag_ids);

  insert into place_service_areas (place_id, area_id)
  select distinct v_id, unnest(coalesce(p_service_area_ids, '{}'));

  return query select v_id, v_slug;
end;
$$;

revoke execute on function create_place from public, anon;
grant execute on function create_place to authenticated;

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
  v_id     uuid;
  v_slug   text;
  v_status place_status;
begin
  select p.id, p.slug, p.status into v_id, v_slug, v_status
  from places p where p.google_place_id = p_google_place_id;
  if found then
    if v_status <> 'active' then
      raise exception 'place not available' using errcode = 'P0002';
    end if;
    return query select v_id, v_slug, false;
    return;
  end if;

  if not is_in_venezuela(p_lat, p_lng) then
    raise exception 'location outside Venezuela' using errcode = '22023';
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
      select p.id, p.slug into v_id, v_slug
      from places p where p.google_place_id = p_google_place_id and p.status = 'active';
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
