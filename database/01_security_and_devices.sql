-- DormLaundry secure database + smart-plug migration
-- Run in Supabase SQL Editor only after making a database backup.
-- This migration keeps the existing four tables and adds IoT fields/tables.

begin;

create extension if not exists pgcrypto;

-- Supabase Auth is the only password store. A public table must never contain hashes.
alter table public.users drop column if exists password_hash;

-- Existing profile data is retained; new accounts are linked to auth.users by UUID.
alter table public.users alter column email set not null;
alter table public.users alter column role set default 'resident';
update public.users set role = 'resident' where role is null or role not in ('resident', 'admin');
alter table public.users alter column role set not null;

alter table public.machines
  add column if not exists power_watts numeric(10,2) not null default 0,
  add column if not exists relay_state boolean not null default true,
  add column if not exists desired_relay_state boolean not null default true,
  add column if not exists last_seen_at timestamptz,
  add column if not exists last_busy_at timestamptz,
  add column if not exists busy_threshold_w numeric(10,2) not null default 8,
  add column if not exists idle_threshold_w numeric(10,2) not null default 3,
  add column if not exists idle_confirm_seconds integer not null default 300,
  add column if not exists updated_at timestamptz not null default now();

update public.machines
set status = case
  when lower(replace(status, ' ', '_')) in ('available', 'in_use', 'out_of_service')
    then lower(replace(status, ' ', '_'))
  else 'available'
end;

alter table public.bookings
  add column if not exists ends_at timestamptz,
  add column if not exists status text not null default 'scheduled',
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz;

update public.bookings
set ends_at = slot_time + interval '2 hours'
where ends_at is null;

update public.bookings
set status = 'scheduled'
where status not in ('scheduled', 'active', 'completed', 'cancelled', 'missed');

alter table public.bookings alter column ends_at set not null;

