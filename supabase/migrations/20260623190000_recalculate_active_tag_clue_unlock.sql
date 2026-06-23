with current_game_setting as (
  select coalesce(
    (
      select clue_unlock_delay_days::integer
      from public.game_settings
      where id = true
    ),
    5
  ) as clue_unlock_delay_days
)
update public.tags as tag
set clue_unlocks_at =
  tag.created_at + make_interval(
    days => current_game_setting.clue_unlock_delay_days
  )
from current_game_setting
where tag.status = 'active'
  and tag.clue_unlocks_at is distinct from (
    tag.created_at + make_interval(
      days => current_game_setting.clue_unlock_delay_days
    )
  );
