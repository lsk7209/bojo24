/* eslint-disable no-console */
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServiceClient } from "@lib/supabaseClient";
import { env, validateEnv } from "@lib/env";
import {
  saveBenefitContent,
  calculateUniquenessScore,
  type BenefitContent,
  type ContentType
} from "@lib/contentTemplate";
import { generateContentHash } from "@lib/contentHash";
import { checkAndSaveBenefitHash } from "@lib/uniqueContent";
import type { BenefitRecord } from "@/types/benefit";

// 환경 변수 검증
validateEnv(['GEMINI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

/**
 * 고유 컨텐츠 생성 (구글 고유 컨텐츠 인정을 위한)
 * 각 보조금마다 다른 각도와 스타일로 컨텐츠 생성
 */
async function generateUniqueContentForBenefit(
  benefit: BenefitRecord,
  contentType: ContentType
): Promise<BenefitContent | null> {
  const supabase = getServiceClient();
  
  // 이미 생성된 컨텐츠 확인
  const { data: existing } = await supabase
    .from('benefit_content')
    .select('id')
    .eq('benefit_id', benefit.id)
    .eq('content_type', contentType)
    .maybeSingle();

  if (existing) {
    console.log(`⏭️  ${benefit.name}의 ${contentType} 컨텐츠가 이미 존재합니다.`);
    return null;
  }

  const detail = benefit.detail_json as any;
  
  // 컨텐츠 타입별 프롬프트
  const prompts: Record<ContentType, string> = {
    intro: `
당신은 정부 보조금 분석 전문가입니다. 아래 보조금 정보를 바탕으로 독자에게 매력적이고 고유한 인트로 컨텐츠를 작성해주세요.

[요구사항]
1. **고유성**: 다른 보조금 페이지와 구별되는 독특한 관점 제공
2. **가치**: 독자가 "이 정보가 필요하다"고 느끼는 가치 제공
3. **자연스러움**: 마케팅 문구가 아닌 진솔한 정보 제공
4. **길이**: 200-300자 내외

[보조금 정보]
- 정책명: ${benefit.name}
- 카테고리: ${benefit.category}
- 관할 기관: ${benefit.governing_org}
- 지원 대상: ${JSON.stringify(detail.detail?.["지원대상"] || detail.list?.["지원대상"])}
- 지원 내용: ${JSON.stringify(detail.detail?.["지원내용"] || detail.list?.["지원내용"])}
- AI 요약: ${benefit.gemini_summary || "없음"}

[작성 스타일]
- 독자의 상황에 공감하는 톤
- 구체적인 혜택 강조
- 행동 유도 (하지만 과하지 않게)
- 이모지 사용 최소화

마크다운 없이 순수 텍스트로 작성해주세요.
`,

    analysis: `
당신은 정책 분석 전문가입니다. 아래 보조금을 심층 분석하여 독자에게 인사이트를 제공해주세요.

[요구사항]
1. **분석적 관점**: 단순 나열이 아닌 분석과 해석
2. **비교**: 유사 정책과의 차이점 (있는 경우)
3. **실전 팁**: 실제 신청 시 유의사항
4. **길이**: 400-600자

[보조금 정보]
- 정책명: ${benefit.name}
- 카테고리: ${benefit.category}
- 관할 기관: ${benefit.governing_org}
- 지원 대상: ${JSON.stringify(detail.detail?.["지원대상"] || detail.list?.["지원대상"])}
- 지원 내용: ${JSON.stringify(detail.detail?.["지원내용"] || detail.list?.["지원내용"])}
- 신청 방법: ${JSON.stringify(detail.detail?.["신청방법"] || detail.list?.["신청방법"])}

[작성 포인트]
- 이 정책의 핵심 가치
- 누가 가장 혜택을 받을 수 있는가
- 신청 시 주의할 점
- 다른 정책과의 차별점

마크다운 없이 순수 텍스트로 작성해주세요.
`,

    guide: `
당신은 실용적인 가이드 작성 전문가입니다. 아래 보조금 신청을 위한 단계별 가이드를 작성해주세요.

[요구사항]
1. **실행 가능**: 독자가 바로 따라할 수 있는 구체적 단계
2. **명확성**: 모호함 없는 명확한 설명
3. **실전성**: 실제 경험 기반 팁 포함
4. **길이**: 500-800자

[보조금 정보]
- 정책명: ${benefit.name}
- 신청 방법: ${JSON.stringify(detail.detail?.["신청방법"] || detail.list?.["신청방법"])}
- 필요 서류: ${JSON.stringify(detail.detail?.["구비서류"] || detail.list?.["구비서류"])}
- 문의처: ${JSON.stringify(detail.detail?.["문의처"] || detail.list?.["전화문의"])}

[작성 구조]
1. 사전 준비 (서류 준비 등)
2. 신청 절차 (단계별)
3. 신청 후 절차
4. 주의사항

마크다운 없이 순수 텍스트로 작성해주세요.
`,

    tips: `
당신은 실전 경험을 바탕으로 한 팁 제공 전문가입니다. 아래 보조금 신청 시 알아두면 좋은 실전 팁을 제공해주세요.

[요구사항]
1. **실전성**: 실제 경험에서 나온 팁
2. **구체성**: 추상적이지 않은 구체적 조언
3. **고유성**: 다른 곳에서 볼 수 없는 인사이트
4. **길이**: 300-500자

[보조금 정보]
- 정책명: ${benefit.name}
- 카테고리: ${benefit.category}
- 관할 기관: ${benefit.governing_org}
- 지원 대상: ${JSON.stringify(detail.detail?.["지원대상"] || detail.list?.["지원대상"])}
- 신청 방법: ${JSON.stringify(detail.detail?.["신청방법"] || detail.list?.["신청방법"])}

[작성 포인트]
- 신청 시 놓치기 쉬운 포인트
- 서류 준비 팁
- 문의 시 효과적인 질문 방법
- 신청 타이밍 조언

마크다운 없이 순수 텍스트로 작성해주세요.
`,

    comparison: `
당신은 정책 비교 분석 전문가입니다. 아래 보조금과 유사한 정책들을 비교 분석해주세요.

[요구사항]
1. **비교 분석**: 유사 정책과의 차이점 명확히
2. **선택 가이드**: 어떤 경우에 이 정책이 적합한가
3. **고유성**: 독특한 비교 관점
4. **길이**: 400-600자

[보조금 정보]
- 정책명: ${benefit.name}
- 카테고리: ${benefit.category}
- 지원 대상: ${JSON.stringify(detail.detail?.["지원대상"] || detail.list?.["지원대상"])}
- 지원 내용: ${JSON.stringify(detail.detail?.["지원내용"] || detail.list?.["지원내용"])}

[작성 포인트]
- 같은 카테고리의 다른 정책과 비교
- 각 정책의 장단점
- 선택 기준 제시

마크다운 없이 순수 텍스트로 작성해주세요.
`
  };

  try {
    const prompt = prompts[contentType];
    const result = await model.generateContent(prompt);
    const generatedText = result.response.text().trim();

    // 컨텐츠 해시 생성 및 중복 체크
    const contentHash = generateContentHash(generatedText);
    const { isDuplicate } = await checkAndSaveBenefitHash({
      id: benefit.id,
      name: benefit.name,
      detail_json: benefit.detail_json,
      gemini_summary: generatedText
    });

    if (isDuplicate) {
      console.log(`⚠️  중복 컨텐츠 감지: ${benefit.name} (${contentType})`);
      return null;
    }

    // 고유성 점수 계산
    const uniquenessScore = await calculateUniquenessScore(generatedText, benefit.id);

    // 컨텐츠 저장
    const benefitContent: BenefitContent = {
      benefitId: benefit.id,
      contentType,
      introText: contentType === 'intro' ? generatedText : undefined,
      analysisText: contentType === 'analysis' ? generatedText : undefined,
      guideText: contentType === 'guide' ? generatedText : undefined,
      tipsText: contentType === 'tips' ? generatedText : undefined,
      comparisonText: contentType === 'comparison' ? generatedText : undefined,
      contentHash,
      uniquenessScore
    };

    await saveBenefitContent(benefitContent);

    console.log(`✅ [생성 완료] ${benefit.name} - ${contentType} (고유성: ${(uniquenessScore * 100).toFixed(1)}%)`);
    
    return benefitContent;
  } catch (err) {
    console.error(`❌ 생성 실패: ${benefit.name} (${contentType})`, err);
    return null;
  }
}

/**
 * 보조금별 모든 컨텐츠 타입 생성
 */
async function generateAllContentTypes(benefit: BenefitRecord) {
  const contentTypes: ContentType[] = ['intro', 'analysis', 'guide', 'tips'];
  
  for (const contentType of contentTypes) {
    await generateUniqueContentForBenefit(benefit, contentType);
    // Rate Limit 방지
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

/**
 * 메인 함수
 */
async function main() {
  console.log("🚀 고유 컨텐츠 생성 시작 (구글 고유 컨텐츠 인정 최적화)...\n");
  
  const supabase = getServiceClient();
  
  // 컨텐츠가 없는 보조금 조회
  const { data: benefits } = await supabase
    .from('benefits')
    .select('id, name, category, governing_org, detail_json, gemini_summary, gemini_faq_json')
    .not('gemini_summary', 'is', null)
    .limit(50);

  if (!benefits || benefits.length === 0) {
    console.log("📭 생성할 보조금이 없습니다.");
    return;
  }

  // 이미 컨텐츠가 있는 보조금 제외
  const { data: existingContents } = await supabase
    .from('benefit_content')
    .select('benefit_id')
    .in('benefit_id', benefits.map(b => b.id));

  const existingIds = new Set(existingContents?.map(c => c.benefit_id) || []);
  const targetBenefits = benefits.filter(b => !existingIds.has(b.id));

  console.log(`대상: ${targetBenefits.length}개 보조금\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < targetBenefits.length; i++) {
    const benefit = targetBenefits[i] as BenefitRecord;
    console.log(`[${i + 1}/${targetBenefits.length}] ${benefit.name} 처리 중...`);
    
    try {
      await generateAllContentTypes(benefit);
      successCount++;
    } catch (err) {
      console.error(`실패: ${benefit.name}`, err);
      failCount++;
    }

    // Rate Limit 방지
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  console.log(`\n=== 완료 ===`);
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
}

main().catch((err) => {
  console.error("스크립트 실패", err);
  process.exit(1);
});

