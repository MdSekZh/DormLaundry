-- DormLaundry - data analysis (Project Stage 2, Part C)
-- How to repeat: Supabase -> SQL Editor -> New query -> paste ONE query -> Run.
-- The same three questions are drawn as charts in the app (Administrator -> Statistics).
-- Time zone: slot_time is stored in UTC; the queries convert it to Astana time (UTC+5).

-- 0. Size of the main table (the task needs at least 100 records)
select count(*) as booking_records from public.bookings;

-- Q1. At which hours of the day are the washers booked most?
--     (line chart: x = hour of day, y = number of bookings)
select extract(hour from slot_time at time zone 'Asia/Almaty')::int as hour_of_day,
       count(*)                                                      as bookings
from public.bookings
group by 1
order by 1;

-- Q2. Which washer is booked most often?
--     (bar chart: x = machine, y = number of bookings)
select m.machine_name,
       count(*) as bookings
from public.bookings b
join public.machines m using (machine_id)
group by m.machine_name
order by bookings desc;

-- Q3. What share of the bookings of each washer is cancelled?
--     (bar chart: x = machine, y = cancelled bookings in %)
select m.machine_name,
       count(*)                                                       as bookings,
       count(*) filter (where b.status = 'cancelled')                 as cancelled,
       round(100.0 * count(*) filter (where b.status = 'cancelled') / count(*), 1) as cancelled_pct
from public.bookings b
join public.machines m using (machine_id)
group by m.machine_name
order by cancelled_pct desc;
