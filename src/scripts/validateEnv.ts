/**
 * 환경 변수 검증 스크립트
 * 배포 전 또는 CI/CD에서 환경 변수가 올바르게 설정되었는지 확인
 */
/* eslint-disable no-console */
import "dotenv/config";
import { validateEnv } from "@lib/env";

const main = () => {
  // CI 환경에서는 경고만 출력하고 계속 진행
  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  
  try {
    if (!isCI) {
      console.log("🔍 환경 변수 검증 중...\n");
    }
    
    // 필수 환경 변수 검증
    validateEnv();
    
    if (!isCI) {
      console.log("✅ 모든 필수 환경 변수가 설정되었습니다!\n");
      console.log("설정된 환경 변수:");
      console.log(`  - SUPABASE_URL: ${process.env.SUPABASE_URL ? '✅' : '❌'}`);
      console.log(`  - SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌'}`);
      console.log(`  - SUPABASE_ANON_KEY: ${process.env.SUPABASE_ANON_KEY ? '✅' : '❌'}`);
      console.log(`  - GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅' : '❌'}`);
      console.log(`  - PUBLICDATA_SERVICE_KEY_ENC: ${process.env.PUBLICDATA_SERVICE_KEY_ENC ? '✅' : '❌'}`);
      console.log(`\n  - NEXT_PUBLIC_SITE_URL: ${process.env.NEXT_PUBLIC_SITE_URL || '기본값 사용'}`);
    }
    
    process.exit(0);
  } catch (error) {
    if (isCI) {
      // CI 환경에서는 에러를 무시하고 계속 진행
      console.warn("⚠️ CI 환경: 환경 변수 검증을 건너뜁니다.");
      process.exit(0);
    }
    
    console.error("❌ 환경 변수 검증 실패:");
    console.error(error instanceof Error ? error.message : String(error));
    console.error("\n💡 해결 방법:");
    console.error("  1. .env 파일을 확인하세요");
    console.error("  2. Vercel 대시보드에서 환경 변수를 확인하세요");
    console.error("  3. ENV_SETUP.md를 참고하세요");
    process.exit(1);
  }
};

main();

