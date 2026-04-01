const { createClient } = require("@supabase/supabase-js");

// Use SUPABASE_URL and SUPABASE_SERVICE_KEY on the server.
// NEVER use VITE_ prefixed vars here — those only exist in browser builds.
// Use the service_role key (not anon) so supabase.auth.getUser(token) works.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl) {
  console.error("❌ [Supabase] SUPABASE_URL is not set — DB and Auth will fail.");
}
if (!supabaseKey) {
  console.error("❌ [Supabase] SUPABASE_SERVICE_KEY is not set — JWT verification will fail.");
}

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }, // server should not persist sessions
    })
  : null;

if (supabase) console.log("[Supabase] Client initialized successfully.");

module.exports = supabase;
