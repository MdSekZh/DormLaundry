-- DormLaundry: administrator deletes a washing machine from the website.
-- Run once in Supabase -> SQL Editor (after final_features.sql). Safe to re-run.
-- Rule: a machine with a booking that is running right now (status 'active') cannot be deleted.
-- Everything that belongs to the machine is removed with it:
-- bookings, fault reports, smart plug, plug token, telemetry and commands.
create or replace function public.admin_delete_machine(p_machine_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator only';
  end if;
  if not exists (select 1 from public.machines m where m.machine_id = p_machine_id) then
    raise exception 'Machine not found';
  end if;
  if exists (
    select 1 from public.bookings b
    where b.machine_id = p_machine_id and b.status = 'active'
  ) then
    raise exception 'This machine is in use now. Wait until the wash ends.';
  end if;

  delete from public.bookings b where b.machine_id = p_machine_id;
  delete from public.fault_reports f where f.machine_id = p_machine_id;
  -- smart_plugs, device_telemetry, machine_commands and the plug token go by ON DELETE CASCADE
  delete from public.machines m where m.machine_id = p_machine_id;
end;
$$;

revoke all on function public.admin_delete_machine(bigint) from public, anon;
grant execute on function public.admin_delete_machine(bigint) to authenticated;
