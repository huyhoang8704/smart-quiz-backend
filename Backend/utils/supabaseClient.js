const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY // service_role hoặc anon_key có quyền upload
);

module.exports = supabase;