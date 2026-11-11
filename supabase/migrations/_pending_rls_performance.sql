-- =====================================================================
-- RLS performance (advisor lints 0003, 0006) + covering indexes for foreign keys (0001).
--
-- 1. Wrap auth.uid() / is_admin() in (select …) so Postgres evaluates them once per query
--    (initplan) instead of once per row.
-- 2. Replace `for all` write policies that overlapped the public `select` policies with
--    per-command policies, so each (role, command) has a single permissive policy.
-- 3. Scope write policies `to authenticated` (anon never had a uid, so behaviour is unchanged).
--
-- Access rules are the same as before; only how they're evaluated changes.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Catalogs: public read, admin writes
-- ---------------------------------------------------------------------
drop policy "admin cities" on cities;
create policy "admin insert cities" on cities for insert to authenticated
  with check ((select is_admin()));
create policy "admin update cities" on cities for update to authenticated
  using ((select is_admin())) with check ((select is_admin()));
create policy "admin delete cities" on cities for delete to authenticated
  using ((select is_admin()));

drop policy "admin areas" on areas;
create policy "admin insert areas" on areas for insert to authenticated
  with check ((select is_admin()));
create policy "admin update areas" on areas for update to authenticated
  using ((select is_admin())) with check ((select is_admin()));
create policy "admin delete areas" on areas for delete to authenticated
  using ((select is_admin()));

drop policy "admin tags" on tags;
create policy "admin insert tags" on tags for insert to authenticated
  with check ((select is_admin()));
create policy "admin update tags" on tags for update to authenticated
  using ((select is_admin())) with check ((select is_admin()));
create policy "admin delete tags" on tags for delete to authenticated
  using ((select is_admin()));

-- ---------------------------------------------------------------------
-- Profiles and admins
-- ---------------------------------------------------------------------
drop policy "insert own profile" on profiles;
create policy "insert own profile" on profiles for insert to authenticated
  with check (id = (select auth.uid()));

drop policy "update own profile" on profiles;
create policy "update own profile" on profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy "admins see admins" on admins;
create policy "admins see admins" on admins for select to authenticated
  using ((select is_admin()));

-- ---------------------------------------------------------------------
-- Places
-- ---------------------------------------------------------------------
drop policy "read places" on places;
create policy "read places" on places for select
  using (status = 'active' or created_by = (select auth.uid()) or (select is_admin()));

drop policy "create places" on places;
create policy "create places" on places for insert to authenticated
  with check (created_by = (select auth.uid()) and status = 'active'
              and posts_count = 0 and rating_sum = 0 and saves_count = 0);

drop policy "admin places" on places;
create policy "admin places" on places for update to authenticated
  using ((select is_admin())) with check ((select is_admin()));

drop policy "tag own places" on place_tags;
create policy "tag own places" on place_tags for insert to authenticated
  with check (exists (select 1 from places p
                      where p.id = place_id
                        and (p.created_by = (select auth.uid()) or (select is_admin()))));

drop policy "admin place_tags" on place_tags;
create policy "admin place_tags" on place_tags for delete to authenticated
  using ((select is_admin()));

drop policy "set service areas" on place_service_areas;
create policy "set service areas" on place_service_areas for insert to authenticated
  with check (exists (select 1 from places p
                      where p.id = place_id
                        and (p.created_by = (select auth.uid()) or (select is_admin()))));

drop policy "admin service areas" on place_service_areas;
create policy "admin service areas" on place_service_areas for delete to authenticated
  using ((select is_admin()));

drop policy "admin place_members" on place_members;
drop policy "see own memberships" on place_members;
create policy "read place_members" on place_members for select to authenticated
  using (user_id = (select auth.uid()) or (select is_admin()));
create policy "admin insert place_members" on place_members for insert to authenticated
  with check ((select is_admin()));
create policy "admin update place_members" on place_members for update to authenticated
  using ((select is_admin())) with check ((select is_admin()));
create policy "admin delete place_members" on place_members for delete to authenticated
  using ((select is_admin()));

-- ---------------------------------------------------------------------
-- Dishes
-- ---------------------------------------------------------------------
drop policy "create dishes" on dishes;
create policy "create dishes" on dishes for insert to authenticated
  with check (created_by = (select auth.uid()) and mentions_count = 0 and recommend_count = 0);

drop policy "admin dishes" on dishes;
create policy "admin dishes" on dishes for update to authenticated
  using ((select is_admin())) with check ((select is_admin()));

-- ---------------------------------------------------------------------
-- Posts (visits)
-- ---------------------------------------------------------------------
drop policy "create own posts" on posts;
create policy "create own posts" on posts for insert to authenticated
  with check (user_id = (select auth.uid()) and likes_count = 0);

drop policy "update own posts" on posts;
create policy "update own posts" on posts for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy "delete own posts" on posts;
create policy "delete own posts" on posts for delete to authenticated
  using (user_id = (select auth.uid()) or (select is_admin()));

