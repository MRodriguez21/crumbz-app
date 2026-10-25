-- =====================================================================
-- Red social gastronómica — Esquema MVP
-- Supabase (PostgreSQL + PostGIS)
-- Úsalo como primera migración: supabase/migrations/0001_schema_mvp.sql
-- =====================================================================

create extension if not exists postgis  with schema extensions;
create extension if not exists citext   with schema extensions;
create extension if not exists pg_trgm  with schema extensions;
-- Para refrescar rankings automáticamente (actívalo en el panel de Supabase):
-- create extension if not exists pg_cron;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type place_kind as enum (
  'restaurant', 'cafe', 'bar', 'bakery', 'food_truck', 'delivery_only', 'other'
);
create type service_mode as enum ('dine_in', 'pickup', 'delivery');
create type payment_method as enum (
  'cash_usd', 'cash_ves', 'pago_movil', 'card_pos', 'zelle', 'binance', 'transfer', 'other'
);
create type place_status as enum ('active', 'closed', 'rejected');
create type list_kind as enum ('places', 'dishes');
create type report_target as enum ('post', 'photo', 'place', 'dish', 'profile');
create type report_status as enum ('open', 'resolved', 'dismissed');

-- ---------------------------------------------------------------------
-- Geografía: ciudades y zonas
-- ---------------------------------------------------------------------
create table cities (
  id           smallint generated always as identity primary key,
  name         text not null,
  slug         text not null unique,
  country_code char(2) not null default 'VE'
);

create table areas (
  id        int generated always as identity primary key,
  city_id   smallint not null references cities(id),
  name      text not null,
  slug      text not null,
  boundary  geography(MultiPolygon, 4326),  -- opcional, para asignar zona automáticamente
  unique (city_id, slug)
);

-- ---------------------------------------------------------------------
-- Usuarios
-- ---------------------------------------------------------------------
create table profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        citext not null unique
                  check (username ~ '^[a-zA-Z0-9_.]{3,30}$'),
  display_name    text not null check (char_length(display_name) between 1 and 60),
  avatar_path     text,
  bio             text check (char_length(bio) <= 280),
  home_city_id    smallint references cities(id),
  posts_count     int not null default 0,
  followers_count int not null default 0,
  following_count int not null default 0,
  created_at      timestamptz not null default now()
);

-- Administradores en tabla aparte para que nadie pueda autopromoverse
create table admins (
  user_id uuid primary key references profiles(id) on delete cascade
);

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- Lugares
-- ---------------------------------------------------------------------
create table tags (
  id   smallint generated always as identity primary key,
  name text not null,               -- "Hamburguesas", "Sushi", "Arepas"...
  slug text not null unique
);

create table places (
  id               uuid primary key default gen_random_uuid(),
  name             text not null check (char_length(name) between 1 and 120),
  slug             text not null unique,
  kind             place_kind not null default 'restaurant',
  service_modes    service_mode[] not null default '{dine_in}',
  location         geography(Point, 4326),     -- null si no tiene local físico
  address          text,
  city_id          smallint not null references cities(id),
  area_id          int references areas(id),
  google_place_id  text unique,                -- solo el ID, según términos de Google
  instagram        text,
  whatsapp         text,
  price_level      smallint check (price_level between 1 and 4),
  payment_methods  payment_method[] not null default '{}',
  has_generator    boolean,                    -- planta eléctrica
  has_parking      boolean,
  status           place_status not null default 'active',
  created_by       uuid references profiles(id) on delete set null,
  -- Contadores mantenidos por triggers
  posts_count      int not null default 0,
  rating_sum       int not null default 0,
  saves_count      int not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- Si atiende en el local, debe tener ubicación
  constraint dine_in_requires_location
    check (location is not null or not ('dine_in' = any(service_modes)))
);

create table place_tags (
  place_id uuid not null references places(id) on delete cascade,
  tag_id   smallint not null references tags(id) on delete cascade,
  primary key (place_id, tag_id)
);

-- Zonas donde hace delivery (clave para emprendimientos sin local)
create table place_service_areas (
  place_id uuid not null references places(id) on delete cascade,
  area_id  int not null references areas(id) on delete cascade,
  primary key (place_id, area_id)
);

