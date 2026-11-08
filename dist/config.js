/*
  Live Supabase connection (optional).

  1. Enable Row Level Security before adding a key.
  2. Use only the public anon/publishable key - never service_role.
  3. Leave both values empty to use the fully functional demo mode.
*/
window.DORMLAUNDRY_CONFIG = {
  // Keep "demo" until supabase_setup.sql and both Edge Functions are deployed.
  DATA_MODE: "live",
  SUPABASE_URL: "https://nsnnxdjvbkjovlieyeat.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_E_IAJM9C-K1VRqT7eEDujA_YkMoX2tD",
};
