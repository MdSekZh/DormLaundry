// Checks that the signed-in user owns the booking before the outlet is switched on
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const jsonHeaders = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function response(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: jsonHeaders });
  if (request.method !== "POST") return response(405, { error: "POST required" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) return response(500, { error: "Server is not configured" });
  if (!authorization?.startsWith("Bearer ")) return response(401, { error: "Sign-in required" });

  let payload: { booking_id?: string };
  try {
    payload = await request.json();
  } catch {
    return response(400, { error: "Invalid JSON" });
  }
  if (!payload.booking_id) return response(400, { error: "booking_id is required" });

  // 1. Проверяем пользователя через токен
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return response(401, { error: "Invalid session" });

  // 2. Используем admin-клиент для чтения бронирования и управления устройствами
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: booking, error: bookingError } = await admin
    .from("bookings")
    .select("booking_id, user_id, machine_id, slot_time, ends_at, status")
    .eq("booking_id", payload.booking_id)
    .maybeSingle();

  if (bookingError) return response(500, { error: "Booking lookup failed" });
  if (!booking) return response(404, { error: "Booking not found" });
  if (booking.user_id !== userData.user.id) return response(403, { error: "This is not your booking" });
  if (booking.status !== "scheduled") return response(409, { error: "Booking has already started or ended" });

  // 3. Проверяем временной интервал (можно запустить за 15 минут до начала и до конца слота)
  const now = Date.now();
  const opensAt = new Date(booking.slot_time).getTime() - 15 * 60 * 1000;
  const endsAt = new Date(booking.ends_at).getTime();
  if (now < opensAt || now >= endsAt) {
    return response(409, { error: "Start is allowed from 15 minutes before the slot until its end" });
  }

  const startedAt = new Date().toISOString();

  // 4. Обновляем статус бронирования с проверкой (защита от двойного клика / Race Condition)
  const { data: updatedBooking, error: updateError } = await admin
    .from("bookings")
    .update({ status: "active", started_at: startedAt })
    .eq("booking_id", booking.booking_id)
    .eq("status", "scheduled")
    .select()
    .maybeSingle();

  if (updateError || !updatedBooking) {
    return response(409, { error: "Could not start booking or it was already started" });
  }

  // 5. Обновляем статус стиральной машины в таблице machines
  const { error: machineError } = await admin
    .from("machines")
    .update({ status: "starting", desired_relay_state: true, updated_at: startedAt })
    .eq("machine_id", booking.machine_id);

  if (machineError) {
    // В продакшене здесь можно откатить статус бронирования назад, если машина не обновилась
    return response(500, { error: "Failed to update machine status" });
  }

  // 6. Создаем команду для аппаратного реле
  const { error: commandError } = await admin.from("machine_commands").insert({
    machine_id: booking.machine_id,
    desired_on: true,
    reason: `Booking ${booking.booking_id} started by its owner`,
  });

  if (commandError) {
    return response(500, { error: "Failed to dispatch machine command" });
  }

  return response(200, { ok: true, status: "active", desired_relay_on: true });
});
