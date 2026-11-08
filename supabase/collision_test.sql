-- DormLaundry: collision test for success criterion 2 ("zero overlapping active bookings in 50 collision tests").
-- Run in Supabase -> SQL Editor AFTER prevent_overlaps.sql. Nothing is saved: the block ends with an
-- error on purpose, which rolls back every test row. Read the result in the error message:
--   COLLISION TEST: 50 attempts, 50 rejected, 0 accepted
-- "0 accepted" means no overlapping booking got in.
do $$
declare
  v_user    uuid;
  v_machine bigint;
  v_base    timestamptz := date_trunc('hour', now()) + interval '30 days';
  i         int;
  v_start   timestamptz;
  v_minutes int;
  v_rejected int := 0;
  v_accepted int := 0;
begin
  select user_id    into v_user    from public.users    limit 1;
  select machine_id into v_machine from public.machines order by machine_id limit 1;

  -- the first booking: 1 hour, 30 days from now (rolled back at the end)
  insert into public.bookings (user_id, machine_id, slot_time, ends_at, status)
  values (v_user, v_machine, v_base, v_base + interval '1 hour', 'scheduled');

  -- 50 attempts that all overlap it: start 17 min before .. 32 min after, length 30-120 min
  for i in 1..50 loop
    v_start   := v_base + make_interval(mins => i - 18);
    v_minutes := 30 + (i % 4) * 30;
    begin
      insert into public.bookings (user_id, machine_id, slot_time, ends_at, status)
      values (v_user, v_machine, v_start, v_start + make_interval(mins => v_minutes), 'scheduled');
      v_accepted := v_accepted + 1;
    exception when others then
      v_rejected := v_rejected + 1;
    end;
  end loop;

  raise exception 'COLLISION TEST: 50 attempts, % rejected, % accepted (all test rows rolled back)', v_rejected, v_accepted;
end $$;
