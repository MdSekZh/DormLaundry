-- DormLaundry: Final project features (run once in Supabase SQL Editor, after 01_security_and_devices.sql)
-- Adds three SECURITY DEFINER functions instead of widening table rights:
--   1. machine_busy_slots()      - R2: residents see WHEN a washer is booked, never WHO booked it
--   2. reschedule_booking(...)   - R5: owner moves own scheduled booking; bookings_no_overlap still protects
--   3. admin_save_machine(...)   - R8: administrator adds or edits a machine (name, location)
-- Safe to re-run (create or replace).

create or replace function public.machine_busy_slots()
returns table (machine_id bigint, slot_time timestamptz, ends_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select b.machine_id, b.slot_time, b.ends_at
  from public.bookings b
  where b.status in ('scheduled', 'active')
    and b.ends_at > now()
  order by b.slot_time;
$$;

revoke all on function public.machine_busy_slots() from public, anon;
grant execute on function public.machine_busy_slots() to authenticated;


create or replace function public.reschedule_booking(
  p_booking_id uuid,
  p_new_start timestamptz,
  p_minutes integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.bookings%rowtype;
begin
  if p_minutes not between 15 and 240 then
    raise exception 'Duration must be between 15 and 240 minutes';
  end if;
  if p_new_start < now() - interval '1 minute' then
    raise exception 'The new time has already passed';
  end if;

  select * into v_row from public.bookings where booking_id = p_booking_id for update;
  if not found then
    raise exception 'Booking not found';
  end if;
  if v_row.user_id <> auth.uid() then
    raise exception 'You can only change your own booking';
  end if;
  if v_row.status <> 'scheduled' then
    raise exception 'Only a scheduled booking can be moved';
  end if;

  -- the exclusion constraint bookings_no_overlap rejects any clash with another booking
  update public.bookings
  set slot_time = p_new_start,
      ends_at = p_new_start + make_interval(mins => p_minutes)
  where booking_id = p_booking_id;
end;
$$;

revoke all on function public.reschedule_booking(uuid, timestamptz, integer) from public, anon;
grant execute on function public.reschedule_booking(uuid, timestamptz, integer) to authenticated;


create or replace function public.admin_save_machine(
  p_machine_id bigint,   -- null = create a new machine
  p_name text,
  p_location text
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  if not public.is_admin() then
    raise exception 'Administrator only';
  end if;
  if char_length(trim(coalesce(p_name, ''))) not between 2 and 40 then
    raise exception 'Machine name must be 2-40 characters';
  end if;
  if char_length(trim(coalesce(p_location, ''))) not between 2 and 80 then
    raise exception 'Location must be 2-80 characters';
  end if;

  if p_machine_id is null then
    insert into public.machines (machine_name, location)
    values (trim(p_name), trim(p_location))
    returning machine_id into v_id;
  else
    update public.machines
    set machine_name = trim(p_name), location = trim(p_location)
    where machine_id = p_machine_id
    returning machine_id into v_id;
    if v_id is null then
      raise exception 'Machine not found';
    end if;
  end if;
  return v_id;
end;
$$;

revoke all on function public.admin_save_machine(bigint, text, text) from public, anon;
grant execute on function public.admin_save_machine(bigint, text, text) to authenticated;

-- Check:  select * from public.machine_busy_slots();


-- R8 (continued): administrator issues smart-plug credentials from the website.
-- Creates the plug record if missing and (re)generates the token; only the SHA-256 hash is stored.
-- The token is returned once. Calling it again rotates the token (the old one stops working).
create or replace function public.admin_issue_plug_token(p_machine_id bigint)
returns table (device_id uuid, device_token text, machine_name text)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_name text;
  v_device uuid;
  v_token text := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
begin
  if not public.is_admin() then
    raise exception 'Administrator only';
  end if;
  select m.machine_name into v_name from public.machines m where m.machine_id = p_machine_id;
  if v_name is null then
    raise exception 'Machine not found';
  end if;

  insert into public.smart_plugs (machine_id, device_name, model)
  values (p_machine_id, 'Simulated plug ' || v_name, 'simulator')
  on conflict (machine_id) do nothing;

  select p.device_id into v_device from public.smart_plugs p where p.machine_id = p_machine_id;

  delete from private.device_credentials c where c.device_id = v_device;
  insert into private.device_credentials (device_id, token_hash)
  values (v_device, encode(sha256(convert_to(v_token, 'UTF8')), 'hex'));

  device_id := v_device;
  device_token := v_token;
  machine_name := v_name;
  return next;
end;
$$;

revoke all on function public.admin_issue_plug_token(bigint) from public, anon;
grant execute on function public.admin_issue_plug_token(bigint) to authenticated;
