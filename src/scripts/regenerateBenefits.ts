/**
 * 특정 보조금 페이지들을 Gemini로 재생성하는 스크립트
 * 
 * 사용법:
 * npx tsx src/scripts/regenerateBenefits.ts
 */

import { createClient } from "@supabase/supabase-js";
import { optimizeBenefitContent } from "../lib/benefitContentOptimizer";

const benefitIds = [
  "318000000430",
  "371000000106",
  "394000000138"
];

async function regenerateBenefits() {
  // 환경 변수 확인
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY가 설정되지 않았습니다.");
    console.error("\n💡 .env 파일에 GEMINI_API_KEY를 추가하세요.");
    process.exit(1);
  }

  const allowedIds = process.env.GEMINI_ENHANCEMENT_ALLOWED_IDS 
    ? process.env.GEMINI_ENHANCEMENT_ALLOWED_IDS.split(",").map(id => id.trim())
    : [];

  console.log(`\n📋 환경 변수 확인:`);
  console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? "✅ 설정됨" : "❌ 없음"}`);
  console.log(`   GEMINI_ENHANCEMENT_ALLOWED_IDS: ${process.env.GEMINI_ENHANCEMENT_ALLOWED_IDS || "없음"}`);
  console.log(`   허용된 ID 목록: [${allowedIds.join(", ")}]`);
  
  // 재생성할 ID들이 허용 목록에 있는지 확인
  const missingIds = benefitIds.filter(id => !allowedIds.includes(id));
  if (missingIds.length > 0) {
    console.warn(`\n⚠️  다음 ID들이 GEMINI_ENHANCEMENT_ALLOWED_IDS에 없습니다: ${missingIds.join(", ")}`);
    console.warn(`   재생성하려면 환경 변수에 추가하세요: ${allowedIds.concat(missingIds).join(",")}`);
  }

  const supabase = getServiceClient();

  console.log(`🔄 ${benefitIds.length}개의 보조금 페이지 재생성 시작...\n`);

  for (const benefitId of benefitIds) {
    try {
      console.log(`\n📄 처리 중: ${benefitId}`);
      
      // Supabase에서 보조금 데이터 조회
      const { data: benefit, error } = await supabase
        .from("benefits")
        .select("*")
        .eq("id", benefitId)
        .single();

      if (error || !benefit) {
        console.error(`❌ 보조금 데이터를 찾을 수 없습니다: ${benefitId}`);
        console.error(error);
        continue;
      }

      console.log(`✅ 보조금 데이터 조회 성공: ${benefit.name}`);

      // 상세 정보는 benefit.detail_json에 포함되어 있음
      const benefitDetail = benefit.detail_json as {
        list?: Record<string, string>;
        detail?: Record<string, string>;
        supportConditions?: Record<string, string>;
      } | undefined;

      if (!benefitDetail) {
        console.error(`❌ 상세 정보를 찾을 수 없습니다: ${benefitId}`);
        continue;
      }

      console.log(`✅ 상세 정보 조회 성공`);

      // detail 데이터 구조 변환 (optimizeBenefitContent가 기대하는 형식)
      const detailData: { detail?: Record<string, string>; list?: Record<string, string> } = {
        detail: benefitDetail.detail || {},
        list: benefitDetail.list || {}
      };

      // 컨텐츠 최적화 (Gemini 재생성 포함)
      // 환경 변수에 해당 ID가 포함되어 있어야 Gemini 재생성이 활성화됨
      console.log(`\n🔧 환경 변수 확인:`);
      console.log(`   GEMINI_ENHANCEMENT_ALLOWED_IDS: ${process.env.GEMINI_ENHANCEMENT_ALLOWED_IDS || "없음"}`);
      console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? "설정됨" : "없음"}`);
      
      const optimized = await optimizeBenefitContent(
        benefit.name,
        benefit.category || "",
        benefit.governing_org || "",
        detailData,
        benefitId
      );

      console.log(`✅ 컨텐츠 최적화 완료`);
      console.log(`   - 핵심 요약: ${optimized.summary.length}자`);
      console.log(`   - 지원 대상: ${optimized.sections.target.content.length}자`);
      console.log(`   - 지원 내용: ${optimized.sections.benefit.content.length}자`);
      console.log(`   - 신청 방법: ${optimized.sections.apply.content.length}자`);
      console.log(`   - FAQ: ${optimized.faqs.length}개`);

      // 결과를 콘솔에 출력 (실제로는 DB에 저장할 수도 있음)
      console.log(`\n📝 최적화된 컨텐츠 미리보기:`);
      console.log(`\n[핵심 요약]`);
      console.log(optimized.summary.substring(0, 200) + "...");
      console.log(`\n[지원 대상]`);
      console.log(optimized.sections.target.content.substring(0, 200) + "...");
      console.log(`\n[지원 내용]`);
      console.log(optimized.sections.benefit.content.substring(0, 200) + "...");

    } catch (error: any) {
      console.error(`❌ 처리 중 오류 발생: ${benefitId}`);
      console.error(error?.message || error);
    }
  }

  console.log(`\n✅ 모든 보조금 페이지 재생성 완료!`);
  console.log(`\n💡 참고: 실제 사이트에 반영되려면 해당 페이지를 다시 방문하거나 캐시를 클리어해야 합니다.`);
}

// 스크립트 실행
regenerateBenefits().catch(console.error);

