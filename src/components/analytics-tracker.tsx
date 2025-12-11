"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getAnonClient } from "@lib/supabaseClient";

export function AnalyticsTracker() {
    const pathname = usePathname();

    useEffect(() => {
        // 로컬 개발 환경에서는 로깅 제외 (원하면 주석 해제)
        if (process.env.NODE_ENV === "development") return;

        const logView = async () => {
            try {
                const supabase = getAnonClient();
                await supabase.from("page_views").insert({
                    path: pathname,
                    user_agent: window.navigator.userAgent,
                });
            } catch (e) {
                // 로깅 실패는 조용히 무시
                console.error("Analytics Error", e);
            }
        };

        // 페이지 진입 1초 후 로깅 (단순 새로고침/이탈 필터링 효과)
        const timer = setTimeout(logView, 1000);
        return () => clearTimeout(timer);
    }, [pathname]);

    return null;
}