-- Para cuando los dueños reclamen su perfil (fase posterior al MVP)
create table place_members (
  place_id    uuid not null references places(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  role        text not null check (role in ('owner', 'staff')),
  verified_at timestamptz,
  primary key (place_id, user_id)
);

-- ---------------------------------------------------------------------
-- Platos
-- ---------------------------------------------------------------------
create table dishes (
  id               uuid primary key default gen_random_uuid(),
  place_id         uuid not null references places(id) on delete cascade,
  name             text not null check (char_length(name) between 1 and 120),
  description      text,
  price_usd        numeric(8,2) check (price_usd >= 0),
  cover_photo_path text,
  created_by       uuid references profiles(id) on delete set null,
  mentions_count   int not null default 0,
  recommend_count  int not null default 0,
  created_at       timestamptz not null default now()
);
-- Evita duplicados como "Smash Burger" y "smash burger" en el mismo lugar
create unique index dishes_place_name_uniq on dishes (place_id, lower(name));

-- ---------------------------------------------------------------------
-- Visitas (la publicación central)
-- ---------------------------------------------------------------------
create table posts (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references profiles(id) on delete cascade,
  place_id              uuid not null references places(id) on delete cascade,
  rating                smallint not null check (rating between 1 and 10),
  body                  text check (char_length(body) <= 2000),
  mode                  service_mode not null,
  spend_per_person_usd  numeric(8,2) check (spend_per_person_usd >= 0),
  visited_on            date not null default current_date,
  likes_count           int not null default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create table post_dishes (
  post_id     uuid not null references posts(id) on delete cascade,
  dish_id     uuid not null references dishes(id) on delete cascade,
  rating      smallint check (rating between 1 and 10),
  recommended boolean not null default true,
  note        text check (char_length(note) <= 280),
  primary key (post_id, dish_id)
);

create table post_photos (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references posts(id) on delete cascade,
  dish_id      uuid references dishes(id) on delete set null,
  storage_path text not null,       -- ruta en el bucket (R2 o Supabase Storage)
  width        int,
  height       int,
  position     smallint not null default 0,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Listas y rankings personales
-- ---------------------------------------------------------------------
create table lists (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 80),
  kind       list_kind not null,
  tag_id     smallint references tags(id),   -- ej. "Mi top de hamburguesas"
  is_ranked  boolean not null default true,
  is_public  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table list_items (
  id         uuid primary key default gen_random_uuid(),
  list_id    uuid not null references lists(id) on delete cascade,
  place_id   uuid references places(id) on delete cascade,
  dish_id    uuid references dishes(id) on delete cascade,
  -- Indexación fraccionaria: mover un ítem = actualizar una sola fila
  position   double precision not null,
  note       text check (char_length(note) <= 280),
  created_at timestamptz not null default now(),
  constraint exactly_one_target check ((place_id is null) <> (dish_id is null)),
  unique (list_id, place_id),
  unique (list_id, dish_id)
);

-- "Quiero ir"
create table saves (
  user_id    uuid not null references profiles(id) on delete cascade,
  place_id   uuid not null references places(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

-- ---------------------------------------------------------------------
-- Social
-- ---------------------------------------------------------------------
create table follows (
  follower_id  uuid not null references profiles(id) on delete cascade,
  following_id uuid not null references profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table post_likes (
  user_id    uuid not null references profiles(id) on delete cascade,
  post_id    uuid not null references posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

-- ---------------------------------------------------------------------
-- Seguridad y moderación (exigido por App Store y Play Store)
-- ---------------------------------------------------------------------
create table blocks (
  blocker_id uuid not null references profiles(id) on delete cascade,
  blocked_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete set null,
  target_type report_target not null,
  target_id   uuid not null,
  reason      text not null check (char_length(reason) <= 500),
  status      report_status not null default 'open',
  resolved_by uuid references profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Índices
-- ---------------------------------------------------------------------
create index places_location_gix   on places using gist (location);
create index places_city_status_ix on places (city_id, status);
create index places_name_trgm_ix   on places using gin (name gin_trgm_ops);
create index dishes_place_ix       on dishes (place_id);
create index posts_place_ix        on posts (place_id, created_at desc);
create index posts_user_ix         on posts (user_id, created_at desc);
create index posts_user_place_ix   on posts (user_id, place_id, visited_on desc);
create index post_photos_post_ix   on post_photos (post_id, position);
create index post_dishes_dish_ix   on post_dishes (dish_id);
create index follows_following_ix  on follows (following_id);
create index list_items_list_ix    on list_items (list_id, position);
create index reports_status_ix     on reports (status, created_at);

-- ---------------------------------------------------------------------
-- Triggers: contadores y fechas
-- ---------------------------------------------------------------------
create or replace function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create trigger places_touch before update on places
  for each row execute function touch_updated_at();
create trigger posts_touch before update on posts
  for each row execute function touch_updated_at();
create trigger lists_touch before update on lists
  for each row execute function touch_updated_at();

create or replace function on_post_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update places   set posts_count = posts_count + 1,
                        rating_sum  = rating_sum + new.rating
     where id = new.place_id;
    update profiles set posts_count = posts_count + 1 where id = new.user_id;
  elsif tg_op = 'DELETE' then
    update places   set posts_count = posts_count - 1,
                        rating_sum  = rating_sum - old.rating
     where id = old.place_id;
    update profiles set posts_count = posts_count - 1 where id = old.user_id;
  elsif tg_op = 'UPDATE' then
    update places set rating_sum = rating_sum - old.rating + new.rating
     where id = new.place_id;
  end if;
  return null;
end $$;

create trigger posts_counters
  after insert or delete or update of rating on posts
  for each row execute function on_post_change();

create or replace function on_post_dish_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update dishes set mentions_count  = mentions_count + 1,
                      recommend_count = recommend_count + new.recommended::int
     where id = new.dish_id;
  elsif tg_op = 'DELETE' then
    update dishes set mentions_count  = mentions_count - 1,
                      recommend_count = recommend_count - old.recommended::int
     where id = old.dish_id;
  end if;
  return null;
end $$;

create trigger post_dishes_counters
  after insert or delete on post_dishes
  for each row execute function on_post_dish_change();

create or replace function on_follow_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update profiles set following_count = following_count + 1 where id = new.follower_id;
    update profiles set followers_count = followers_count + 1 where id = new.following_id;
  else
    update profiles set following_count = following_count - 1 where id = old.follower_id;
    update profiles set followers_count = followers_count - 1 where id = old.following_id;
  end if;
  return null;
end $$;

create trigger follows_counters after insert or delete on follows
  for each row execute function on_follow_change();

create or replace function on_save_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update places set saves_count = saves_count + 1 where id = new.place_id;
  else
    update places set saves_count = saves_count - 1 where id = old.place_id;
  end if;
  return null;
end $$;

create trigger saves_counters after insert or delete on saves
  for each row execute function on_save_change();

create or replace function on_like_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update posts set likes_count = likes_count + 1 where id = new.post_id;
  else
    update posts set likes_count = likes_count - 1 where id = old.post_id;
  end if;
  return null;
end $$;

create trigger likes_counters after insert or delete on post_likes
  for each row execute function on_like_change();

-- ---------------------------------------------------------------------
-- Rankings precalculados (promedio bayesiano)
-- Solo cuenta la visita más reciente de cada usuario por lugar.
-- score = (n * promedio_lugar + C * promedio_global) / (n + C), con C = 5
-- ---------------------------------------------------------------------
create materialized view place_rankings as
with latest as (
  select distinct on (user_id, place_id) user_id, place_id, rating
  from posts
  order by user_id, place_id, visited_on desc, created_at desc
),
stats as (
  select place_id, count(*) as raters, avg(rating)::numeric as avg_rating
  from latest
  group by place_id
),
global as (
  select coalesce(avg(rating), 7)::numeric as m from latest
)
select
  p.id                              as place_id,
  p.city_id,
  s.raters,
  round(s.avg_rating, 2)            as avg_rating,
  round((s.raters * s.avg_rating + 5 * g.m) / (s.raters + 5), 3) as score
from stats s
join places p on p.id = s.place_id
cross join global g
where p.status = 'active';

create unique index place_rankings_pk     on place_rankings (place_id);
create index        place_rankings_city_ix on place_rankings (city_id, score desc);

-- Refresco cada 15 minutos (requiere pg_cron):
-- select cron.schedule('refresh-place-rankings', '*/15 * * * *',
--   $$refresh materialized view concurrently place_rankings$$);

-- ---------------------------------------------------------------------
-- Funciones de consulta
-- ---------------------------------------------------------------------

-- Lugares cercanos, ordenados por distancia
create or replace function places_nearby(
  lat double precision,
  lng double precision,
  radius_m int default 3000,
  max_results int default 50
)
returns table (
  id uuid, name text, slug text, kind place_kind,
  distance_m double precision, score numeric
)
language sql stable as $$
  select p.id, p.name, p.slug, p.kind,
         st_distance(p.location, st_setsrid(st_makepoint(lng, lat), 4326)::geography),
         r.score
  from places p
  left join place_rankings r on r.place_id = p.id
  where p.status = 'active'
    and st_dwithin(p.location, st_setsrid(st_makepoint(lng, lat), 4326)::geography, radius_m)
  order by 5
  limit least(max_results, 100);
$$;

-- Ranking por ciudad y categoría (ej. mejores hamburguesas de Caracas)
create or replace function top_places(
  p_city_id smallint,
  p_tag_slug text default null,
  min_raters int default 3,
  max_results int default 50
)
returns table (
  id uuid, name text, slug text, raters bigint, avg_rating numeric, score numeric
)
language sql stable as $$
  select p.id, p.name, p.slug, r.raters, r.avg_rating, r.score
  from place_rankings r
  join places p on p.id = r.place_id
  where r.city_id = p_city_id
    and r.raters >= min_raters
    and (p_tag_slug is null or exists (
          select 1 from place_tags pt
          join tags t on t.id = pt.tag_id
          where pt.place_id = p.id and t.slug = p_tag_slug))
  order by r.score desc
  limit least(max_results, 100);
$$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table cities              enable row level security;
alter table areas               enable row level security;
alter table profiles            enable row level security;
alter table admins              enable row level security;
alter table tags                enable row level security;
alter table places              enable row level security;
alter table place_tags          enable row level security;
alter table place_service_areas enable row level security;
alter table place_members       enable row level security;
alter table dishes              enable row level security;
alter table posts               enable row level security;
alter table post_dishes         enable row level security;
alter table post_photos         enable row level security;
alter table lists               enable row level security;
alter table list_items          enable row level security;
alter table saves               enable row level security;
alter table follows             enable row level security;
alter table post_likes          enable row level security;
alter table blocks              enable row level security;
alter table reports             enable row level security;

-- Catálogos: lectura pública, escritura solo admins
create policy "read cities" on cities for select using (true);
create policy "admin cities" on cities for all using (is_admin()) with check (is_admin());
create policy "read areas" on areas for select using (true);
create policy "admin areas" on areas for all using (is_admin()) with check (is_admin());
create policy "read tags" on tags for select using (true);
create policy "admin tags" on tags for all using (is_admin()) with check (is_admin());

-- Perfiles
create policy "read profiles" on profiles for select using (true);
create policy "insert own profile" on profiles for insert
  with check (id = auth.uid());
create policy "update own profile" on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
-- Evita que el usuario edite sus propios contadores desde el cliente
revoke update (posts_count, followers_count, following_count) on profiles from authenticated;

create policy "admins see admins" on admins for select using (is_admin());

-- Lugares: cualquier usuario autenticado puede crear; solo admins modifican
create policy "read places" on places for select
  using (status = 'active' or created_by = auth.uid() or is_admin());
create policy "create places" on places for insert to authenticated
  with check (created_by = auth.uid() and status = 'active'
              and posts_count = 0 and rating_sum = 0 and saves_count = 0);
create policy "admin places" on places for update
  using (is_admin()) with check (is_admin());

create policy "read place_tags" on place_tags for select using (true);
create policy "tag own places" on place_tags for insert to authenticated
  with check (exists (select 1 from places p
                      where p.id = place_id and (p.created_by = auth.uid() or is_admin())));
create policy "admin place_tags" on place_tags for delete using (is_admin());

create policy "read service areas" on place_service_areas for select using (true);
create policy "set service areas" on place_service_areas for insert to authenticated
  with check (exists (select 1 from places p
                      where p.id = place_id and (p.created_by = auth.uid() or is_admin())));
create policy "admin service areas" on place_service_areas for delete using (is_admin());

create policy "admin place_members" on place_members for all
  using (is_admin()) with check (is_admin());
create policy "see own memberships" on place_members for select
  using (user_id = auth.uid());

-- Platos
create policy "read dishes" on dishes for select using (true);
create policy "create dishes" on dishes for insert to authenticated
  with check (created_by = auth.uid() and mentions_count = 0 and recommend_count = 0);
create policy "admin dishes" on dishes for update using (is_admin()) with check (is_admin());

-- Visitas
create policy "read posts" on posts for select using (true);
create policy "create own posts" on posts for insert to authenticated
  with check (user_id = auth.uid() and likes_count = 0);
create policy "update own posts" on posts for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "delete own posts" on posts for delete
  using (user_id = auth.uid() or is_admin());
revoke update (likes_count, place_id, user_id) on posts from authenticated;

create policy "read post_dishes" on post_dishes for select using (true);
create policy "write own post_dishes" on post_dishes for all to authenticated
  using (exists (select 1 from posts where id = post_id and user_id = auth.uid()))
  with check (exists (select 1 from posts where id = post_id and user_id = auth.uid()));

create policy "read photos" on post_photos for select using (true);
create policy "write own photos" on post_photos for all to authenticated
  using (exists (select 1 from posts where id = post_id and user_id = auth.uid()))
  with check (exists (select 1 from posts where id = post_id and user_id = auth.uid()));
create policy "admin delete photos" on post_photos for delete using (is_admin());

-- Listas
create policy "read lists" on lists for select
  using (is_public or user_id = auth.uid());
create policy "write own lists" on lists for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "read list_items" on list_items for select
  using (exists (select 1 from lists l
                 where l.id = list_id and (l.is_public or l.user_id = auth.uid())));
create policy "write own list_items" on list_items for all to authenticated
  using (exists (select 1 from lists l where l.id = list_id and l.user_id = auth.uid()))
  with check (exists (select 1 from lists l where l.id = list_id and l.user_id = auth.uid()));

-- Guardados (privados)
create policy "own saves" on saves for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Seguidores y likes (públicos para leer)
create policy "read follows" on follows for select using (true);
create policy "own follows" on follows for insert to authenticated
  with check (follower_id = auth.uid());
create policy "unfollow" on follows for delete using (follower_id = auth.uid());

create policy "read likes" on post_likes for select using (true);
create policy "own likes" on post_likes for insert to authenticated
  with check (user_id = auth.uid());
create policy "unlike" on post_likes for delete using (user_id = auth.uid());

-- Bloqueos (privados)
create policy "own blocks" on blocks for all to authenticated
  using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- Reportes: el usuario crea, solo admins leen y resuelven
create policy "create reports" on reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open');
create policy "admin reports" on reports for select using (is_admin());
create policy "admin resolve reports" on reports for update
  using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- Datos iniciales de ejemplo
-- ---------------------------------------------------------------------
insert into cities (name, slug) values ('Caracas', 'caracas');

insert into tags (name, slug) values
  ('Hamburguesas', 'hamburguesas'), ('Pizza', 'pizza'), ('Sushi', 'sushi'),
  ('Arepas', 'arepas'), ('Café', 'cafe'), ('Postres', 'postres'),
  ('Parrilla', 'parrilla'), ('Comida venezolana', 'venezolana'),
  ('Pollo', 'pollo'), ('Tacos', 'tacos'), ('Desayunos', 'desayunos');

-- =====================================================================
-- Notas para la implementación
-- - Eliminación de cuenta: una Edge Function con la service role borra el
--   usuario en auth.users; el "on delete cascade" limpia sus datos. Recuerda
--   borrar también sus fotos del almacenamiento.
-- - Bloqueos: filtra en las consultas del feed y de las visitas de un lugar
--   (not exists en blocks) para no mostrar contenido de usuarios bloqueados.
-- - list_items: valida en la app (o con un trigger) que place_id/dish_id
--   coincida con el kind de la lista.
-- - place_rankings es una vista materializada: no tiene RLS, pero solo
--   contiene datos públicos agregados.
-- - Cuando el tráfico crezca, los contadores con triggers pueden generar
--   contención; ahí conviene pasarlos a actualizaciones por lotes.
-- =====================================================================
