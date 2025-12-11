"use server";

import { getServiceClient } from "@lib/supabaseClient";
import type { BenefitRecord } from "@/types/benefit";
import { revalidatePath } from "next/cache";

const TITLE_TEMPLATES = [
    "🚨 2025년 {region} {name} 긴급 점검! 혹시 나도 대상자?",
    "{name} 신청 마감 임박? ⏳ {region} 거주자라면 필독!",
    "💰 월급 외 수입 만들기: {region} {name} 100% 활용법",
    "복잡한 서류는 가라! {name} 쉽고 빠르게 신청하는 꿀팁 ({region})",
    "놓치면 0원, 알면 목돈! {name} 핵심 요약 정리 📝"
];

const generateSlug = (title: string, id: string) => {
    return `${id.substring(0, 8)}-blog-post-${Date.now().toString(36)}`;
};

const generatePostContent = (benefit: BenefitRecord) => {
    const region = benefit.governing_org || "정부24";
    const detail = benefit.detail_json as any;
    const clean = (t: string) => (t || "별도 공고 참조").replace(/○/g, "").replace(/-/g, "").trim();

    const target = clean(detail.detail?.["지원대상"] || detail.list?.["지원대상"]);
    const content = clean(detail.detail?.["지원내용"] || detail.list?.["지원내용"]);
    const apply = clean(detail.detail?.["신청방법"] || detail.list?.["신청방법"]);
    const contact = clean(detail.detail?.["문의처"] || detail.list?.["전화문의"]);
    const type = benefit.category || "생활/복지";

    // Emoji Picker
    const emojis = ["✨", "💡", "🔥", "📢", "💰", "🎁"];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

    // 1. 후킹 (Hook) & 요약 카드
    const intro = `
**"혹시 이 혜택, 나만 모르고 있었나?"** 😲

안녕하세요, 스마트한 혜택 알리미 **보조금 파인더**입니다.
오늘은 **${region}** 주민이라면 반드시 알아야 할 **${benefit.name}**에 대해 파헤쳐 보겠습니다.

바쁜 여러분을 위해 **핵심만 딱 3가지**로 요약했습니다. 이것만 봐도 절반은 성공입니다! 👇

> ### 🚀 30초 핵심 요약
> 
> 1. **누가?** ${target.substring(0, 30)}... 등
> 2. **무엇을?** ${content.substring(0, 40)}...
> 3. **어떻게?** ${apply.split(' ')[0]} 등으로 간편 신청 가능!
`;

    // 2. 바디 (체크리스트)
    const checklist = `
## ✅ 나도 받을 수 있을까? (자격 체크)

가장 중요한 건 역시 **'내가 대상인가?'** 겠죠.
아래 항목 중 해당되는 게 있는지 체크해보세요.

${target.split('. ').map(t => `- ${t.trim()}`).join('\n')}

**💡 에디터의 TIP:**
> 지원 대상 조건이 헷갈린다면, 망설이지 말고 관할 부서에 **"제 상황이 이런데 가능한가요?"** 라고 물어보는 게 가장 빠릅니다!
`;

    // 3. 바디 (혜택 상세)
    const benefitDetail = `
## 🎁 어떤 혜택이 기다리고 있나요?

선정되신 분들에게는 다음과 같은 든든한 지원이 제공됩니다.
${type} 분야에서 실질적인 도움이 되는 혜택들이죠.

| 구분 | 내용 |
| :--- | :--- |
| **지원 형태** | ${type} |
| **주요 혜택** | ${content.replace(/\n/g, "<br/>")} |
| **지급 방식** | ${benefit.pay_type || "별도 문의"} |

단순한 금액 지원을 넘어, 여러분의 삶의 질을 높여줄 소중한 기회입니다. ${randomEmoji}
`;

    // 4. 바디 (신청 방법 & 팁)
    const howTo = `
## 📝 신청, 어렵지 않아요!

"서류 복잡하면 어쩌지..." 걱정하지 마세요. 절차는 생각보다 심플합니다.

1. **신청 기간 확인**: (상세 공고문 참조)
2. **접수처 방문**: ${apply}
3. **제출 서류**: 신분증, 신청서 등 (상세 페이지에서 다운로드)

**🚧 주의사항:**
> 신청 기간을 놓치면 다음 기약이 없을 수도 있습니다. **지금 바로 달력에 표시**해두는 센스! 🗓️
`;

    // 5. 아웃트로
    const outro = `
---

**${benefit.name}**, 이제 좀 감이 잡히시나요?
정보가 힘인 시대, 아는 만큼 누릴 수 있습니다.

혹시 더 궁금한 점이 있거나, **공식 공고문 원본**을 보고 싶으시다면?
아래 버튼을 눌러 **상세 페이지**에서 확인해보세요. 모든 정보가 투명하게 공개되어 있습니다.

여러분의 든든한 내일을 응원합니다! 💪
`;

    return intro + checklist + benefitDetail + howTo + outro;
};

