-- Optional synthetic coursework data. NOT evidence of inserted or existing rows.
-- Run only in a disposable TEST project after the core schema and migration.
-- Requires 10+ test Auth accounts with @example.com email, created through Auth.
-- Uses 10 such accounts, creates/reuses 12 test washers, and inserts 120 bookings
-- plus 12 fault reports. Does not create fake auth.users records.
BEGIN;
DO $$ BEGIN
 IF (SELECT count(*) FROM public.users WHERE email LIKE 'dl-test-%@example.com') < 10 THEN
  RAISE EXCEPTION 'Create 10 Auth test accounts dl-test-01@example.com through dl-test-10@example.com first.';
 END IF;
END $$;
INSERT INTO public.machines(machine_name,status,location)
SELECT 'Coursework washer '||n, 'available', 'Test residence '||(((n-1)/3)+1)
FROM generate_series(1,12) AS n ON CONFLICT (machine_name) DO NOTHING;
WITH u AS (
 SELECT user_id,row_number() OVER (ORDER BY email) AS rn
 FROM (SELECT user_id,email FROM public.users WHERE email LIKE 'dl-test-%@example.com' ORDER BY email LIMIT 10) q
), m AS (
 SELECT machine_id,row_number() OVER (ORDER BY machine_name) AS rn
 FROM public.machines WHERE machine_name LIKE 'Coursework washer %'
)
INSERT INTO public.bookings(user_id,machine_id,slot_time,ends_at,status)
SELECT u.user_id,m.machine_id,
 timestamptz '2026-10-01 08:00:00+05' + ((g-1)/12)*interval '1 day',
 timestamptz '2026-10-01 10:00:00+05' + ((g-1)/12)*interval '1 day','scheduled'
FROM generate_series(1,120) AS g
JOIN u ON u.rn=((g-1)%10)+1 JOIN m ON m.rn=((g-1)%12)+1
ON CONFLICT DO NOTHING;
WITH u AS (
 SELECT user_id,row_number() OVER (ORDER BY email) AS rn
 FROM (SELECT user_id,email FROM public.users WHERE email LIKE 'dl-test-%@example.com' ORDER BY email LIMIT 10) q
), m AS (
 SELECT machine_id,row_number() OVER (ORDER BY machine_name) AS rn
 FROM public.machines WHERE machine_name LIKE 'Coursework washer %'
)
INSERT INTO public.fault_reports(user_id,machine_id,description,status)
SELECT u.user_id,m.machine_id,
 (ARRAY['Water remains after the rinse cycle.','Door does not lock before starting.','Unusual noise during the spin cycle.','Detergent drawer needs cleaning.'])[((g-1)%4)+1], 'open'
FROM generate_series(1,12) AS g JOIN u ON u.rn=((g-1)%10)+1 JOIN m ON m.rn=g;
COMMIT;
-- Run once in the test project. Re-running can add duplicate fault reports.
-- Capture actual counts with verify_evidence.sql after execution.
