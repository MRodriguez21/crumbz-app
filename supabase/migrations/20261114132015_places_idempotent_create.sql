-- Idempotent place creation.
--
-- On a flaky connection the create_place() call can commit while its response is lost;
-- the retry then created a duplicate ("cafe-x-2"). The app now sends a request id it
-- generates once per form: a repeated call with the same id returns the first place.

alter table places add column client_request_id uuid;

create unique index places_creator_request_uq
  on places (created_by, client_request_id)
  where client_request_id is not null;

-- Adding a parameter changes the signature: drop the old one so there is no overload.
drop function create_place(
  text, place_kind, service_mode[], smallint, int, double precision, double precision,
  text, text, text, payment_method[], boolean, boolean, smallint[], int[]
);

create function create_place(
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
  p_service_area_ids int[] default '{}',
  p_request_id       uuid default null
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

  -- Retry of a request that already committed: return the same place.
  if p_request_id is not null then
    select p.id, p.slug into v_id, v_slug
    from places p where p.created_by = v_uid and p.client_request_id = p_request_id;
    if found then
      return query select v_id, v_slug;
      return;
    end if;
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
        has_generator, has_parking, created_by, client_request_id
      ) values (
        trim(p_name), v_slug, p_kind,
        array(select distinct unnest(p_service_modes)),
        case when v_has_location
             then st_setsrid(st_makepoint(p_lng, p_lat), 4326)::geography end,
        case when v_has_location then 'device'::location_source end,
        nullif(trim(p_address), ''),
        p_city_id, case when v_dine_in then p_area_id end,
        nullif(trim(p_instagram), ''), nullif(trim(p_whatsapp), ''),
        coalesce(p_payment_methods, '{}'), p_has_generator, p_has_parking, v_uid, p_request_id
      )
      returning places.id into v_id;
      exit;
    exception when unique_violation then
      -- Either the same request raced itself (return the winner) or the slug was taken.
      if p_request_id is not null then
        select p.id, p.slug into v_id, v_slug
        from places p where p.created_by = v_uid and p.client_request_id = p_request_id;
        if found then
          return query select v_id, v_slug;
          return;
        end if;
      end if;
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
