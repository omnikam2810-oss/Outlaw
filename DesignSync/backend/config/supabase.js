const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const createSupabaseClient = (key) => {
  if (!supabaseUrl || !key) return null;
  return createClient(supabaseUrl, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

const supabase = createSupabaseClient(supabaseAnonKey);
const supabaseAdmin = createSupabaseClient(supabaseServiceRoleKey);

module.exports = {
  supabase,
  supabaseAdmin,
  isSupabaseEnabled: Boolean(supabaseUrl && supabaseAnonKey),
  canManageSupabaseUsers: Boolean(supabaseUrl && supabaseServiceRoleKey)
};
