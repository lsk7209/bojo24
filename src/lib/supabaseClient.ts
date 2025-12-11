import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export type DBClient = SupabaseClient;

const ensureUrl = () => {
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL 환경 변수가 설정되지 않았습니다.");
  }
};

export const getServiceClient = (): DBClient => {
  ensureUrl();
  if (!supabaseServiceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다.");
  }
  return createClient(supabaseUrl!, supabaseServiceKey, {
    auth: { persistSession: false }
  });
};

export const getAnonClient = (): DBClient => {
  ensureUrl();
  if (!supabaseAnonKey) {
    throw new Error("SUPABASE_ANON_KEY 환경 변수가 설정되지 않았습니다.");
  }
  return createClient(supabaseUrl!, supabaseAnonKey, {
    auth: { persistSession: false }
  });
};

