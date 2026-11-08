-- DormLaundry (optional): let a resident mark their own scheduled booking as "cancelled".
-- Without it, the site deletes a cancelled booking, so cancellations never appear in the statistics.
-- Run in Supabase -> SQL Editor.
grant update (status) on public.bookings to authenticated;

drop policy if exists bookings_cancel_own on public.bookings;
create policy bookings_cancel_own
  on public.bookings
  for update
  to authenticated
  using (user_id = auth.uid() and status = 'scheduled')
  with check (user_id = auth.uid() and status = 'cancelled');
