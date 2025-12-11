/* eslint-disable no-console */
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServiceClient } from "@lib/supabaseClient";
import type { BenefitRecord } from "@/types/benefit";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const BATCH_LIMIT = 20;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY 환경 변수가 필요합니다.");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
// model 명 변경: gemini-1.5-flash -> gemini-pro (안정성 확보)
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

const buildPrompt = (benefit: BenefitRecord) => {
  const governingOrg = benefit.governing_org ?? "정부 기관";
  const jsonSummary = JSON.stringify(benefit.detail_json);

  // 프롬프트 강화: 3줄 요약과 FAQ를 명확하게 요구
  return `
다음은 대한민국 공공서비스(보조금) 상세 데이터입니다.

[서비스 기본 정보]
서비스명: ${benefit.name}
카테고리: ${benefit.category}
관할 기관: ${governingOrg}

[요구사항]
아래 JSON 데이터를 분석하여, 일반 시민(초등학생 수준)이 이해하기 쉬운 요약과 FAQ를 작성해주세요.

1. summary (요약): 딱딱한 행정 용어를 피하고, 핵심 혜택 위주로 3줄 내외로 요약하세요. 
   - 문장은 명사형 종결(~함)보다는 해요체(~해요)나 습니다체(~습니다)로 부드럽게 작성하세요.
   - 줄바꿈이 필요하면 \\n을 사용하세요.

2. faq (자주 묻는 질문): 사용자가 가장 궁금해할 만한 내용으로 질문 5개를 생성하세요.
   - 예: "누가 받을 수 있나요?", "신청은 어떻게 하나요?", "필요한 서류는 무엇인가요?"
   - 답변은 구체적이어야 하며, 데이터에 없는 내용은 "관할 기관에 문의가 필요합니다"라고 하세요.

3. 출력 포맷: 오직 JSON만 반환하세요.
{
  "summary": "요약 내용...",
  "faq": [
    {"q": "질문1", "a": "답변1"},
    ...
  ]
}

[데이터 원문]
${jsonSummary}
`;
};

const parseResponse = (text: string) => {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(cleaned) as { summary: string; faq: { q: string; a: string }[] };
  } catch (err) {
    console.warn("JSON 파싱 경고:", text.substring(0, 100)); // 디버깅용 로그
    return {
      summary: "AI 요약 생성 중 형식을 인식하지 못했습니다.",
      faq: []
    };
  }
};

const fetchTargets = async () => {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("benefits")
    .select(
      "id, name, category, governing_org, detail_json, gemini_summary, gemini_faq_json"
    )
    .is("gemini_summary", null)
    .limit(BATCH_LIMIT);
  if (error) throw error;
  return data as BenefitRecord[];
};

const updateGemini = async (rows: BenefitRecord[]) => {
  const supabase = getServiceClient();
  let success = 0;
  let failed = 0;
  for (const row of rows) {
    try {
      const prompt = buildPrompt(row);
      const result = await model.generateContent(prompt);
      const text = result.response.text() ?? "";
      const parsed = parseResponse(text);

      if (parsed.summary && parsed.summary.includes("형식을 인식하지 못했습니다")) {
        // 파싱 실패 시 카운트만 하고 업데이트는 스킵 (다음 기회에 다시 시도하도록)
        failed += 1;
        continue;
      }

      const { error } = await supabase
        .from("benefits")
        .update({
          gemini_summary: parsed.summary,
          gemini_faq_json: parsed.faq
        })
        .eq("id", row.id);
      if (error) throw error;
      success += 1;
      console.log(`[완료] ${row.id}: ${row.name.substring(0, 10)}...`);
    } catch (err) {
      failed += 1;
      console.error(`[실패] ${row.id}`, err);
    }
    // Rate Limit 방지용 딜레이
    await new Promise(resolve => setTimeout(resolve, 1500));
  }
  return { success, failed };
};

const main = async () => {
  console.log("Gemini 생성 시작 (Model: gemini-pro)");
  const targets = await fetchTargets();
  if (targets.length === 0) {
    console.log("생성 대상(gemini_summary is null)이 없습니다.");
    return;
  }
  console.log(`대상: ${targets.length}건`);
  const { success, failed } = await updateGemini(targets);
  console.log(`=== 최종 결과: 성공 ${success}, 실패 ${failed} ===`);
};

main().catch((err) => {
  console.error("스크립트 실패", err);
  process.exit(1);
});
