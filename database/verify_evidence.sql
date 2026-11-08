-- Read-only evidence capture. Run using an authorised database administrator.
select 'users' as table_name, count(*) as row_count from public.users
union all select 'machines', count(*) from public.machines
union all select 'bookings', count(*) from public.bookings
union all select 'fault_reports', count(*) from public.fault_reports;
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public' order by tablename, policyname;
select conrelid::regclass as table_name, conname, pg_get_constraintdef(oid)
from pg_constraint where connamespace = 'public'::regnamespace;
select tablename, indexname, indexdef from pg_indexes where schemaname = 'public';
-- Individual defense query:
select machine_id, count(*) as booking_count from public.bookings group by machine_id order by machine_id;
