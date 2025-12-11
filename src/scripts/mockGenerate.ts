/* eslint-disable no-console */
import "dotenv/config";
import { getServiceClient } from "@lib/supabaseClient";
import type { BenefitRecord } from "@/types/benefit";

// Mock Data Templates
const MOCK_SUMMARIES = [
    "이 혜택은 소득 기준을 충족하는 가구에 월 최대 10만원을 지원해요.\n신청은 온라인과 주민센터 방문 모두 가능하며, 매월 15일에 지급됩니다.\n자격 요건 변동 시 즉시 신고해야 불이익이 없으니 유의해주세요.",
    "청년들의 자산 형성을 돕기 위해 정부가 매칭 지원금을 적립해 드립니다.\n3년 만기 시 원금과 이자에 더해 추가 장려금까지 받을 수 있는 좋은 기회예요.\n현재 재직 중이거나 사업 소득이 있는 청년이라면 꼭 확인해보세요.",
    "난임 부부의 경제적 부담을 덜어드리기 위해 시술비를 지원하는 제도입니다.\n신선배아, 동결배아 등 시술 종류에 따라 지원 금액이 다르니 확인이 필요해요.\n보건소에 방문하여 지원 결정 통지서를 발급받은 후 시술을 시작해야 합니다."
];

const MOCK_FAQS = [
    [
        { q: "누가 신청할 수 있나요?", a: "기본적으로 해당 지역에 거주하는 만 19세 이상 성인이 대상입니다." },
        { q: "소득 기준이 있나요?", a: "네, 가구원 수에 따른 기준 중위소득 100% 이하여야 합니다." },
        { q: "어떻게 신청하나요?", a: "복지로 홈페이지 또는 관할 행정복지센터에서 신청 가능합니다." },
        { q: "필요한 서류는 무엇인가요?", a: "신분증, 소득증빙서류, 통장사본 등이 필요합니다." },
        { q: "재신청도 가능한가요?", a: "네, 지원 기간이 종료되면 재심사를 거쳐 다시 지원받을 수 있습니다." }
    ],
    [
        { q: "중복 수혜가 가능한가요?", a: "유사한 성격의 타 사업과 중복 지원은 불가능할 수 있습니다." },
        { q: "신청 기간은 언제까지인가요?", a: "예산 소진 시까지 연중 수시로 신청받고 있습니다." },
        { q: "지급일은 언제인가요?", a: "매월 25일에 신청한 계좌로 입금됩니다." },
        { q: "이사 가면 어떻게 되나요?", a: "전출입 신고를 하면 자동으로 이관되거나 재신청이 필요할 수 있습니다." },
        { q: "문의는 어디로 하나요?", a: "보건복지상담센터(129) 또는 관할 시군구청으로 문의해 주세요." }
    ]
];

const BATCH_LIMIT = 20;

const fetchTargets = async () => {
    const supabase = getServiceClient();
    const { data, error } = await supabase
        .from("benefits")
        .select("id, name")
        .is("gemini_summary", null)
        .limit(BATCH_LIMIT);
    if (error) throw error;
    return data as BenefitRecord[];
};

const updateMockData = async (rows: BenefitRecord[]) => {
    const supabase = getServiceClient();
    let success = 0;

    for (const row of rows) {
        // 랜덤하게 Mock 데이터 선택
        const summary = MOCK_SUMMARIES[Math.floor(Math.random() * MOCK_SUMMARIES.length)];
        const faq = MOCK_FAQS[Math.floor(Math.random() * MOCK_FAQS.length)];

        const { error } = await supabase
            .from("benefits")
            .update({
                gemini_summary: `[Mock] ${summary}`, // Mock임을 표시
                gemini_faq_json: faq
            })
            .eq("id", row.id);

        if (error) {
            console.error(`실패: ${row.id}`, error);
        } else {
            success += 1;
            console.log(`[Mock 생성] ${row.name}`);
        }
    }
    return success;
};

const main = async () => {
    console.log("Mock 데이터 생성 시작...");
    const targets = await fetchTargets();
    if (targets.length === 0) {
        console.log("대상 없음 (모두 처리됨)");
        return;
    }
    const count = await updateMockData(targets);
    console.log(`완료: ${count}건 처리됨`);
};

main();
