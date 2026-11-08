-- DormLaundry: replies and dates for fault reports.
-- Run once in Supabase -> SQL Editor -> New query -> Run.

alter table public.fault_reports
  add column if not exists admin_response text,
  add column if not exists responded_at timestamptz,
  add column if not exists resolved_at timestamptz;

-- Optional: let every signed-in resident read the fault history of a washer.
-- (Policies are additive: this does not remove any existing policy.)
drop policy if exists fault_reports_read_authenticated on public.fault_reports;
create policy fault_reports_read_authenticated
  on public.fault_reports
  for select
  to authenticated
  using (true);

-- Make the API see the new columns immediately.
notify pgrst, 'reload schema';
