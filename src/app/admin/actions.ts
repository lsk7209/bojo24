"use server";

import { getServiceClient } from "@lib/supabaseClient";
import type { BenefitRecord } from "@/types/benefit";
import { revalidatePath } from "next/cache";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { notifySearchEngines } from "@lib/search-indexing";
import { buildCanonicalUrl } from "@lib/site";

// Gemini API 설정
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const generateSlug = (title: string, id: string) => {
    return `${id.substring(0, 8)}-blog-post-${Date.now().toString(36)}`;
};

// AI에게 글쓰기 요청
async function generatePostByAI(benefit: BenefitRecord) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    // 데이터 전처리
    const detail = benefit.detail_json as any;
    const info = `
    - 정책명: ${benefit.name}
    - 소관기관: ${benefit.governing_org}
    - 지원대상: ${JSON.stringify(detail.detail?.["지원대상"] || detail.list?.["지원대상"])}
    - 지원내용: ${JSON.stringify(detail.detail?.["지원내용"] || detail.list?.["지원내용"])}
    - 신청방법: ${JSON.stringify(detail.detail?.["신청방법"] || detail.list?.["신청방법"])}
    - 문의처: ${JSON.stringify(detail.detail?.["문의처"] || detail.list?.["전화문의"])}
    `;

    const prompt = `
    당신은 대한민국 최고의 정책 분석 에디터입니다.
    아래 정부 보조금 데이터를 바탕으로, 시민들이 이해하기 쉽고 매력적인 블로그 포스트를 마크다운(Markdown) 형식으로 작성해주세요.

    [작성 가이드]
    1. **톤앤매너**: 친절하고 전문적이며, 독자의 관심을 끄는 구어체를 사용하세요. ("~해요", "~알아볼까요?")
    2. **구조**:
       - **인트로**: 독자의 호기심을 자극하는 질문으로 시작하고, 3줄 요약 박스(> 인용문)를 포함하세요.
       - **본문 1 (대상)**: "누가 받을 수 있나요?" - 체크리스트 형식(- 불릿)으로 작성.
       - **본문 2 (혜택)**: "어떤 혜택인가요?" - 핵심 내용을 강조.
       - **본문 3 (신청)**: "어떻게 신청하나요?" - 단계별(1. 2. 3.)로 명확하게.
       - **아웃트로**: 희망적인 메시지와 함께 마무리.
    3. **디자인 요소**:
       - 적절한 이모지(✨, 💰, 📢 등)를 사용하여 시각적 재미를 더하세요.
       - 중요한 단어는 **굵게** 표시하세요.
       - 팁이 있다면 > 인용문으로 "💡 에디터 꿀팁"을 추가하세요.

    [데이터]
    ${info}

    [출력 형식]
    제목과 본문을 포함한 마크다운 (제목은 # 없이 첫 줄에 작성)
    `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // 첫 줄을 제목으로 추출
        const splitIndex = text.indexOf('\n');
        let title = text.substring(0, splitIndex).replace(/^#+\s*/, '').trim();
        let content = text.substring(splitIndex + 1).trim();

        // 제목이 너무 길면 안전장치
        if (title.length > 50) title = `${benefit.name} - 신청 가이드`;

        return { title, content };
    } catch (e) {
        console.error("AI Generation Failed:", e);
        throw new Error("AI 글쓰기 실패");
    }
}

// 1. 단일 포스트 생성 (AI 버전)
export async function generateSinglePost(password: string) {
    if (password !== (process.env.ADMIN_PASSWORD || "admin1234")) {
        return { success: false, message: "비밀번호가 일치하지 않습니다." };
    }

    try {
        const supabase = getServiceClient();

        // 랜덤 데이터 1개 추출
        const { data } = await supabase.from("benefits").select("*").limit(100);
        if (!data || data.length === 0) return { success: false, message: "데이터 없음" };

        const benefit = data[Math.floor(Math.random() * data.length)] as BenefitRecord;

        // AI 생성
        const { title, content } = await generatePostByAI(benefit);
        const slug = generateSlug(title, benefit.id);

        // DB 저장
        const { error } = await supabase.from("posts").insert({
            benefit_id: benefit.id,
            title: title,
            slug: slug,
            content: content,
            excerpt: content.substring(0, 100).replace(/[#*`]/g, "") + "...", // 본문 앞부분을 요약으로
            tags: [benefit.category, benefit.governing_org?.split(" ")[0]].filter(Boolean) as string[]
        });

        if (error) throw error;

        revalidatePath("/");
        revalidatePath("/blog");
        revalidatePath("/sitemap.xml");
        revalidatePath("/rss.xml");
        await notifySearchEngines([buildCanonicalUrl(`/blog/${slug}`)]);

        return { success: true, message: `[AI] 발행 완료: ${title}` };

    } catch (e: any) {
        console.error(e);
        return { success: false, message: `Error: ${e.message}` };
    }
}

// 2. 통합 대시보드 통계 조회
export async function getDashboardStats() {
    const supabase = getServiceClient();
    const { count: benefitCount } = await supabase.from("benefits").select("*", { count: 'exact', head: true });
    const { count: postCount } = await supabase.from("posts").select("*", { count: 'exact', head: true });

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

// 3. Head 스크립트 저장
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

// 4. Head 스크립트 불러오기
export async function getHeadScript() {
    const supabase = getServiceClient();
    const { data } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "head_script")
        .single();
    return data?.value || "";
}
