-- DormLaundry: register simulated smart plugs for Washer 2 and Washer 3.
-- Run in Supabase -> SQL Editor -> New query -> Run (all four statements together).
-- The last result lists device_id and token: copy them into DEVICES in fake_plug.py.
-- The token is shown only now (the database stores just its SHA-256 hash).
-- Run it again any time to create NEW tokens for these two plugs.

-- 1. one plug row per washer (skipped if it already exists)
insert into public.smart_plugs (machine_id, device_name, model)
select machine_id, 'Simulated plug ' || machine_name, 'simulator'
from public.machines
where machine_name in ('Washer 2', 'Washer 3')
on conflict (machine_id) do nothing;

-- 2. forget old credentials of these two plugs
delete from private.device_credentials
where device_id in (
  select p.device_id
  from public.smart_plugs p
  join public.machines m on m.machine_id = p.machine_id
  where m.machine_name in ('Washer 2', 'Washer 3')
);

-- 3. + 4. new random token per plug, store only its SHA-256 hash, show the token once
with secrets as (
  select p.device_id,
         m.machine_name,
         replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '') as token
  from public.smart_plugs p
  join public.machines m on m.machine_id = p.machine_id
  where m.machine_name in ('Washer 2', 'Washer 3')
),
stored as (
  insert into private.device_credentials (device_id, token_hash)
  select device_id, encode(sha256(convert_to(token, 'UTF8')), 'hex') from secrets
  returning device_id
)
select s.machine_name, s.device_id, s.token
from secrets s
join stored using (device_id)
order by s.machine_name;
