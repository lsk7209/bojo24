import { getAnonClient } from "@lib/supabaseClient";
import { MetadataRoute } from "next";
import { publicEnv } from "@lib/env";
import { buildPostPath } from "@lib/postRouting";

const BASE_URL = publicEnv.NEXT_PUBLIC_SITE_URL || "https://www.bojo24.kr";
const UPDATED_AT = "2026-05-06";

export const revalidate = 3600;

type BenefitSitemapRow = {
    id: string;
    category: string | null;
    last_updated_at: string | null;
};

type PostSitemapRow = {
    id: string;
    slug: string;
    created_at: string | null;
    published_at: string | null;
};

type StartupSitemapRow = {
    id: string;
    updated_at: string | null;
    published_at: string | null;
};

const fetchSitemapRows = async () => {
    try {
        const db = getAnonClient();
        const now = new Date().toISOString();

        const [{ data: benefits }, { data: posts }, { data: startupItems }] = await Promise.all([
            db
                .from("benefits")
                .select("id, category, last_updated_at", { count: "exact" })
                .order("last_updated_at", { ascending: false })
                .limit(10000),
            db
                .from("posts")
                .select("id, slug, created_at, published_at")
                .eq("is_published", true)
                .or(`published_at.is.null,published_at.lte.${now}`)
                .order("published_at", { ascending: false, nullsFirst: false }),
            db
                .from("startup_items")
                .select("id, updated_at, published_at")
                .order("updated_at", { ascending: false, nullsFirst: false })
                .limit(1000),
        ]);

        return {
            benefits: (benefits ?? []) as BenefitSitemapRow[],
            posts: (posts ?? []) as PostSitemapRow[],
            startupItems: (startupItems ?? []) as StartupSitemapRow[],
        };
    } catch {
        return { benefits: [], posts: [], startupItems: [] };
    }
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // 1. 정적 페이지 (필수 페이지)
    const staticRoutes = [
        { path: "", lastModified: UPDATED_AT, priority: 1.0, changeFrequency: "daily" as const },
        { path: "/benefit", lastModified: UPDATED_AT, priority: 0.9, changeFrequency: "daily" as const },
        { path: "/startup", lastModified: UPDATED_AT, priority: 0.85, changeFrequency: "daily" as const },
        { path: "/blog", lastModified: UPDATED_AT, priority: 0.9, changeFrequency: "daily" as const },
        { path: "/about", lastModified: "2026-05-05", priority: 0.6, changeFrequency: "monthly" as const },
        { path: "/contact", lastModified: "2026-05-05", priority: 0.5, changeFrequency: "monthly" as const },
        { path: "/editorial-policy", lastModified: "2026-05-05", priority: 0.5, changeFrequency: "monthly" as const },
        { path: "/disclaimer", lastModified: UPDATED_AT, priority: 0.4, changeFrequency: "yearly" as const },
        { path: "/privacy", lastModified: "2026-05-05", priority: 0.3, changeFrequency: "yearly" as const },
        { path: "/terms", lastModified: "2026-05-05", priority: 0.3, changeFrequency: "yearly" as const },
    ].map((route) => ({
        url: `${BASE_URL}${route.path}`,
        lastModified: route.lastModified,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
    }));

    const { benefits, posts, startupItems } = await fetchSitemapRows();

    const benefitRoutes =
        benefits.map((item) => ({
            url: `${BASE_URL}/benefit/${encodeURIComponent(item.category || "기타")}/${item.id}`,
            lastModified: item.last_updated_at || new Date().toISOString(),
            changeFrequency: "weekly" as const,
            priority: 0.8,
        }));

    const postRoutes = posts
        .filter((post) => post.id && post.slug)
        .map((post) => ({
            url: `${BASE_URL}${buildPostPath(post)}`,
            lastModified: post.published_at || post.created_at || UPDATED_AT,
            changeFrequency: "monthly" as const,
            priority: 0.7,
        }));

    const startupRoutes = startupItems
        .filter((item) => item.id)
        .map((item) => ({
            url: `${BASE_URL}/startup/${encodeURIComponent(item.id)}`,
            lastModified: item.updated_at || item.published_at || UPDATED_AT,
            changeFrequency: "daily" as const,
            priority: 0.75,
        }));

    const allRoutes = [...staticRoutes, ...benefitRoutes, ...postRoutes, ...startupRoutes];

    return allRoutes;
}