// --- (아래는 기존 Server Actions 유지) ---

export async function generateSinglePost(password: string) {
    if (password !== (process.env.ADMIN_PASSWORD || "admin1234")) {
        return { success: false, message: "비밀번호가 일치하지 않습니다." };
    }

    try {
        const supabase = getServiceClient();

        // 랜덤 데이터 추출 (실제론 더 정교한 로직 권장)
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
            // Excerpt도 매력적으로 수정
            excerpt: `[${region}] ${benefit.name}: 자격 요건부터 신청 꿀팁까지! 30초 만에 핵심 내용을 확인해보세요. 🔍`,
            tags: [benefit.category, region.split(" ")[0] || "지원금", "2025정책", "필수정보"].filter(Boolean)
        });

        if (error) throw error;

        revalidatePath("/"); // 캐시 갱신
        return { success: true, message: `발행 완료: ${title}` };

    } catch (e: any) {
        console.error(e);
        return { success: false, message: e.message };
    }
}

export async function getDashboardStats() {
    const supabase = getServiceClient();
    const { count: benefitCount } = await supabase.from("benefits").select("*", { count: 'exact', head: true });
    const { count: postCount } = await supabase.from("posts").select("*", { count: 'exact', head: true });

    // 방문자 통계 (최근 7일)
    const { data: recentViews } = await supabase
        .from("page_views")
        .select("path, created_at")
        .order("created_at", { ascending: false })
        .limit(2000);

    const dailyVisits: Record<string, number> = {};
    const pageRanks: Record<string, number> = {};

    recentViews?.forEach((view) => {
        const date = new Date(view.created_at).toLocaleDateString();
        dailyVisits[date] = (dailyVisits[date] || 0) + 1;

        if (view.path.startsWith("/benefit/") || view.path.startsWith("/blog/")) {
            pageRanks[view.path] = (pageRanks[view.path] || 0) + 1;
        }
    });

    const sortedDaily = Object.entries(dailyVisits).sort().slice(-7);
    const sortedPages = Object.entries(pageRanks).sort((a, b) => b[1] - a[1]).slice(0, 10);

    return {
        overview: {
            benefits: benefitCount || 0,
            posts: postCount || 0,
            totalViews: recentViews?.length || 0
        },
        dailyVisits: sortedDaily,
        topPages: sortedPages
    };
}

export async function saveHeadScript(password: string, script: string) {
    if (password !== (process.env.ADMIN_PASSWORD || "admin1234")) return { success: false, message: "Auth Failed" };

    const supabase = getServiceClient();
    const { error } = await supabase
        .from("admin_settings")
        .upsert({ key: "head_script", value: script });

    if (error) return { success: false, message: error.message };

    revalidatePath("/");
    return { success: true, message: "저장되었습니다." };
}

export async function getHeadScript() {
    const supabase = getServiceClient();
    const { data } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "head_script")
        .single();
    return data?.value || "";
}
