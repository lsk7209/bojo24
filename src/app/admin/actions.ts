"use server";

import { getServiceClient } from "@lib/supabaseClient";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
    ADMIN_SESSION_COOKIE,
    createAdminSessionToken,
    isAdminPasswordConfigured,
    verifyAdminSessionToken,
} from "@lib/adminAuth";

// Gemini API 설정
const EXTERNAL_GENERATION_DISABLED_MESSAGE =
    "외부 API 기반 글생성은 비활성화되었습니다. Codex/persona-writer 워크플로우에서 직접 작성한 글만 저장하세요.";

async function requireAdminSession(): Promise<void> {
    const store = await cookies();
    const token = store.get(ADMIN_SESSION_COOKIE)?.value;
    const valid = await verifyAdminSessionToken(token);
    if (!valid) {
        throw new Error("Unauthorized");
    }
}

// 0. 로그인 / 로그아웃
export async function loginAdmin(password: string): Promise<{ success: boolean; message: string }> {
    if (!isAdminPasswordConfigured()) {
        return { success: false, message: "관리자 비밀번호가 설정되지 않았습니다." };
    }
    if (password !== process.env.ADMIN_PASSWORD) {
        return { success: false, message: "비밀번호가 틀렸습니다." };
    }

    const token = await createAdminSessionToken();
    const store = await cookies();
    store.set(ADMIN_SESSION_COOKIE, token, {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/admin",
        maxAge: 8 * 60 * 60,
    });

    return { success: true, message: "로그인되었습니다." };
}

export async function logoutAdmin(): Promise<void> {
    const store = await cookies();
    store.delete(ADMIN_SESSION_COOKIE);
}

// 1. AI 블로그 포스팅 생성 (현재 비활성화)
export async function generateSinglePost() {
    await requireAdminSession();
    return { success: false, message: EXTERNAL_GENERATION_DISABLED_MESSAGE };
}

// 2. 대시보드 통계
export async function getDashboardStats() {
    await requireAdminSession();

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
export async function saveHeadScript(script: string) {
    await requireAdminSession();

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
    await requireAdminSession();

    const supabase = getServiceClient();
    const { data } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "head_script")
        .single();
    return data?.value || "";
}