create table if not exists public.smart_plugs (
  device_id uuid primary key default gen_random_uuid(),
  machine_id bigint not null unique references public.machines(machine_id) on delete cascade,
  device_name text not null,
  model text,
  enabled boolean not null default true,
  firmware_version text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table if not exists public.device_telemetry (
  telemetry_id bigint generated always as identity primary key,
  device_id uuid not null references public.smart_plugs(device_id) on delete cascade,
  machine_id bigint not null references public.machines(machine_id) on delete cascade,
  power_watts numeric(10,2) not null,
  voltage numeric(10,2),
  current_amps numeric(10,3),
  relay_on boolean not null,
  recorded_at timestamptz not null default now()
);

create index if not exists device_telemetry_machine_time_idx
  on public.device_telemetry (machine_id, recorded_at desc);

create table if not exists public.machine_commands (
  command_id bigint generated always as identity primary key,
  machine_id bigint not null references public.machines(machine_id) on delete cascade,
  desired_on boolean not null,
  reason text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  applied_at timestamptz
);

create index if not exists machine_commands_pending_idx
  on public.machine_commands (machine_id, created_at desc)
  where status = 'pending';

create schema if not exists private;

create table if not exists private.device_credentials (
  device_id uuid primary key references public.smart_plugs(device_id) on delete cascade,
  token_hash text not null,
  created_at timestamptz not null default now(),
  rotated_at timestamptz
);

-- Replace old, narrower constraints/indexes from Stage 1.
alter table public.users drop constraint if exists users_role_check;
alter table public.machines drop constraint if exists machines_status_check;
alter table public.machines drop constraint if exists machines_thresholds_check;
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings drop constraint if exists bookings_time_check;
alter table public.bookings drop constraint if exists bookings_machine_slot_unique;
alter table public.fault_reports drop constraint if exists fault_reports_status_check;
alter table public.machine_commands drop constraint if exists machine_commands_status_check;

alter table public.users
  add constraint users_role_check check (role in ('resident', 'admin'));
alter table public.machines
  add constraint machines_status_check check (status in ('available', 'reserved', 'starting', 'in_use', 'out_of_service', 'offline')),
  add constraint machines_thresholds_check check (
    idle_threshold_w >= 0 and busy_threshold_w > idle_threshold_w and idle_confirm_seconds between 30 and 3600
  );
alter table public.bookings
  add constraint bookings_status_check check (status in ('scheduled', 'active', 'completed', 'cancelled', 'missed')),
  add constraint bookings_time_check check (ends_at > slot_time);
alter table public.fault_reports
  add constraint fault_reports_status_check check (status in ('open', 'pending', 'resolved'));
alter table public.machine_commands
  add constraint machine_commands_status_check check (status in ('pending', 'applied', 'failed', 'superseded'));

create unique index if not exists bookings_active_machine_slot_unique
  on public.bookings (machine_id, slot_time)
  where status in ('scheduled', 'active');

-- New email/password sign-ups receive a resident profile automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (user_id, email, role, created_at)
  values (new.id, new.email, 'resident', now())
  on conflict (user_id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert or update of email on auth.users
for each row execute function public.handle_new_user();

insert into public.users (user_id, email, role, created_at)
select id, email, 'resident', coalesce(created_at, now())
from auth.users
where email is not null
on conflict (user_id) do update set email = excluded.email;

-- SECURITY DEFINER avoids recursive RLS checks. Only a boolean is returned.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- Run manually in SQL Editor. It returns the device token once and stores only its hash.
create or replace function public.register_smart_plug(
  p_machine_id bigint,
  p_device_name text,
  p_model text default null
)
returns table (device_id uuid, device_token text)
language plpgsql
security definer
set search_path = public, private
as $$
declare
  v_device_id uuid := gen_random_uuid();
  v_device_token text := encode(gen_random_bytes(32), 'hex');
begin
  insert into public.smart_plugs (device_id, machine_id, device_name, model)
  values (v_device_id, p_machine_id, p_device_name, p_model);

  insert into private.device_credentials (device_id, token_hash)
  values (v_device_id, encode(digest(v_device_token, 'sha256'), 'hex'));

  device_id := v_device_id;
  device_token := v_device_token;
  return next;
end;
$$;

-- Edge Function helper. The browser cannot access the private credential table.
create or replace function public.verify_device_credential(
  p_device_id uuid,
  p_token_hash text
)
returns table (device_id uuid, machine_id bigint, enabled boolean)
language sql
stable
security definer
set search_path = public, private
as $$
  select p.device_id, p.machine_id, p.enabled
  from public.smart_plugs p
  join private.device_credentials c using (device_id)
  where p.device_id = p_device_id
    and c.token_hash = p_token_hash
    and p.enabled = true;
$$;

-- Called only by the telemetry Edge Function with the service-role key.
-- It never turns a running washer off: desired OFF is returned only below idle threshold.
create or replace function public.process_device_telemetry(
  p_device_id uuid,
  p_power_watts numeric,
  p_voltage numeric,
  p_current_amps numeric,
  p_relay_on boolean,
  p_recorded_at timestamptz default now()
)
returns table (
  machine_id bigint,
  machine_status text,
  desired_relay_on boolean,
  command_reason text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_machine public.machines%rowtype;
  v_booking public.bookings%rowtype;
  v_desired boolean := true;
  v_status text := 'available';
  v_reason text := 'No active reservation: outlet stays on';
  v_now timestamptz := coalesce(p_recorded_at, now());
begin
  select m.* into v_machine
  from public.machines m
  join public.smart_plugs p on p.machine_id = m.machine_id
  where p.device_id = p_device_id and p.enabled = true
  for update of m;

  if not found then
    raise exception 'Unknown or disabled smart plug';
  end if;

  insert into public.device_telemetry (
    device_id, machine_id, power_watts, voltage, current_amps, relay_on, recorded_at
  ) values (
    p_device_id, v_machine.machine_id, greatest(coalesce(p_power_watts, 0), 0),
    p_voltage, p_current_amps, p_relay_on, v_now
  );

  update public.smart_plugs
  set last_seen_at = v_now
  where device_id = p_device_id;

  select b.* into v_booking
  from public.bookings b
  where b.machine_id = v_machine.machine_id
    and b.status in ('scheduled', 'active')
    and b.slot_time <= v_now
    and b.ends_at > v_now
  order by b.slot_time
  limit 1
  for update;

  if p_power_watts >= v_machine.busy_threshold_w then
    v_desired := true;
    v_status := 'in_use';
    v_reason := 'Power draw confirms that the washer is running';
    update public.machines set last_busy_at = v_now where public.machines.machine_id = v_machine.machine_id;
  elsif v_booking.booking_id is not null and v_booking.status = 'active' then
    if v_machine.last_busy_at is not null
       and v_booking.started_at is not null
       and v_machine.last_busy_at >= v_booking.started_at
       and v_machine.last_busy_at <= v_now - make_interval(secs => v_machine.idle_confirm_seconds) then
      update public.bookings
      set status = 'completed', completed_at = v_now
      where booking_id = v_booking.booking_id;
      v_desired := true;
      v_status := 'available';
      v_reason := 'Cycle finished: outlet remains on';
    else
      v_desired := true;
      v_status := 'starting';
      v_reason := 'Booking owner started the washer';
    end if;
  elsif v_booking.booking_id is not null and v_booking.status = 'scheduled' then
    v_desired := false;
    v_status := 'reserved';
    v_reason := 'Reserved slot: waiting for the booking owner';
  elsif v_machine.status = 'out_of_service' then
    v_desired := false;
    v_status := 'out_of_service';
    v_reason := 'Administrator marked the washer out of service';
  else
    v_desired := true;
    v_status := 'available';
    v_reason := 'No active reservation: outlet stays on';
  end if;

  -- Physical safety guard: do not cut relay power while meaningful load is measured.
  if p_power_watts > v_machine.idle_threshold_w then
    v_desired := true;
  end if;

  update public.machines
  set power_watts = greatest(coalesce(p_power_watts, 0), 0),
      relay_state = p_relay_on,
      desired_relay_state = v_desired,
      status = v_status,
      last_seen_at = v_now,
      updated_at = now()
  where public.machines.machine_id = v_machine.machine_id;

  machine_id := v_machine.machine_id;
  machine_status := v_status;
  desired_relay_on := v_desired;
  command_reason := v_reason;
  return next;
end;
$$;

-- Keep the current database private by deleting every old policy before creating the audited set.
do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('users', 'machines', 'bookings', 'fault_reports', 'smart_plugs', 'device_telemetry', 'machine_commands')
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

alter table public.users enable row level security;
alter table public.machines enable row level security;
alter table public.bookings enable row level security;
alter table public.fault_reports enable row level security;
alter table public.smart_plugs enable row level security;
alter table public.device_telemetry enable row level security;
alter table public.machine_commands enable row level security;

revoke all on table public.users, public.machines, public.bookings, public.fault_reports,
  public.smart_plugs, public.device_telemetry, public.machine_commands from anon;

revoke all on table public.users, public.machines, public.bookings, public.fault_reports,
  public.smart_plugs, public.device_telemetry, public.machine_commands from authenticated;

grant select on public.users, public.machines, public.bookings, public.fault_reports to authenticated;
grant insert, delete on public.bookings to authenticated;
grant insert on public.fault_reports to authenticated;
grant update on public.machines, public.fault_reports to authenticated;
grant select on public.smart_plugs, public.device_telemetry, public.machine_commands to authenticated;

create policy profiles_select_own_or_admin on public.users
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy machines_read_authenticated on public.machines
for select to authenticated using (true);

create policy machines_admin_update on public.machines
for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy bookings_select_own_or_admin on public.bookings
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy bookings_insert_own on public.bookings
for insert to authenticated
with check (user_id = auth.uid() and status = 'scheduled');

create policy bookings_delete_own_or_admin on public.bookings
for delete to authenticated
using ((user_id = auth.uid() and status = 'scheduled') or public.is_admin());

create policy faults_select_own_or_admin on public.fault_reports
for select to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy faults_insert_own on public.fault_reports
for insert to authenticated
with check (user_id = auth.uid() and status = 'open');

create policy faults_admin_update on public.fault_reports
for update to authenticated
using (public.is_admin()) with check (public.is_admin());

create policy smart_plugs_admin_read on public.smart_plugs
for select to authenticated using (public.is_admin());

create policy telemetry_admin_read on public.device_telemetry
for select to authenticated using (public.is_admin());

create policy commands_admin_read on public.machine_commands
for select to authenticated using (public.is_admin());

revoke all on function public.is_admin() from public;
revoke all on function public.register_smart_plug(bigint, text, text) from public, anon, authenticated;
revoke all on function public.verify_device_credential(uuid, text) from public;
revoke all on function public.process_device_telemetry(uuid, numeric, numeric, numeric, boolean, timestamptz) from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.verify_device_credential(uuid, text) to service_role;
grant execute on function public.process_device_telemetry(uuid, numeric, numeric, numeric, boolean, timestamptz) to service_role;

commit;

-- AFTER COMMIT: register one plug. Copy the returned token immediately; it is shown once.
-- select * from public.register_smart_plug(1, 'Washer 1 plug', 'Shelly Plug S Gen3');
-- Keep device_token only in device-agent/.env. Never place it in website files.
