alter function public.approve_submission(
  p_submission_id uuid,
  p_reviewed_by text
)
set search_path = public, pg_temp;

alter function public.create_pending_submission(
  p_rider_name text,
  p_found_location_map_url text,
  p_match_photo_url text,
  p_next_title text,
  p_next_clue text,
  p_next_hidden_location_map_url text,
  p_next_tag_photo_url text
)
set search_path = public, pg_temp;

alter function public.create_pending_submission(
  p_rider_name text,
  p_found_location_map_url text,
  p_match_photo_url text,
  p_next_title text,
  p_next_clue text,
  p_next_hidden_location_map_url text,
  p_next_tag_photo_url text,
  p_found_latitude numeric,
  p_found_longitude numeric,
  p_found_location_accuracy_meters numeric,
  p_found_location_captured_at timestamp with time zone,
  p_next_hidden_latitude numeric,
  p_next_hidden_longitude numeric,
  p_next_hidden_location_accuracy_meters numeric,
  p_next_hidden_location_captured_at timestamp with time zone
)
set search_path = public, pg_temp;

alter function public.reject_submission(
  p_submission_id uuid,
  p_reviewed_by text,
  p_rejection_reason text
)
set search_path = public, pg_temp;

alter function public.set_updated_at()
set search_path = public, pg_temp;

alter function public.submit_bike_tag(
  p_rider_name text,
  p_found_location_map_url text,
  p_match_photo_url text,
  p_next_title text,
  p_next_clue text,
  p_next_hidden_location_map_url text,
  p_next_tag_photo_url text
)
set search_path = public, pg_temp;

alter function public.update_updated_at_column()
set search_path = public, pg_temp;

revoke execute on function public.approve_submission(
  p_submission_id uuid,
  p_reviewed_by text
)
from public, anon, authenticated;

revoke execute on function public.create_pending_submission(
  p_rider_name text,
  p_found_location_map_url text,
  p_match_photo_url text,
  p_next_title text,
  p_next_clue text,
  p_next_hidden_location_map_url text,
  p_next_tag_photo_url text
)
from public, anon, authenticated;

revoke execute on function public.create_pending_submission(
  p_rider_name text,
  p_found_location_map_url text,
  p_match_photo_url text,
  p_next_title text,
  p_next_clue text,
  p_next_hidden_location_map_url text,
  p_next_tag_photo_url text,
  p_found_latitude numeric,
  p_found_longitude numeric,
  p_found_location_accuracy_meters numeric,
  p_found_location_captured_at timestamp with time zone,
  p_next_hidden_latitude numeric,
  p_next_hidden_longitude numeric,
  p_next_hidden_location_accuracy_meters numeric,
  p_next_hidden_location_captured_at timestamp with time zone
)
from public, anon, authenticated;

revoke execute on function public.reject_submission(
  p_submission_id uuid,
  p_reviewed_by text,
  p_rejection_reason text
)
from public, anon, authenticated;

revoke execute on function public.set_updated_at()
from public, anon, authenticated;

revoke execute on function public.submit_bike_tag(
  p_rider_name text,
  p_found_location_map_url text,
  p_match_photo_url text,
  p_next_title text,
  p_next_clue text,
  p_next_hidden_location_map_url text,
  p_next_tag_photo_url text
)
from public, anon, authenticated;

revoke execute on function public.update_updated_at_column()
from public, anon, authenticated;

grant execute on function public.approve_submission(
  p_submission_id uuid,
  p_reviewed_by text
)
to service_role;

grant execute on function public.create_pending_submission(
  p_rider_name text,
  p_found_location_map_url text,
  p_match_photo_url text,
  p_next_title text,
  p_next_clue text,
  p_next_hidden_location_map_url text,
  p_next_tag_photo_url text
)
to service_role;

grant execute on function public.create_pending_submission(
  p_rider_name text,
  p_found_location_map_url text,
  p_match_photo_url text,
  p_next_title text,
  p_next_clue text,
  p_next_hidden_location_map_url text,
  p_next_tag_photo_url text,
  p_found_latitude numeric,
  p_found_longitude numeric,
  p_found_location_accuracy_meters numeric,
  p_found_location_captured_at timestamp with time zone,
  p_next_hidden_latitude numeric,
  p_next_hidden_longitude numeric,
  p_next_hidden_location_accuracy_meters numeric,
  p_next_hidden_location_captured_at timestamp with time zone
)
to service_role;

grant execute on function public.reject_submission(
  p_submission_id uuid,
  p_reviewed_by text,
  p_rejection_reason text
)
to service_role;

grant execute on function public.set_updated_at()
to service_role;

grant execute on function public.submit_bike_tag(
  p_rider_name text,
  p_found_location_map_url text,
  p_match_photo_url text,
  p_next_title text,
  p_next_clue text,
  p_next_hidden_location_map_url text,
  p_next_tag_photo_url text
)
to service_role;

grant execute on function public.update_updated_at_column()
to service_role;

notify pgrst, 'reload schema';