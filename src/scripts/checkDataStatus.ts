/* eslint-disable no-console */
import "./loadScriptEnv";
import { getServiceClient } from "@lib/supabaseClient";
import { validateEnv } from "@lib/env";

// 환경 변수 검증 (Supabase만 필수 - 데이터 확인용)
try {
  validateEnv(['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);
} catch (error) {
  console.error("⚠️  환경 변수 오류:", error instanceof Error ? error.message : String(error));
  console.error("\n💡 해결 방법:");
  console.error("  1. .env 파일에 Supabase 변수를 입력하세요");
  console.error("  2. 또는 Vercel 환경 변수를 확인하세요");
  process.exit(1);
}

async function checkDataStatus() {
  console.log("🔍 데이터 수집 상태 확인 중...\n");
  
  const supabase = getServiceClient();
  
  try {
    // 1. benefits 테이블 데이터 확인
    const { data: benefits, error: benefitsError, count } = await supabase
      .from("benefits")
      .select("*", { count: "exact" })
      .limit(5);
    
    if (benefitsError) {
      console.error("❌ benefits 테이블 조회 실패:", benefitsError);
      return;
    }
    
    const totalCount = count || 0;
    console.log(`📊 benefits 테이블: ${totalCount}개 보조금 데이터`);
    
    if (totalCount > 0) {
      console.log("\n📋 최근 5개 보조금:");
      benefits?.forEach((benefit, idx) => {
        console.log(`  ${idx + 1}. ${benefit.name}`);
        console.log(`     카테고리: ${benefit.category || "없음"}`);
        console.log(`     기관: ${benefit.governing_org || "없음"}`);
        console.log(`     업데이트: ${benefit.last_updated_at ? new Date(benefit.last_updated_at).toLocaleDateString() : "없음"}`);
        console.log(`     AI 요약: ${benefit.gemini_summary ? "✅ 있음" : "❌ 없음"}`);
        console.log(`     FAQ: ${benefit.gemini_faq_json ? "✅ 있음" : "❌ 없음"}`);
        console.log("");
      });
      
      // 통계
      const { count: withSummaryCount } = await supabase
        .from("benefits")
        .select("*", { count: "exact", head: true })
        .not("gemini_summary", "is", null);
      
      const { count: withFaqCount } = await supabase
        .from("benefits")
        .select("*", { count: "exact", head: true })
        .not("gemini_faq_json", "is", null);
      
      const withSummary = withSummaryCount || 0;
      const withFaq = withFaqCount || 0;
      
      console.log("📈 통계:");
      console.log(`  - AI 요약 있는 데이터: ${withSummary}개`);
      console.log(`  - FAQ 있는 데이터: ${withFaq}개`);
      console.log(`  - 요약 없는 데이터: ${totalCount - withSummary}개`);
    } else {
      console.log("⚠️  데이터가 없습니다. 데이터 수집이 필요합니다.\n");
    }
    
    // 2. 카테고리별 통계
    if (totalCount > 0) {
      const { data: categoryStats } = await supabase
        .from("benefits")
        .select("category")
        .not("category", "is", null);
      
      if (categoryStats) {
        const categoryCount: Record<string, number> = {};
        categoryStats.forEach(item => {
          const cat = item.category || "기타";
          categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        });
        
        console.log("📂 카테고리별 통계:");
        Object.entries(categoryCount)
          .sort((a, b) => b[1] - a[1])
          .forEach(([cat, count]) => {
            console.log(`  - ${cat}: ${count}개`);
          });
      }
    }
    
    // 3. 최근 업데이트 확인
    if (totalCount > 0) {
      const { data: recent } = await supabase
        .from("benefits")
        .select("last_updated_at")
        .order("last_updated_at", { ascending: false })
        .limit(1)
        .single();
      
      if (recent?.last_updated_at) {
        const lastUpdate = new Date(recent.last_updated_at);
        const daysAgo = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
        console.log(`\n🕐 최근 업데이트: ${lastUpdate.toLocaleString()} (${daysAgo}일 전)`);
      }
    }
    
    // 4. 다음 단계 제안
    console.log("\n💡 다음 단계:");
    if (totalCount === 0) {
      console.log("  1. 데이터 수집 실행: npm run fetch:benefits");
    } else {
      const withSummary = (await supabase
        .from("benefits")
        .select("*", { count: "exact", head: true })
        .not("gemini_summary", "is", null)).count || 0;
      
      if (withSummary < totalCount) {
        console.log("  1. AI 요약 생성 (선택): npm run gen:gemini");
        console.log("  2. 데이터 추가/업데이트 수집: npm run fetch:benefits");
      } else {
        console.log("  ✅ 데이터 수집 완료!");
        console.log("  다음: npm run gen:content (고유 컨텐츠 생성)");
      }
      console.log("\n📌 현재 상태:");
      console.log(`  - 총 ${totalCount}개 보조금 데이터 수집 완료`);
      console.log(`  - AI 요약: ${withSummary}개 (${Math.round((withSummary / totalCount) * 100)}%)`);
      console.log(`  - 공공데이터 기반 상세페이지는 바로 사용 가능합니다!`);
    }
    
  } catch (error) {
    console.error("❌ 확인 실패:", error);
    process.exit(1);
  }
}

checkDataStatus().catch((err) => {
  console.error("스크립트 실패", err);
  process.exit(1);
});

