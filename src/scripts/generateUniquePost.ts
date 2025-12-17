/* eslint-disable no-console */
import "dotenv/config";
import { getServiceClient } from "@lib/supabaseClient";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env, validateEnv } from "@lib/env";
import { checkAndSavePostHash, generateUniquePostTitle } from "@lib/uniqueContent";
import type { BenefitRecord } from "@/types/benefit";

// 환경 변수 검증
validateEnv(['GEMINI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

/**
 * 고유한 블로그 포스트 생성
 * - 중복 체크
 * - AI 기반 고유 컨텐츠 생성
 * - SEO 최적화
 */
async function generateUniquePost(benefit: BenefitRecord) {
  const supabase = getServiceClient();
  
  // 이미 생성된 포스트가 있는지 확인
  const { data: existingPosts } = await supabase
    .from('posts')
    .select('id')
    .eq('benefit_id', benefit.id)
    .limit(1);
  
  if (existingPosts && existingPosts.length > 0) {
    console.log(`⏭️  ${benefit.name}에 대한 포스트가 이미 존재합니다.`);
    return null;
  }

  // 포스트 각도 선택 (guide, tips, comparison, news, analysis)
  const angles: Array<'guide' | 'tips' | 'comparison' | 'news' | 'analysis'> = 
    ['guide', 'tips', 'analysis'];
  const angle = angles[Math.floor(Math.random() * angles.length)];

  const title = generateUniquePostTitle(benefit.name, angle);
  
  // 슬러그 생성 (고유성 보장)
  const slug = `${benefit.id.substring(0, 8)}-${angle}-${Date.now().toString(36)}`;

  // AI 기반 고유 컨텐츠 생성
  const detail = benefit.detail_json as any;
  const prompt = `
당신은 대한민국 정책 분석 전문 에디터입니다.
아래 보조금 정보를 바탕으로 독자에게 가치 있는 고유한 블로그 포스트를 작성해주세요.

[작성 가이드]
1. **고유성**: 단순 정보 나열이 아닌 분석, 인사이트, 팁을 제공하세요.
2. **SEO 최적화**: 자연스럽게 키워드를 포함하되, 키워드 스터핑은 피하세요.
3. **구조**: 
   - 인트로 (독자의 관심 유도)
   - 본문 (구체적 정보 + 분석)
   - 실전 팁
   - 마무리 (행동 유도)
4. **톤앤매너**: 친절하고 전문적이며, 구어체를 사용하세요.
5. **길이**: 최소 800자 이상, 최대 2000자 이하

[보조금 정보]
- 정책명: ${benefit.name}
- 카테고리: ${benefit.category}
- 관할 기관: ${benefit.governing_org}
- 지원 대상: ${JSON.stringify(detail.detail?.["지원대상"] || detail.list?.["지원대상"])}
- 지원 내용: ${JSON.stringify(detail.detail?.["지원내용"] || detail.list?.["지원내용"])}
- 신청 방법: ${JSON.stringify(detail.detail?.["신청방법"] || detail.list?.["신청방법"])}
- AI 요약: ${benefit.gemini_summary || "없음"}

[포스트 각도: ${angle}]
- guide: 단계별 신청 가이드 중심
- tips: 실전 팁과 주의사항 중심
- analysis: 심층 분석과 비교 중심

마크다운 형식으로 작성해주세요. 제목은 포함하지 마세요.
`;

  try {
    const result = await model.generateContent(prompt);
    const content = result.response.text();
    
    // 중복 체크
    const { isDuplicate } = await checkAndSavePostHash({
      title,
      content,
      benefit_id: benefit.id,
      slug
    });

    if (isDuplicate) {
      console.log(`⚠️  중복 컨텐츠 감지: ${title}`);
      return null;
    }

    // 메타 설명 생성
    const excerpt = benefit.gemini_summary 
      ? `${benefit.gemini_summary.substring(0, 120)}...`
      : `${benefit.name}에 대한 상세 가이드. 자격 요건, 신청 방법, 혜택 내용을 확인하세요.`;

    // SEO 키워드 추출
    const keywords = [
      benefit.name,
      benefit.category,
      benefit.governing_org,
      "보조금",
      "정부 지원금",
      "신청 방법"
    ].filter(Boolean);

    // DB 저장
    const { error, data } = await supabase
      .from('posts')
      .insert({
        benefit_id: benefit.id,
        title,
        slug,
        content,
        excerpt,
        tags: [benefit.category, angle, "2025정책"].filter(Boolean),
        seo_keywords: keywords,
        meta_description: excerpt,
        published_at: new Date().toISOString(),
        is_published: true
      })
      .select()
      .single();

    if (error) {
      console.error(`❌ 저장 실패: ${title}`, error);
      return null;
    }

    console.log(`✅ [생성 완료] ${title}`);
    console.log(`🔗 /blog/${slug}`);
    
    return data;
  } catch (err) {
    console.error(`❌ 생성 실패: ${benefit.name}`, err);
    return null;
  }
}

/**
 * 랜덤 보조금 선택 (포스트가 없는 것)
 */
async function fetchBenefitWithoutPost(): Promise<BenefitRecord | null> {
  const supabase = getServiceClient();
  
  // 포스트가 없는 보조금 조회
  const { data: benefits } = await supabase
    .from('benefits')
    .select('id, name, category, governing_org, detail_json, gemini_summary, gemini_faq_json')
    .not('gemini_summary', 'is', null)
    .limit(100);

  if (!benefits || benefits.length === 0) {
    return null;
  }

  // 포스트가 있는 보조금 ID 조회
  const { data: posts } = await supabase
    .from('posts')
    .select('benefit_id')
    .not('benefit_id', 'is', null);

  const postedBenefitIds = new Set(posts?.map(p => p.benefit_id) || []);
  
  // 포스트가 없는 보조금 필터링
  const availableBenefits = benefits.filter(b => !postedBenefitIds.has(b.id));
  
  if (availableBenefits.length === 0) {
    return null;
  }

  // 랜덤 선택
  return availableBenefits[Math.floor(Math.random() * availableBenefits.length)] as BenefitRecord;
}

/**
 * 메인 함수
 */
async function main() {
  console.log("🚀 고유 컨텐츠 생성 시작...\n");
  
  const batchSize = 5; // 한 번에 5개 생성
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < batchSize; i++) {
    const benefit = await fetchBenefitWithoutPost();
    
    if (!benefit) {
      console.log("📭 생성할 보조금이 없습니다.");
      break;
    }

    console.log(`\n[${i + 1}/${batchSize}] ${benefit.name} 처리 중...`);
    
    const result = await generateUniquePost(benefit);
    
    if (result) {
      successCount++;
    } else {
      failCount++;
    }

    // Rate Limit 방지
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log(`\n=== 완료 ===`);
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
}

main().catch((err) => {
  console.error("스크립트 실패", err);
  process.exit(1);
});

