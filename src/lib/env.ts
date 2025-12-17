/**
 * 환경 변수 검증 및 타입 안전한 접근을 위한 유틸리티
 */

const requiredEnvVars = {
  // Supabase (필수)
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  
  // Gemini (필수)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  
  // 공공데이터 (필수)
  PUBLICDATA_SERVICE_KEY_ENC: process.env.PUBLICDATA_SERVICE_KEY_ENC,
} as const;

const optionalEnvVars = {
  PUBLICDATA_BASE_URL: process.env.PUBLICDATA_BASE_URL || 'https://api.odcloud.kr/api/gov24/v3',
  PUBLICDATA_DELAY_MS: Number(process.env.PUBLICDATA_DELAY_MS || 600),
  PUBLICDATA_PAGE_SIZE: Number(process.env.PUBLICDATA_PAGE_SIZE || 100),
  PUBLICDATA_MAX_PAGES: process.env.PUBLICDATA_MAX_PAGES ? Number(process.env.PUBLICDATA_MAX_PAGES) : null,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://bojo24.kr',
} as const;

/**
 * 환경 변수 검증
 * @param required - 검증할 필수 환경 변수 목록 (기본값: 모든 필수 변수)
 * @throws {Error} 필수 환경 변수가 없을 경우
 */
export function validateEnv(required: (keyof typeof requiredEnvVars)[] = Object.keys(requiredEnvVars) as (keyof typeof requiredEnvVars)[]) {
  const missing: string[] = [];
  
  for (const key of required) {
    if (!requiredEnvVars[key]) {
      missing.push(key);
    }
  }
  
  if (missing.length > 0) {
    throw new Error(
      `필수 환경 변수가 설정되지 않았습니다: ${missing.join(', ')}\n` +
      `Vercel 대시보드 또는 .env 파일에서 설정해주세요.`
    );
  }
}

/**
 * 서버 사이드에서만 사용 가능한 환경 변수
 */
export const env = {
  ...requiredEnvVars,
  ...optionalEnvVars,
  
  // 타입 안전한 접근을 위한 getter
  get SUPABASE_URL(): string {
    if (!requiredEnvVars.SUPABASE_URL) {
      throw new Error('SUPABASE_URL 환경 변수가 설정되지 않았습니다.');
    }
    return requiredEnvVars.SUPABASE_URL;
  },
  
  get SUPABASE_SERVICE_ROLE_KEY(): string {
    if (!requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다.');
    }
    return requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY;
  },
  
  get SUPABASE_ANON_KEY(): string {
    if (!requiredEnvVars.SUPABASE_ANON_KEY) {
      throw new Error('SUPABASE_ANON_KEY 환경 변수가 설정되지 않았습니다.');
    }
    return requiredEnvVars.SUPABASE_ANON_KEY;
  },
  
  get GEMINI_API_KEY(): string {
    if (!requiredEnvVars.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
    }
    return requiredEnvVars.GEMINI_API_KEY;
  },
  
  get PUBLICDATA_SERVICE_KEY_ENC(): string {
    if (!requiredEnvVars.PUBLICDATA_SERVICE_KEY_ENC) {
      throw new Error('PUBLICDATA_SERVICE_KEY_ENC 환경 변수가 설정되지 않았습니다.');
    }
    return requiredEnvVars.PUBLICDATA_SERVICE_KEY_ENC;
  },
} as const;

/**
 * 클라이언트 사이드에서 사용 가능한 공개 환경 변수
 */
export const publicEnv = {
  NEXT_PUBLIC_SITE_URL: optionalEnvVars.NEXT_PUBLIC_SITE_URL,
} as const;

