/* eslint-disable no-console */
import "dotenv/config";
import { getServiceClient } from "@lib/supabaseClient";
import type { BenefitRecord } from "@/types/benefit";

// Mock AI가 작성할 블로그 글 템플릿
const MOCK_TITLES = [
    "2025년 {name}, 신청 안 하면 손해! 완벽 정리",
    "{name} 자격 조건과 신청 방법, 이것만 알면 됩니다",
    "놓치기 쉬운 정부 혜택: {name} 총정리",
    "{name} 아직도 모르세요? 3분 만에 핵심 요약!"
];

const generateSlug = (title: string) => {
    // 간단한 슬러그 생성 (실제로는 영문 번역이나 ID 조합 권장)
    return Math.random().toString(36).substring(2, 10) + "-" + Date.now();
};

const MAIN_CONTENT_TEMPLATE = `
안녕하세요! 여러분의 든든한 혜택 알리미 **보조금 파인더**입니다. 💁‍♀️

오늘은 많은 분들이 궁금해하시는 **{name}**에 대해 자세히 알아보려고 해요.
지원 대상부터 신청 방법까지 꼼꼼하게 정리했으니 놓치지 말고 꼭 확인해보세요!

## 🎯 누가 받을 수 있나요? (지원 대상)

가장 중요한 자격 요건부터 살펴볼까요?

- **소관 기관**: {gov}
- **지원 분야**: {category}

{target_detail}

## 🎁 어떤 혜택이 있나요? (지원 내용)

이 제도를 통해 받을 수 있는 구체적인 혜택은 다음과 같습니다.

{content_detail}

## 📝 어떻게 신청하나요? (신청 방법)

신청 기간과 방법은 아래와 같습니다. 기간을 놓치면 아쉬우니 꼭 메모해두세요!

{apply_detail}

## 💡 자주 묻는 질문 (FAQ)

**Q. 다른 혜택과 중복해서 받을 수 있나요?**
A. 대부분의 경우 유사한 사업과 중복 수혜가 불가능하지만, 정확한 내용은 관할 기관({gov})에 문의해보시는 것이 가장 정확합니다.

**Q. 문의처는 어디인가요?**
A. 궁금한 점이 있다면 언제든 문의해보세요.

---

지금까지 **{name}**에 대해 알아보았습니다.
도움이 되셨나요? 더 많은 혜택 정보가 궁금하다면 **보조금 파인더**를 계속 지켜봐주세요! 😉
`;

const fetchRandomBenefit = async () => {
    const supabase = getServiceClient();
    // 아직 포스팅되지 않은 베네핏을 가져와야 하지만, 테스트용으로 랜덤 선택
    // 테이블이 많아지면 random() 정렬은 느릴 수 있으니 주의
    const { data } = await supabase
        .from("benefits")
        .select("*")
        .limit(50); // 50개 중 랜덤

    if (!data || data.length === 0) return null;
    return data[Math.floor(Math.random() * data.length)] as BenefitRecord;
};

const createPost = async () => {
    console.log("블로그 포스팅 주제 선정 중...");
    const benefit = await fetchRandomBenefit();

    if (!benefit) {
        console.log("포스팅할 대상 데이터가 없습니다.");
        return;
    }

    const detail = benefit.detail_json as any;
    const target = detail.detail?.["지원대상"] || detail.list?.["지원대상"] || "상세 자격 요건을 확인해주세요.";
    const content = detail.detail?.["지원내용"] || detail.list?.["지원내용"] || "다양한 혜택이 준비되어 있습니다.";
    const apply = detail.detail?.["신청방법"] || detail.list?.["신청방법"] || "온라인 또는 방문 신청이 가능합니다.";

    // Mock Content 생성
    const randomTitleTemplate = MOCK_TITLES[Math.floor(Math.random() * MOCK_TITLES.length)];
    const title = randomTitleTemplate.replace("{name}", benefit.name);
    const slug = generateSlug(title);

    let markdown = MAIN_CONTENT_TEMPLATE
        .replace(/{name}/g, benefit.name)
        .replace(/{gov}/g, benefit.governing_org)
        .replace(/{category}/g, benefit.category)
        .replace("{target_detail}", target)
        .replace("{content_detail}", content)
        .replace("{apply_detail}", apply);

    const supabase = getServiceClient();
    const { error } = await supabase.from("posts").insert({
        benefit_id: benefit.id,
        title: title,
        slug: slug,
        content: markdown,
        excerpt: `${benefit.name}에 대한 핵심 정보를 3분 만에 정리해드립니다. 자격 요건과 신청 방법을 확인하세요.`,
        tags: [benefit.category, "정부혜택", benefit.governing_org].filter(Boolean)
    });

    if (error) {
        console.error("포스팅 저장 실패:", error);
    } else {
        console.log(`[발행 성공] ${title}`);
        console.log(`URL: /blog/${slug}`);
    }
};

const main = async () => {
    console.log("자동 블로그 포스팅 시작 (5건 생성)");
    for (let i = 0; i < 5; i++) {
        await createPost();
        await new Promise(r => setTimeout(r, 500));
    }
    console.log("포스팅 생성 완료");
};

main().catch(console.error);
