import { getAnonClient } from "@lib/supabaseClient";
import { MetadataRoute } from "next";

const BASE_URL = "https://bojo24.kr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = getAnonClient();

    // 1. 정적 페이지
    const routes = ["", "/benefit", "/blog"].map((route) => ({
        url: `${BASE_URL}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: "daily" as const,
        priority: 1.0,
    }));

    // 2. 보조금 상세 페이지 (최대 5000개)
    const { data: benefits } = await supabase
        .from("benefits")
        .select("id, category, last_updated_at")
        .limit(5000);

    const benefitRoutes =
        benefits?.map((item) => ({
            url: `${BASE_URL}/benefit/${item.category}/${item.id}`,
            lastModified: item.last_updated_at || new Date().toISOString(),
            changeFrequency: "weekly" as const, // 데이터 업데이트 주기에 따라
            priority: 0.8,
        })) ?? [];

    // 3. 블로그 포스트
    const { data: posts } = await supabase
        .from("posts")
        .select("slug, created_at");

    const postRoutes =
        posts?.map((post) => ({
            url: `${BASE_URL}/blog/${post.slug}`,
            lastModified: post.created_at,
            changeFrequency: "monthly" as const,
            priority: 0.7,
        })) ?? [];

    return [...routes, ...benefitRoutes, ...postRoutes];
}
