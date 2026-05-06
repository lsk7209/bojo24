/* eslint-disable no-console */
/**
 * Gemini 보완 기능 테스트 스크립트
 * 특정 보조금의 공공데이터를 Gemini로 보완하여 확인
 */

import "dotenv/config";
import { getServiceClient } from "@lib/supabaseClient";
import {
  enhanceSummaryLegacy,
  enhanceTarget,
  enhanceBenefit,
  needsEnhancement,
} from "@lib/geminiEnhancer";

const BENEFIT_ID = "305000000283"; // (국가유공자)인플루엔자 백신 및 접종 지원

async function testEnhancement() {
  console.log("🔍 Gemini 보완 테스트 시작...\n");

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
  console.log(`📂 카테고리: ${benefit.category}`);
  console.log(`🏛️  관할 기관: ${benefit.governing_org}\n`);

  const detail = benefit.detail_json as {
    list?: Record<string, string>;
    detail?: Record<string, string>;
  } | undefined;

  const detailData = detail?.detail || detail?.list || {};

  // 1. 요약 테스트
  console.log("=".repeat(60));
  console.log("1️⃣ 핵심 요약 테스트");
  console.log("=".repeat(60));
  
  const publicSummary = `${benefit.name}은(는) ${benefit.governing_org}에서 제공하는 ${benefit.category} 분야의 정부 지원금입니다.`;
  const purpose = detailData["서비스목적"] || detailData["서비스목적요약"] || "";
  const target = detailData["지원대상"] || detailData["대상"] || "";
  const benefitContent = detailData["지원내용"] || detailData["지원 내용"] || "";
  
  let fullSummary = publicSummary;
  if (purpose) {
    fullSummary += ` 이 지원금은 ${purpose}을(를) 목적으로 합니다.`;
  }
  if (target && target !== "정보 없음") {
    fullSummary += `\n\n【지원 대상】\n${target}`;
  }
  if (benefitContent && benefitContent !== "정보 없음") {
    fullSummary += `\n\n【지원 내용】\n${benefitContent}`;
  }

  console.log("\n📊 공공데이터 원본:");
  console.log(fullSummary);
  console.log(`\n📏 길이: ${fullSummary.length}자`);

  if (needsEnhancement(fullSummary, 200)) {
    console.log("\n✨ Gemini 보완 필요! (200자 미만)");
    console.log("🔄 Gemini로 보완 중...\n");
    
    const enhanced = await enhanceSummaryLegacy(
      benefit.name,
      benefit.category || "정부 지원금",
      benefit.governing_org || "정부 기관",
      fullSummary,
      detailData,
      BENEFIT_ID
    );

    if (enhanced) {
      console.log("✅ Gemini 보완 결과:");
      console.log(enhanced);
      console.log(`\n📏 보완 후 길이: ${enhanced.length}자`);
      console.log(`📈 증가량: +${enhanced.length - fullSummary.length}자`);
    } else {
      console.log("⚠️ Gemini 보완 실패 (API 키 없음 또는 오류)");
    }
  } else {
    console.log("\n✅ 공공데이터가 충분합니다. Gemini 보완 불필요.");
  }

  // 2. 지원 대상 테스트
  console.log("\n\n" + "=".repeat(60));
  console.log("2️⃣ 지원 대상 테스트");
  console.log("=".repeat(60));
  
  const publicTarget = target || "정보 없음";
  console.log("\n📊 공공데이터 원본:");
  console.log(publicTarget);
  console.log(`\n📏 길이: ${publicTarget.length}자`);

  if (needsEnhancement(publicTarget, 100)) {
    console.log("\n✨ Gemini 보완 필요! (100자 미만)");
    console.log("🔄 Gemini로 보완 중...\n");
    
    const enhanced = await enhanceTarget(
      benefit.name,
      benefit.governing_org || "정부 기관",
      publicTarget,
      detailData,
      BENEFIT_ID
    );

    if (enhanced) {
      console.log("✅ Gemini 보완 결과:");
      console.log(enhanced);
      console.log(`\n📏 보완 후 길이: ${enhanced.length}자`);
      console.log(`📈 증가량: +${enhanced.length - publicTarget.length}자`);
    } else {
      console.log("⚠️ Gemini 보완 실패 (API 키 없음 또는 오류)");
    }
  } else {
    console.log("\n✅ 공공데이터가 충분합니다. Gemini 보완 불필요.");
  }

  // 3. 지원 내용 테스트
  console.log("\n\n" + "=".repeat(60));
  console.log("3️⃣ 지원 내용 테스트");
  console.log("=".repeat(60));
  
  const publicBenefit = benefitContent || "정보 없음";
  console.log("\n📊 공공데이터 원본:");
  console.log(publicBenefit);
  console.log(`\n📏 길이: ${publicBenefit.length}자`);

  if (needsEnhancement(publicBenefit, 150)) {
    console.log("\n✨ Gemini 보완 필요! (150자 미만)");
    console.log("🔄 Gemini로 보완 중...\n");
    
    const enhanced = await enhanceBenefit(
      benefit.name,
      benefit.governing_org || "정부 기관",
      publicBenefit,
      detailData,
      BENEFIT_ID
    );

    if (enhanced) {
      console.log("✅ Gemini 보완 결과:");
      console.log(enhanced);
      console.log(`\n📏 보완 후 길이: ${enhanced.length}자`);
      console.log(`📈 증가량: +${enhanced.length - publicBenefit.length}자`);
    } else {
      console.log("⚠️ Gemini 보완 실패 (API 키 없음 또는 오류)");
    }
  } else {
    console.log("\n✅ 공공데이터가 충분합니다. Gemini 보완 불필요.");
  }

  console.log("\n\n" + "=".repeat(60));
  console.log("✅ 테스트 완료!");
  console.log("=".repeat(60));
}

testEnhancement().catch((err) => {
  console.error("❌ 테스트 실패:", err);
  process.exit(1);
});

