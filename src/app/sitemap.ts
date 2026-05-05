import { getAnonClient } from "@lib/supabaseClient";
import { MetadataRoute } from "next";
import { publicEnv } from "@lib/env";
import { buildPostPath } from "@lib/postRouting";

const BASE_URL = publicEnv.NEXT_PUBLIC_SITE_URL || "https://www.bojo24.kr";
const STATIC_LAST_MODIFIED = "2026-05-05";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = getAnonClient();

    // 1. 정적 페이지 (필수 페이지)
    const staticRoutes = [
        { path: "", priority: 1.0, changeFrequency: "daily" as const },
        { path: "/benefit", priority: 0.9, changeFrequency: "daily" as const },
        { path: "/blog", priority: 0.9, changeFrequency: "daily" as const },
        { path: "/about", priority: 0.6, changeFrequency: "monthly" as const },
        { path: "/contact", priority: 0.5, changeFrequency: "monthly" as const },
        { path: "/editorial-policy", priority: 0.5, changeFrequency: "monthly" as const },
        { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
        { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
    ].map((route) => ({
        url: `${BASE_URL}${route.path}`,
        lastModified: STATIC_LAST_MODIFIED,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
    }));

    // 2. 보조금 상세 페이지 (최대 10,000개 - sitemap 제한 고려)
    const { data: benefits } = await supabase
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
    const now = new Date().toISOString();
    const { data: posts } = await supabase
        .from("posts")
        .select("id, slug, created_at, published_at")
        .eq("is_published", true)
        .or(`published_at.is.null,published_at.lte.${now}`)
        .order("published_at", { ascending: false, nullsFirst: false });

    const postRoutes =
        posts?.map((post) => ({
            url: `${BASE_URL}${buildPostPath(post)}`,
            lastModified: post.published_at || post.created_at,
            changeFrequency: "monthly" as const,
            priority: 0.7,
        })) ?? [];

    const allRoutes = [...staticRoutes, ...benefitRoutes, ...postRoutes];

    return allRoutes;
}
