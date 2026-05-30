-- Quick manual verification for async battles.
-- Run in Supabase SQL editor while authenticated as each test user.

-- 1) As challenger user:
-- select public.ensure_user_profile('Challenger');
-- insert into public.user_stars (user_id, stars) values (auth.uid(), 10)
--   on conflict (user_id) do update set stars = excluded.stars;

-- 2) As opponent user:
-- select public.ensure_user_profile('Opponent');
-- insert into public.user_stars (user_id, stars) values (auth.uid(), 10)
--   on conflict (user_id) do update set stars = excluded.stars;

-- 3) As challenger: create challenge (replace <opponent_uuid>, hash/salt/moves as needed)
-- Example hash for moves rock,paper,scissors + salt demo123:
-- select encode(digest('rock,paper,scissors:demo123', 'sha256'), 'hex');
insert into public.battle_matches (
  challenger_user_id,
  opponent_user_id,
  star_wager,
  challenger_moves_hash,
  challenger_moves_salt
)
values (
  auth.uid(),
  '<opponent_uuid>'::uuid,
  1,
  encode(digest('rock,paper,scissors:demo123', 'sha256'), 'hex'),
  'demo123'
)
returning id;

-- 4) As opponent: submit moves (replace <match_uuid>)
-- select public.submit_battle_opponent_moves('<match_uuid>'::uuid, array['scissors','rock','paper']);

-- 5) As challenger: resolve (replace <match_uuid>)
-- select public.resolve_battle_match('<match_uuid>'::uuid, array['rock','paper','scissors'], 'demo123');

-- 6) Check result and stars as either participant:
-- select id, status, winner_user_id, resolved_at from public.battle_matches where id = '<match_uuid>'::uuid;
-- select user_id, stars from public.user_stars
-- where user_id in (
--   select challenger_user_id from public.battle_matches where id = '<match_uuid>'::uuid
--   union all
--   select opponent_user_id from public.battle_matches where id = '<match_uuid>'::uuid
-- );
-- select event_type, payload, created_at from public.battle_events
-- where match_id = '<match_uuid>'::uuid order by created_at asc;
