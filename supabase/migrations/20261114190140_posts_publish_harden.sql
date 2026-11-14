-- Phase 3 hardening (code review):
-- - Photo paths must be exactly {user}/{post}/{photo_id}.{webp|jpg}: no "..", no other files.
-- - The visit's mode must be one the place offers.
-- - Anti-inflation limits: at most 3 visits per user and place per day, 30 per user per day.
--   Rankings already count only each user's latest visit; this protects the raw counters.

create or replace function create_post(
  p_id              uuid,
  p_place_id        uuid,
  p_rating          smallint,
  p_mode            service_mode,
  p_spend_usd       numeric default null,
  p_visited_on      date default null,
  p_body            text default null,
  p_payment_methods payment_method[] default '{}',
  p_has_parking     boolean default null,
  p_dishes          jsonb default '[]',
  p_photos          jsonb default '[]'
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_uid     uuid := auth.uid();
  v_owner   uuid;
  v_modes   service_mode[];
  v_today   date := (now() at time zone 'America/Caracas')::date;
  v_dish    jsonb;
  v_dish_id uuid;
  v_name    text;
  v_photo   jsonb;
  v_photo_id uuid;
  v_path    text;
  v_pos     smallint := 0;
  v_prefix  text;
begin
  -- Security definer bypasses RLS: every rule is enforced here.
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;
  if p_id is null then
    raise exception 'post id required' using errcode = '22023';
  end if;

  -- Retry of a visit that already committed.
  select user_id into v_owner from posts where id = p_id;
  if found then
    if v_owner <> v_uid then
      raise exception 'post id taken' using errcode = '22023';
    end if;
    return p_id;
  end if;

  select service_modes into v_modes from places where id = p_place_id and status = 'active';
  if not found then
    raise exception 'place not available' using errcode = 'P0002';
  end if;
  if p_mode is null or not (p_mode = any(v_modes)) then
    raise exception 'mode not offered by the place' using errcode = '22023';
  end if;
  if p_rating is null or p_rating not between 1 and 10 then
    raise exception 'rating must be 1-10' using errcode = '22023';
  end if;
  if p_spend_usd is not null and p_spend_usd not between 0 and 9999 then
    raise exception 'spend out of range' using errcode = '22023';
  end if;
  -- A day of slack for clocks ahead of Caracas time.
  if coalesce(p_visited_on, v_today) > v_today + 1 then
    raise exception 'visit date in the future' using errcode = '22023';
  end if;
  if jsonb_typeof(p_dishes) <> 'array' or jsonb_array_length(p_dishes) > 20 then
    raise exception 'too many dishes' using errcode = '22023';
  end if;
  if jsonb_typeof(p_photos) <> 'array' or jsonb_array_length(p_photos) > 6 then
    raise exception 'too many photos' using errcode = '22023';
  end if;
  if (select count(*) from posts
      where user_id = v_uid and place_id = p_place_id and created_at > now() - interval '1 day') >= 3
     or (select count(*) from posts
         where user_id = v_uid and created_at > now() - interval '1 day') >= 30 then
    raise exception 'too many visits today' using errcode = '22023';
  end if;

  begin
    insert into posts (
      id, user_id, place_id, rating, mode, spend_per_person_usd, visited_on, body,
      payment_methods, has_parking
    ) values (
      p_id, v_uid, p_place_id, p_rating, p_mode, p_spend_usd,
      least(coalesce(p_visited_on, v_today), v_today),
      nullif(trim(p_body), ''),
      array(select distinct unnest(coalesce(p_payment_methods, '{}'))),
      case when p_mode = 'dine_in' then p_has_parking end
    );
  exception when unique_violation then
    -- The same visit raced itself.
    return p_id;
  end;

  for v_dish in select * from jsonb_array_elements(p_dishes) loop
    v_dish_id := nullif(v_dish->>'dish_id', '')::uuid;
    if v_dish_id is not null then
      if not exists (select 1 from dishes d where d.id = v_dish_id and d.place_id = p_place_id) then
        raise exception 'dish does not belong to place' using errcode = '22023';
      end if;
    else
      v_name := trim(regexp_replace(coalesce(v_dish->>'name', ''), '\s+', ' ', 'g'));
      if char_length(v_name) not between 1 and 120 then
        raise exception 'invalid dish name' using errcode = '22023';
      end if;
      insert into dishes (place_id, name, created_by)
      values (p_place_id, v_name, v_uid)
      on conflict (place_id, lower(name)) do nothing;
      select d.id into v_dish_id from dishes d
      where d.place_id = p_place_id and lower(d.name) = lower(v_name);
    end if;

    insert into post_dishes (post_id, dish_id, recommended)
    values (p_id, v_dish_id, coalesce((v_dish->>'recommended')::boolean, false))
    on conflict (post_id, dish_id) do nothing;
  end loop;

  v_prefix := v_uid::text || '/' || p_id::text || '/';
  for v_photo in select * from jsonb_array_elements(p_photos) loop
    v_photo_id := (v_photo->>'id')::uuid;
    v_path := v_photo->>'path';
    -- Exact path, tied to the photo id: nothing outside the visit's own folder.
    if v_path is null
       or v_path not in (v_prefix || v_photo_id::text || '.webp',
                         v_prefix || v_photo_id::text || '.jpg') then
      raise exception 'photo outside the visit folder' using errcode = '22023';
    end if;
    insert into post_photos (id, post_id, storage_path, width, height, position)
    values (v_photo_id, p_id, v_path,
            (v_photo->>'width')::int, (v_photo->>'height')::int, v_pos);
    v_pos := v_pos + 1;
  end loop;

  return p_id;
end;
$$;

revoke execute on function create_post from public, anon;
grant execute on function create_post to authenticated;
