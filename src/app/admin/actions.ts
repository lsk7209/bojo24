"use server";

import { getServiceClient } from "@lib/supabaseClient";
import { revalidatePath } from "next/cache";

// Gemini API 설정
const EXTERNAL_GENERATION_DISABLED_MESSAGE =
    "\uc678\ubd80 API \uae30\ubc18 \uae00\uc0dd\uc131\uc740 \ube44\ud65c\uc131\ud654\ub418\uc5c8\uc2b5\ub2c8\ub2e4. Codex/persona-writer \uc6cc\ud06c\ud50c\ub85c\uc6b0\uc5d0\uc11c \uc9c1\uc811 \uc791\uc131\ud55c \uae00\ub9cc \uc800\uc7a5\ud558\uc138\uc694.";

export async function generateSinglePost(password: string) {
    if (password !== (process.env.ADMIN_PASSWORD || "admin1234")) {
        return { success: false, message: "Auth Failed" };
    }

    return { success: false, message: EXTERNAL_GENERATION_DISABLED_MESSAGE };
}

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
