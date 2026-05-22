const { supabase, supabaseAdmin, canManageSupabaseUsers, isSupabaseEnabled } = require('../config/supabase');

const createSupabaseUser = async ({ email, password, name, role, emailConfirm = true }) => {
  if (!canManageSupabaseUsers) return null;

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: emailConfirm,
    user_metadata: { name, role }
  });

  if (error) {
    if (error.message?.toLowerCase().includes('already')) return null;
    throw error;
  }

  return data.user;
};

const signInWithSupabase = async (email, password) => {
  if (!isSupabaseEnabled || !supabase) return null;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return null;
  return data;
};

const getSupabaseUserFromToken = async (token) => {
  if (!isSupabaseEnabled || !supabase) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error) return null;
  return data.user;
};

module.exports = {
  createSupabaseUser,
  signInWithSupabase,
  getSupabaseUserFromToken
};
