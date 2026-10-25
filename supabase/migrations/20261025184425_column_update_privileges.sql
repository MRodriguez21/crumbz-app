-- =====================================================================
-- Protect counters and ownership columns from client-side updates.
--
-- 0001 tried `revoke update (col, ...) on <table> from authenticated`, but Supabase grants
-- table-level UPDATE to anon/authenticated, and a column-level revoke does not narrow a
-- table-level grant in Postgres. Clients could still inflate likes/follower counters or move
-- a post to another place (desyncing place counters and rankings).
--
-- Fix: drop table-level UPDATE and grant it back only on user-editable columns.
-- Counters keep being maintained by the security definer triggers.
-- New columns are NOT client-updatable until added here (safe default).
-- =====================================================================

revoke update on table profiles from anon, authenticated;
grant update (username, display_name, avatar_path, bio, home_city_id)
  on table profiles to authenticated;

revoke update on table posts from anon, authenticated;
grant update (rating, body, mode, spend_per_person_usd, visited_on)
  on table posts to authenticated;
