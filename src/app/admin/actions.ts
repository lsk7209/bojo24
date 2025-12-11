"use server";

import { getServiceClient } from "@lib/supabaseClient";
import type { BenefitRecord } from "@/types/benefit";

// 스크립트에서 사용하던 로직을 서버 액션용으로 이식
const TITLE_TEMPLATES = [
    "2025년 {region} {name} 신청 가이드: 자격 요건 및 서류 완벽 정리",
    "{name} 자격 조회: {region} 거주자라면 월 얼마까지 받을까? 💰",
    "[필독] {region} {name}, 신청 안 하면 손해! 대상자 확인하기",
    "{name} 신청 방법 A to Z: 3분 만에 끝내는 {region} 지원금 접수",
    "아직도 {name} 모르세요? {region}에서 주는 숨은 혜택 찾기"
];

const generateSlug = (title: string, id: string) => {
    return `${id.substring(0, 8)}-blog-post-${Date.now().toString(36)}`;
};

const generatePostContent = (benefit: BenefitRecord) => {
    const region = benefit.governing_org || "전국/중앙정부";
    const detail = benefit.detail_json as any;
    const clean = (t: string) => (t || "-").replace(/○/g, "").replace(/-/g, "").trim();

    const target = clean(detail.detail?.["지원대상"] || detail.list?.["지원대상"]);
    const content = clean(detail.detail?.["지원내용"] || detail.list?.["지원내용"]);
    const apply = clean(detail.detail?.["신청방법"] || detail.list?.["신청방법"]);
    const contact = clean(detail.detail?.["문의처"] || detail.list?.["전화문의"]);
    const type = benefit.category || "복지";

    const summaryTable = `
| 📋 핵심 요약 | 내용 |
| :--- | :--- |
| **정책명** | ${benefit.name} |
| **관할 기관** | ${region} |
| **지원 분야** | ${type} |
| **신청 기간** | 별도 공고 참조 |
| **문의처** | ${contact} |
`;

    return `
안녕하세요! 공공데이터 분석 전문, **보조금 파인더**입니다. 📊

혹시 **${region}**에서 제공하는 **${benefit.name}**에 대해 들어보셨나요?
"나랑 상관없겠지" 하고 넘기기엔 혜택이 너무 아까운 정책 중 하나입니다.

바쁜 여러분을 위해 **신청 자격, 혜택 내용, 접수 방법**을 한 눈에 볼 수 있도록 정리했습니다.
30초면 충분하니 끝까지 확인해보세요! 👇

---

## ⚡ 30초 요약표

가장 중요한 정보만 모았습니다. 바쁘신 분들은 이것만 보셔도 됩니다!

${summaryTable}

---

## 🎯 누가 신청할 수 있나요?

**${benefit.name}**의 지원 대상은 다음과 같습니다.
본인이 해당하는지 체크해보세요. ✅

- **거주지 요건**: ${region}
- **주요 대상**: 
${target.split('. ').map(s => `  - ${s.trim()}`).join('\n')}

<br/>

## 💰 어떤 혜택이 있나요?

선정되시면 다음과 같은 구체적인 지원을 받을 수 있습니다.

> "${content.replace(/\n/g, " ")}"

단순한 현금 지원일 수도 있고, 바우처나 서비스 형태일 수도 있습니다.
**${type}** 분야에서 실질적인 도움이 되는 혜택이니 꼭 활용해보세요.

<br/>

## 📝 어떻게 신청하나요?

신청 절차는 생각보다 간단합니다.

### ✅ 신청 방법
${apply.split('. ').map(s => `1. ${s.trim()}`).join('\n')}

### ✅ 필요 서류
보통 **신분증**과 **신청서**는 필수이며, 소득 증빙 서류가 추가될 수 있습니다.
정확한 서류 목록은 하단의 **[상세 정보 보러가기]** 버튼을 눌러 확인하는 것이 가장 정확합니다.

---

## ❓ 자주 묻는 질문 (FAQ)

**Q. 온라인 신청이 가능한가요?**
A. 네, 대부분 '정부24'나 '${region} 등' 공식 홈페이지에서 가능합니다. 상세 페이지에서 링크를 확인하세요.

**Q. 문의는 어디로 하나요?**
A. **${contact}** 또는 관할 주민센터로 문의하시면 친절하게 안내받을 수 있습니다.

---

**${benefit.name}**, 이제 좀 이해가 되셨나요?
**${region}** 주민 여러분의 권리, 놓치지 말고 꼭 챙기시길 바랍니다! 💪

더 자세한 공고문과 접수처 링크가 필요하시다면?
아래 버튼을 눌러 확인해보세요! 👇
`;
};

export async function generateSinglePost(password: string) {
    // 간단한 보안 체크 (실제로는 환경변수 등으로 관리 권장)
    if (password !== (process.env.ADMIN_PASSWORD || "admin1234")) {
        return { success: false, message: "비밀번호가 일치하지 않습니다." };
    }

    try {
        const supabase = getServiceClient();

        // 아직 글이 없는 베네핏 중 하나 랜덤 선택
        // (더 정교하게 하려면 left join 후 null check 해야겠지만, 여기선 랜덤으로)
        const { data } = await supabase.from("benefits").select("*").limit(100);

        if (!data || data.length === 0) {
            return { success: false, message: "데이터가 없습니다." };
        }

        const benefit = data[Math.floor(Math.random() * data.length)] as BenefitRecord;

        const titleTemplate = TITLE_TEMPLATES[Math.floor(Math.random() * TITLE_TEMPLATES.length)];
        const region = benefit.governing_org || "전국";
        const title = titleTemplate
            .replace("{name}", benefit.name)
            .replace("{region}", region);

        const slug = generateSlug(title, benefit.id);
        const markdown = generatePostContent(benefit);

        const { error } = await supabase.from("posts").insert({
            benefit_id: benefit.id,
            title: title,
            slug: slug,
            content: markdown,
            excerpt: `[${region}] ${benefit.name} 요약표 제공. 자격 조건, 지원금, 신청 방법 한 번에 정리해드립니다.`,
            tags: [benefit.category, region.split(" ")[0] || "정부지원", "2025정책", "필수혜택"].filter(Boolean)
        });

        if (error) throw error;
        return { success: true, message: `발행 완료: ${title}` };

    } catch (e: any) {
        console.error(e);
        return { success: false, message: e.message };
    }
}

export async function getStats() {
    const supabase = getServiceClient();
    const { count: benefitCount } = await supabase.from("benefits").select("*", { count: 'exact', head: true });
    const { count: postCount } = await supabase.from("posts").select("*", { count: 'exact', head: true });

    return {
        benefits: benefitCount || 0,
        posts: postCount || 0
    };
}
