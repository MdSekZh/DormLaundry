-- DormLaundry: issue NEW device tokens for all three simulated plugs (Washer 1, 2, 3).
-- Run in Supabase -> SQL Editor -> Run. The last result shows device_id and token ONCE:
-- paste them into devices.json (never into git). The database stores only the SHA-256 hash.
-- Run again at any time to rotate the tokens (the old ones stop working).

insert into public.smart_plugs (machine_id, device_name, model)
select machine_id, 'Simulated plug ' || machine_name, 'simulator'
from public.machines
where machine_name in ('Washer 1', 'Washer 2', 'Washer 3')
on conflict (machine_id) do nothing;

delete from private.device_credentials
where device_id in (
  select p.device_id from public.smart_plugs p
  join public.machines m on m.machine_id = p.machine_id
  where m.machine_name in ('Washer 1', 'Washer 2', 'Washer 3')
);

with secrets as (
  select p.device_id, m.machine_name,
         replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '') as token
  from public.smart_plugs p
  join public.machines m on m.machine_id = p.machine_id
  where m.machine_name in ('Washer 1', 'Washer 2', 'Washer 3')
),
stored as (
  insert into private.device_credentials (device_id, token_hash)
  select device_id, encode(sha256(convert_to(token, 'UTF8')), 'hex') from secrets
  returning device_id
)
select s.machine_name, s.device_id, s.token
from secrets s join stored using (device_id)
order by s.machine_name;