drop policy "write own post_dishes" on post_dishes;
create policy "insert own post_dishes" on post_dishes for insert to authenticated
  with check (exists (select 1 from posts where id = post_id and user_id = (select auth.uid())));
create policy "update own post_dishes" on post_dishes for update to authenticated
  using (exists (select 1 from posts where id = post_id and user_id = (select auth.uid())))
  with check (exists (select 1 from posts where id = post_id and user_id = (select auth.uid())));
create policy "delete own post_dishes" on post_dishes for delete to authenticated
  using (exists (select 1 from posts where id = post_id and user_id = (select auth.uid())));

drop policy "write own photos" on post_photos;
drop policy "admin delete photos" on post_photos;
create policy "insert own photos" on post_photos for insert to authenticated
  with check (exists (select 1 from posts where id = post_id and user_id = (select auth.uid())));
create policy "update own photos" on post_photos for update to authenticated
  using (exists (select 1 from posts where id = post_id and user_id = (select auth.uid())))
  with check (exists (select 1 from posts where id = post_id and user_id = (select auth.uid())));
create policy "delete own photos" on post_photos for delete to authenticated
  using ((select is_admin())
         or exists (select 1 from posts where id = post_id and user_id = (select auth.uid())));

-- ---------------------------------------------------------------------
-- Lists
-- ---------------------------------------------------------------------
drop policy "read lists" on lists;
create policy "read lists" on lists for select
  using (is_public or user_id = (select auth.uid()));

drop policy "write own lists" on lists;
create policy "insert own lists" on lists for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "update own lists" on lists for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "delete own lists" on lists for delete to authenticated
  using (user_id = (select auth.uid()));

drop policy "read list_items" on list_items;
create policy "read list_items" on list_items for select
  using (exists (select 1 from lists l
                 where l.id = list_id and (l.is_public or l.user_id = (select auth.uid()))));

drop policy "write own list_items" on list_items;
create policy "insert own list_items" on list_items for insert to authenticated
  with check (exists (select 1 from lists l where l.id = list_id and l.user_id = (select auth.uid())));
create policy "update own list_items" on list_items for update to authenticated
  using (exists (select 1 from lists l where l.id = list_id and l.user_id = (select auth.uid())))
  with check (exists (select 1 from lists l where l.id = list_id and l.user_id = (select auth.uid())));
create policy "delete own list_items" on list_items for delete to authenticated
  using (exists (select 1 from lists l where l.id = list_id and l.user_id = (select auth.uid())));

drop policy "own saves" on saves;
create policy "own saves" on saves for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- Social
-- ---------------------------------------------------------------------
drop policy "own follows" on follows;
create policy "own follows" on follows for insert to authenticated
  with check (follower_id = (select auth.uid()));

drop policy "unfollow" on follows;
create policy "unfollow" on follows for delete to authenticated
  using (follower_id = (select auth.uid()));

drop policy "own likes" on post_likes;
create policy "own likes" on post_likes for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy "unlike" on post_likes;
create policy "unlike" on post_likes for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- Safety
-- ---------------------------------------------------------------------
drop policy "own blocks" on blocks;
create policy "own blocks" on blocks for all to authenticated
  using (blocker_id = (select auth.uid())) with check (blocker_id = (select auth.uid()));

drop policy "create reports" on reports;
create policy "create reports" on reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'open');

drop policy "admin reports" on reports;
create policy "admin reports" on reports for select to authenticated
  using ((select is_admin()));

drop policy "admin resolve reports" on reports;
create policy "admin resolve reports" on reports for update to authenticated
  using ((select is_admin())) with check ((select is_admin()));

-- ---------------------------------------------------------------------
-- Covering indexes for foreign keys (joins, and cascades on account deletion)
-- ---------------------------------------------------------------------
create index blocks_blocked_ix              on blocks (blocked_id);
create index dishes_created_by_ix           on dishes (created_by);
create index list_items_dish_ix             on list_items (dish_id);
create index list_items_place_ix            on list_items (place_id);
create index lists_tag_ix                   on lists (tag_id);
create index lists_user_ix                  on lists (user_id);
create index place_members_user_ix          on place_members (user_id);
create index place_service_areas_area_ix    on place_service_areas (area_id);
create index place_tags_tag_ix              on place_tags (tag_id);
create index places_area_ix                 on places (area_id);
create index places_created_by_ix           on places (created_by);
create index post_likes_post_ix             on post_likes (post_id);
create index post_photos_dish_ix            on post_photos (dish_id);
create index profiles_home_city_ix          on profiles (home_city_id);
create index reports_reporter_ix            on reports (reporter_id);
create index reports_resolved_by_ix         on reports (resolved_by);
create index saves_place_ix                 on saves (place_id);
