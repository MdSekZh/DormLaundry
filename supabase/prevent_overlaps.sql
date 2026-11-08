-- DormLaundry: prevent overlapping bookings of the same washer (Stage 1 requirement R4).
-- The existing unique index only stops two bookings with the SAME start time. Because bookings now
-- have any start time and 30-120 minute length, the database needs a real overlap rule.
-- Run in Supabase -> SQL Editor. Run step 1 first: it must return no rows.

-- 1. Existing overlapping active bookings (none are allowed before step 2)
select a.booking_id as booking_a, b.booking_id as booking_b, a.machine_id,
       a.slot_time as a_start, a.ends_at as a_end, b.slot_time as b_start, b.ends_at as b_end
from public.bookings a
join public.bookings b
  on a.machine_id = b.machine_id
 and a.booking_id < b.booking_id
 and a.status in ('scheduled', 'active')
 and b.status in ('scheduled', 'active')
 and tstzrange(a.slot_time, a.ends_at) && tstzrange(b.slot_time, b.ends_at);

-- If rows appear, cancel one booking of every pair, for example:
--   update public.bookings set status = 'cancelled' where booking_id = '<booking_b value>';

-- 2. The rule: two scheduled/active bookings of one machine may never overlap in time.
--    (A booking ending at 11:00 and another starting at 11:00 is allowed.)
create extension if not exists btree_gist with schema extensions;
alter table public.bookings drop constraint if exists bookings_no_overlap;
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (machine_id with =, tstzrange(slot_time, ends_at) with &&)
  where (status in ('scheduled', 'active'));
