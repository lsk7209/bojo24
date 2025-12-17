import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env";

export type DBClient = SupabaseClient<any, "public", any>;

/**
 * Supabase 클라이언트 옵션 (Vercel 환경 최적화)
 */
const clientOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'x-client-info': 'bojo24-web',
    },
  },
  db: {
    schema: 'public',
  },
  // Vercel Edge Functions 최적화
  realtime: {
    params: {
      eventsPerSecond: 2,
    },
  },
};

/**
 * Service Role 키를 사용하는 클라이언트 (서버 사이드 전용)
 * - 모든 데이터베이스 작업에 사용
 * - RLS 정책을 우회
 * - 절대 클라이언트에 노출하지 말 것
 */
export const getServiceClient = (): DBClient => {
  return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, clientOptions);
};

/**
 * Anonymous 키를 사용하는 클라이언트 (클라이언트 사이드용)
 * - RLS 정책을 따름
 * - 공개 데이터 조회에 사용
 */
export const getAnonClient = (): DBClient => {
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, clientOptions);
};

/**
 * 싱글톤 패턴으로 클라이언트 재사용 (선택적)
 * 메모리 효율성을 위해 필요시 사용
 */
let serviceClientInstance: DBClient | null = null;
let anonClientInstance: DBClient | null = null;

export const getServiceClientSingleton = (): DBClient => {
  if (!serviceClientInstance) {
    serviceClientInstance = getServiceClient();
  }
  return serviceClientInstance;
};

export const getAnonClientSingleton = (): DBClient => {
  if (!anonClientInstance) {
    anonClientInstance = getAnonClient();
  }
  return anonClientInstance;
};

