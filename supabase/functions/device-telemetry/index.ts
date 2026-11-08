import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const jsonHeaders = { "Content-Type": "application/json" };

function response(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return response(405, { error: "POST required" });

  const deviceId = request.headers.get("X-Device-Id")?.trim();
  const deviceToken = request.headers.get("X-Device-Token")?.trim();
  if (!deviceId || !deviceToken) return response(401, { error: "Missing device credentials" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return response(500, { error: "Server is not configured" });

  let payload: Record<string, unknown>;
  try {
    payload = await request.json();
  } catch {
    return response(400, { error: "Invalid JSON" });
  }

  const powerWatts = Number(payload.power_watts);
  const voltage = payload.voltage == null ? null : Number(payload.voltage);
  const currentAmps = payload.current_amps == null ? null : Number(payload.current_amps);
  const relayOn = payload.relay_on;
  if (!Number.isFinite(powerWatts) || powerWatts < 0 || typeof relayOn !== "boolean") {
    return response(400, { error: "power_watts and relay_on are required" });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tokenHash = await sha256(deviceToken);
  const { data: credentials, error: authError } = await admin.rpc("verify_device_credential", {
    p_device_id: deviceId,
    p_token_hash: tokenHash,
  });

  if (authError) return response(500, { error: "Device verification failed" });
  if (!credentials?.length) return response(401, { error: "Invalid device credentials" });

  const { data, error } = await admin.rpc("process_device_telemetry", {
    p_device_id: deviceId,
    p_power_watts: powerWatts,
    p_voltage: Number.isFinite(voltage) ? voltage : null,
    p_current_amps: Number.isFinite(currentAmps) ? currentAmps : null,
    p_relay_on: relayOn,
    p_recorded_at: new Date().toISOString(),
  });

  if (error || !data?.length) return response(500, { error: "Telemetry processing failed" });
  return response(200, {
    ok: true,
    machine_id: data[0].machine_id,
    machine_status: data[0].machine_status,
    desired_relay_on: data[0].desired_relay_on,
    reason: data[0].command_reason,
  });
});
