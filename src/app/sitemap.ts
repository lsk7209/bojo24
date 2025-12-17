import { getAnonClient } from "@lib/supabaseClient";
import { MetadataRoute } from "next";
import { publicEnv } from "@lib/env";

const BASE_URL = publicEnv.NEXT_PUBLIC_SITE_URL || "https://bojo24.kr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = getAnonClient();

    // 1. 정적 페이지 (필수 페이지)
    const staticRoutes = [
        { path: "", priority: 1.0, changeFrequency: "daily" as const },
        { path: "/benefit", priority: 0.9, changeFrequency: "daily" as const },
        { path: "/blog", priority: 0.9, changeFrequency: "daily" as const },
        { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
        { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
    ].map((route) => ({
        url: `${BASE_URL}${route.path}`,
        lastModified: new Date().toISOString(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
    }));

    // 2. 보조금 상세 페이지 (최대 10,000개 - sitemap 제한 고려)
    const { data: benefits, count: benefitCount } = await supabase
        .from("benefits")
        .select("id, category, last_updated_at", { count: "exact" })
        .order("last_updated_at", { ascending: false })
        .limit(10000); // Google sitemap 제한: 50,000 URL, 50MB

    const benefitRoutes =
        benefits?.map((item) => ({
            url: `${BASE_URL}/benefit/${encodeURIComponent(item.category || "기타")}/${item.id}`,
            lastModified: item.last_updated_at || new Date().toISOString(),
            changeFrequency: "weekly" as const,
            priority: 0.8,
        })) ?? [];

    // 3. 블로그 포스트
    const { data: posts } = await supabase
        .from("posts")
        .select("slug, created_at, updated_at")
        .order("created_at", { ascending: false });

    const postRoutes =
        posts?.map((post) => ({
            url: `${BASE_URL}/blog/${post.slug}`,
            lastModified: post.updated_at || post.created_at,
            changeFrequency: "monthly" as const,
            priority: 0.7,
        })) ?? [];

    const allRoutes = [...staticRoutes, ...benefitRoutes, ...postRoutes];

    // 로그 출력 (개발 환경에서만)
    if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.log(`📊 Sitemap 생성 완료:`);
        // eslint-disable-next-line no-console
        console.log(`  - 정적 페이지: ${staticRoutes.length}개`);
        // eslint-disable-next-line no-console
        console.log(`  - 보조금 페이지: ${benefitRoutes.length}개`);
        // eslint-disable-next-line no-console
        console.log(`  - 블로그 포스트: ${postRoutes.length}개`);
        // eslint-disable-next-line no-console
        console.log(`  - 총 URL: ${allRoutes.length}개`);
    }

    return allRoutes;
}
