-- =====================================================================
-- Security advisor fixes (lints 0011, 0028, 0029).
-- =====================================================================

-- Pin search_path so callers can't shadow objects (PostGIS lives in `extensions`).
alter function public.touch_updated_at() set search_path = public;
alter function public.places_nearby(double precision, double precision, int, int)
  set search_path = public, extensions;
alter function public.top_places(smallint, text, int, int) set search_path = public;

-- Trigger functions must not be callable through /rest/v1/rpc. Triggers still fire:
-- EXECUTE is only checked when the trigger is created, not when it runs.
revoke execute on function
  public.on_post_change(),
  public.on_post_dish_change(),
  public.on_follow_change(),
  public.on_save_change(),
  public.on_like_change(),
  public.touch_updated_at()
from public, anon, authenticated;

-- Kept on purpose:
-- - is_admin(): RLS policies call it as the querying role, so anon/authenticated need EXECUTE.
--   It only reveals whether the caller is an admin.
-- - place_rankings (materialized view in API): public aggregated scores, read by top_places().
