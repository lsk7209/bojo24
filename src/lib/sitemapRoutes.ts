import { MetadataRoute } from "next";
import { getAnonClient } from "@lib/supabaseClient";
import { createTursoCompatClient } from "@lib/tursoClient";
import { publicEnv } from "@lib/env";
import { buildPostPath } from "@lib/postRouting";

const UPDATED_AT = new Date().toISOString().slice(0, 10);

export const SITEMAP_REVALIDATE_SECONDS = 3600;
export const SITEMAP_BASE_URL =
    publicEnv.NEXT_PUBLIC_SITE_URL || "https://bojo24.kr";
export const BENEFIT_SITEMAP_PAGE_SIZE = 1000;

type SitemapEntry = MetadataRoute.Sitemap[number];

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

export function normalizeLastModified(
    value: string | null | undefined,
    fallback = UPDATED_AT,
): string {
    const raw = value?.trim() || fallback;
    const yyyymmdd = raw.match(/^(\d{4})(\d{2})(\d{2})$/);
    const normalized = yyyymmdd
        ? `${yyyymmdd[1]}-${yyyymmdd[2]}-${yyyymmdd[3]}`
        : raw;
    const parseable = normalized.replace(
        /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})$/,
        "$1T$2",
    );
    const parsed = Date.parse(parseable);
    if (Number.isNaN(parsed)) {
        return fallback;
    }

    const now = new Date();
    const date = new Date(parsed);
    if (date > now) {
        return now.toISOString().slice(0, 10);
    }

    return date.toISOString().slice(0, 10);
}

export function getStaticSitemapRoutes(): MetadataRoute.Sitemap {
    return [
        { path: "", priority: 1.0, changeFrequency: "daily" as const },
        { path: "/benefit", priority: 0.9, changeFrequency: "daily" as const },
        { path: "/startup", priority: 0.85, changeFrequency: "daily" as const },
        { path: "/blog", priority: 0.9, changeFrequency: "daily" as const },
        { path: "/about", lastModified: "2026-05-05", priority: 0.6, changeFrequency: "monthly" as const },
        { path: "/contact", lastModified: "2026-05-05", priority: 0.5, changeFrequency: "monthly" as const },
        { path: "/editorial-policy", lastModified: "2026-05-05", priority: 0.5, changeFrequency: "monthly" as const },
        { path: "/disclaimer", priority: 0.4, changeFrequency: "yearly" as const },
        { path: "/privacy", lastModified: "2026-05-05", priority: 0.3, changeFrequency: "yearly" as const },
        { path: "/terms", lastModified: "2026-05-05", priority: 0.3, changeFrequency: "yearly" as const },
    ].map((route) => ({
        url: `${SITEMAP_BASE_URL}${route.path}`,
        ...("lastModified" in route ? { lastModified: route.lastModified } : {}),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
    }));
}

export async function getBenefitSitemapRoutes(): Promise<MetadataRoute.Sitemap> {
    try {
        const supabase = getAnonClient();
        const rows: BenefitSitemapRow[] = [];

        // Supabase's default row cap is commonly 1,000. Fetch in bounded pages
        // so the sitemap does not silently stop at the first 10,000 benefits.
        for (let offset = 0; ; offset += BENEFIT_SITEMAP_PAGE_SIZE) {
            const { data, error } = await supabase
                .from("benefits")
                .select("id, category, last_updated_at")
                .order("last_updated_at", { ascending: false })
                .order("id", { ascending: true })
                .range(offset, offset + BENEFIT_SITEMAP_PAGE_SIZE - 1);

            if (error) throw error;

            const page = (data ?? []) as BenefitSitemapRow[];
            rows.push(...page);
            if (page.length < BENEFIT_SITEMAP_PAGE_SIZE) break;
        }

        return rows.map((item) => ({
            url: `${SITEMAP_BASE_URL}/benefit/${encodeURIComponent(item.category || "기타")}/${item.id}`,
            lastModified: normalizeLastModified(item.last_updated_at),
            changeFrequency: "weekly" as const,
            priority: 0.8,
        }));
    } catch {
        return [];
    }
}

export async function getBlogSitemapRoutes(): Promise<MetadataRoute.Sitemap> {
    try {
        const turso = createTursoCompatClient();
        const now = new Date().toISOString();
        const { data } = await turso
            .from("posts")
            .select("id, slug, created_at, published_at")
            .eq("is_published", true)
            .or(`published_at.is.null,published_at.lte.${now}`)
            .order("published_at", { ascending: false, nullsFirst: false });

        return ((data ?? []) as PostSitemapRow[])
            .filter((post) => post.id && post.slug)
            .map((post) => ({
                url: `${SITEMAP_BASE_URL}${buildPostPath(post)}`,
                lastModified: normalizeLastModified(post.published_at || post.created_at),
                changeFrequency: "monthly" as const,
                priority: 0.7,
            }));
    } catch {
        return [];
    }
}

export async function getStartupSitemapRoutes(): Promise<MetadataRoute.Sitemap> {
    try {
        const supabase = getAnonClient();
        const { data } = await supabase
            .from("startup_items")
            .select("id, updated_at, published_at")
            .order("updated_at", { ascending: false, nullsFirst: false })
            .limit(1000);

        return ((data ?? []) as StartupSitemapRow[])
            .filter((item) => item.id)
            .map((item) => ({
                url: `${SITEMAP_BASE_URL}/startup/${encodeURIComponent(item.id)}`,
                lastModified: normalizeLastModified(item.updated_at || item.published_at),
                changeFrequency: "daily" as const,
                priority: 0.75,
            }));
    } catch {
        return [];
    }
}

export function sitemapUrls(): string[] {
    return [
        `${SITEMAP_BASE_URL}/sitemap.xml`,
        `${SITEMAP_BASE_URL}/benefit/sitemap.xml`,
        `${SITEMAP_BASE_URL}/startup/sitemap.xml`,
        `${SITEMAP_BASE_URL}/blog/sitemap.xml`,
    ];
}
