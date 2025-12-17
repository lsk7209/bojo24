/**
 * 특정 보조금의 지원 대상 Gemini 보완 테스트
 */

/* eslint-disable no-console */
import "dotenv/config";
import { getServiceClient } from "@lib/supabaseClient";
import { enhanceTarget } from "@lib/geminiEnhancer";

const BENEFIT_ID = "305000000283"; // (국가유공자)인플루엔자 백신 및 접종 지원

async function testSingleBenefit() {
  // 항상 로그 출력 (테스트 스크립트이므로)
  console.log("🔍 특정 보조금 지원 대상 Gemini 보완 테스트\n");

  // 환경 변수 확인
  console.log("📋 환경 변수 확인:");
  console.log(`  GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? "✅ 설정됨" : "❌ 설정 안 됨"}`);
  console.log(`  GEMINI_ENHANCEMENT_ALLOWED_IDS: ${process.env.GEMINI_ENHANCEMENT_ALLOWED_IDS || "❌ 설정 안 됨"}`);
  console.log("");

  const supabase = getServiceClient();
  const { data: benefit, error } = await supabase
    .from("benefits")
    .select("*")
    .eq("id", BENEFIT_ID)
    .maybeSingle();

  if (error || !benefit) {
    console.error("❌ 보조금 데이터를 찾을 수 없습니다:", error);
    process.exit(1);
  }

  console.log(`📋 보조금: ${benefit.name}`);
  console.log(`🏛️  관할 기관: ${benefit.governing_org}\n`);

  const detail = benefit.detail_json as {
    list?: Record<string, string>;
    detail?: Record<string, string>;
  } | undefined;

  const detailData = detail?.detail || detail?.list || {};
  const targetContent = detailData["지원대상"] || detailData["대상"] || "정보 없음";

  console.log("=".repeat(60));
  console.log("📊 공공데이터 원본:");
  console.log(`"${targetContent}"`);
  console.log(`📏 길이: ${targetContent.length}자\n`);

  console.log("🔄 Gemini 보완 시도 중...\n");

  const enhanced = await enhanceTarget(
    benefit.name,
    benefit.governing_org || "정부 기관",
    targetContent,
    detailData,
    BENEFIT_ID
  );

  if (enhanced) {
    console.log("✅ Gemini 보완 성공!");
    console.log("=".repeat(60));
    console.log("📊 Gemini 보완 결과:");
    console.log(`"${enhanced}"`);
    console.log(`📏 길이: ${enhanced.length}자`);
    console.log(`📈 증가량: +${enhanced.length - targetContent.length}자`);
  } else {
    console.log("❌ Gemini 보완 실패 또는 비활성화됨");
    console.log("\n💡 가능한 원인:");
    console.log("  1. GEMINI_API_KEY가 설정되지 않음");
    console.log("  2. GEMINI_ENHANCEMENT_ALLOWED_IDS에 해당 ID가 포함되지 않음");
    console.log("  3. Gemini API 호출 실패");
  }

  console.log("\n" + "=".repeat(60));
}

testSingleBenefit().catch((err) => {
  console.error("❌ 테스트 실패:", err);
  process.exit(1);
});

