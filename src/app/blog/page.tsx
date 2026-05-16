import { createTursoCompatClient } from "@lib/tursoClient";
import Link from "next/link";
import { Badge, Card } from "@components/ui";
import { SectionHeader } from "@components/section-header";
import { buildCanonicalUrl, SITE_NAME, resolveSiteUrl } from "@lib/site";
import { buildPostPath } from "@lib/postRouting";
import type { Metadata } from "next";

const siteUrl = resolveSiteUrl();
const PAGE_SIZE = 24;

export const metadata: Metadata = {
    title: "정보마당",
    description: "정부 지원금 신청 팁, 복지 혜택 FAQ, 보조금 안내 자료를 한곳에서 읽어보세요. 보조24 편집팀이 공공데이터를 기반으로 정리합니다.",
    alternates: {
        canonical: buildCanonicalUrl("/blog"),
    },
    openGraph: {
        title: `정보마당 | ${SITE_NAME}`,
        description: "정부 지원금 신청 팁, 복지 혜택 FAQ, 보조금 안내 자료를 한곳에서 읽어보세요.",
        url: buildCanonicalUrl("/blog"),
        locale: "ko_KR",
        type: "website",
        images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
        card: "summary_large_image",
        title: `정보마당 | ${SITE_NAME}`,
        description: "정부 지원금 신청 팁, 복지 혜택 FAQ, 보조금 안내 자료를 한곳에서 읽어보세요.",
    },
};

type BlogPost = {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    tags: string[] | null;
    created_at: string;
    published_at: string | null;
};

type SearchParams = { page?: string };

const fetchPosts = async (page: number) => {
    try {
        const db = createTursoCompatClient();
        const now = new Date().toISOString();
        const offset = (page - 1) * PAGE_SIZE;
        const { data, error, count } = await db
            .from("posts")
            .select("id, title, slug, excerpt, tags, created_at, published_at", { count: "exact" })
            .eq("is_published", true)
            .or(`published_at.is.null,published_at.lte.${now}`)
            .order("published_at", { ascending: false, nullsFirst: false })
            .range(offset, offset + PAGE_SIZE - 1);

        if (error) {
            console.error("Error fetching posts:", error);
            return { posts: [], total: 0 };
        }
        return { posts: (data as BlogPost[]) ?? [], total: count ?? 0 };
    } catch (e) {
        console.error("Unexpected error in fetchPosts:", e);
        return { posts: [], total: 0 };
    }
};

export default async function BlogListPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>;
}) {
    const resolved = await searchParams;
    const page = Math.max(1, Number(resolved.page) || 1);
    const { posts, total } = await fetchPosts(page);
    const totalPages = Math.ceil(total / PAGE_SIZE);

    const itemListJsonLd = posts.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "정보마당",
        description: "정부 지원금·복지 혜택 안내 글 모음",
        url: buildCanonicalUrl("/blog"),
        mainEntity: {
            "@type": "ItemList",
            numberOfItems: posts.length,
            itemListElement: posts.map((post, idx) => ({
                "@type": "ListItem",
                position: (page - 1) * PAGE_SIZE + idx + 1,
                url: buildCanonicalUrl(buildPostPath(post)),
                name: post.title,
            })),
        },
    } : null;

    return (
        <main className="mx-auto flex max-w-4xl flex-col gap-8 pb-16 pt-6">
            <SectionHeader
                eyebrow="BLOG"
                as="h1"
                title="정보마당"
                description="놓치기 쉬운 혜택 정보, 알기 쉽게 정리해드립니다."
            />

            {posts.length === 0 ? (
                <Card className="py-12 text-center text-slate-500">
                    아직 발행된 글이 없습니다. 조금만 기다려주세요!
                </Card>
            ) : (
                <>
                    <p className="text-sm text-slate-500">
                        총 <strong className="text-slate-800">{total.toLocaleString()}</strong>개 글
                        {totalPages > 1 && ` · ${page}/${totalPages} 페이지`}
                    </p>

                    <div className="grid gap-6 sm:grid-cols-2">
                        {posts.map((post) => (
                            <Link key={post.id} href={buildPostPath(post)} className="group">
                                <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-md">
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {post.tags?.slice(0, 2).map((tag) => (
                                            <Badge key={tag} tone="primary">
                                                #{tag}
                                            </Badge>
                                        ))}
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 line-clamp-2 mb-2">
                                        {post.title}
                                    </h2>
                                    <p className="text-slate-600 line-clamp-3 text-sm leading-relaxed mb-4">
                                        {post.excerpt}
                                    </p>
                                    <div className="text-xs text-slate-400">
                                        {new Date(post.published_at || post.created_at).toLocaleDateString("ko-KR")} · 보조24
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <nav className="flex items-center justify-center gap-2" aria-label="페이지 탐색">
                            {page > 1 && (
                                <Link
                                    href={`/blog?page=${page - 1}`}
                                    className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    ← 이전
                                </Link>
                            )}
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                                const p = start + i;
                                return p <= totalPages ? (
                                    <Link
                                        key={p}
                                        href={`/blog?page=${p}`}
                                        className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${
                                            p === page
                                                ? "bg-blue-600 text-white"
                                                : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                                        }`}
                                    >
                                        {p}
                                    </Link>
                                ) : null;
                            })}
                            {page < totalPages && (
                                <Link
                                    href={`/blog?page=${page + 1}`}
                                    className="inline-flex h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                >
                                    다음 →
                                </Link>
                            )}
                        </nav>
                    )}
                </>
            )}

            {itemListJsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
                />
            )}
        </main>
    );
}
