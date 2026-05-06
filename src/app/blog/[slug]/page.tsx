import { getAnonClient } from "@lib/supabaseClient";
import Link from "next/link";
import { Badge, Card, Button } from "@components/ui";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { InlineAd } from "@components/adsense-ad";
import { AD_SLOTS } from "@lib/ads";
import { buildCanonicalUrl, SITE_NAME } from "@lib/site";
import { buildPostPath, parsePostRouteSlug } from "@lib/postRouting";
import ReactMarkdown from "react-markdown";

type PageParams = {
    params: Promise<{ slug: string }>;
};

type BlogPostDetail = {
    id: string;
    slug: string;
    title: string;
    content: string;
    tags: string[];
    created_at: string;
    published_at: string | null;
    benefit_id: string | null;
};

type RelatedBenefit = {
    id: string;
    category: string | null;
};

const stripMarkdown = (value: string) =>
    value
        .replace(/```[\s\S]*?```/g, " ")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[#>*_`|~-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

const buildDescription = (content: string) => {
    const text = stripMarkdown(content);
    return text.length > 118 ? `${text.slice(0, 117)}…` : text;
};

const estimateReadMinutes = (content: string) =>
    Math.max(3, Math.ceil(stripMarkdown(content).length / 650));

const fetchPost = async (routeSlug: string) => {
    const supabase = getAnonClient();
    const now = new Date().toISOString();
    const parsed = parsePostRouteSlug(routeSlug);
    const query = supabase
        .from("posts")
        .select("*")
        .eq("is_published", true)
        .or(`published_at.is.null,published_at.lte.${now}`);

    const { data } = parsed.id
        ? await query.eq("id", parsed.id).maybeSingle()
        : await query.eq("slug", parsed.slug).order("created_at", { ascending: true }).limit(1).maybeSingle();

    return data as BlogPostDetail | null;
};

const fetchRelatedBenefit = async (id: string): Promise<RelatedBenefit | null> => {
    const supabase = getAnonClient();
    const { data } = await supabase
        .from("benefits")
        .select("id, category")
        .eq("id", id)
        .maybeSingle();
    return data as RelatedBenefit | null;
};

export const generateMetadata = async ({ params }: PageParams): Promise<Metadata> => {
    const { slug } = await params;
    const post = await fetchPost(slug);
    if (!post) return {};
    const canonicalUrl = buildCanonicalUrl(buildPostPath(post));
    const description = buildDescription(post.content);
    return {
        title: post.title,
        description,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title: post.title,
            description,
            url: canonicalUrl,
            type: "article",
            locale: "ko_KR",
            publishedTime: post.published_at || post.created_at,
            modifiedTime: post.published_at || post.created_at,
            authors: [SITE_NAME],
            tags: post.tags ?? [],
            images: [
                {
                    url: buildCanonicalUrl("/opengraph-image"),
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: post.title,
            description,
            images: [buildCanonicalUrl("/opengraph-image")],
        },
    };
};

export default async function BlogPostPage({ params }: PageParams) {
    const { slug } = await params;
    const post = await fetchPost(slug);
    if (!post) notFound();
    const relatedBenefit = post.benefit_id
        ? await fetchRelatedBenefit(post.benefit_id)
        : null;
    const relatedBenefitHref = relatedBenefit
        ? `/benefit/${encodeURIComponent(relatedBenefit.category || "기타")}/${relatedBenefit.id}`
        : "/benefit";
    const canonicalUrl = buildCanonicalUrl(buildPostPath(post));
    const publishedAt = post.published_at || post.created_at;
    const readMinutes = estimateReadMinutes(post.content);
    const articleJsonLd = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: buildDescription(post.content),
        url: canonicalUrl,
        datePublished: publishedAt,
        dateModified: publishedAt,
        author: {
            "@type": "Organization",
            name: SITE_NAME,
            url: buildCanonicalUrl("/about"),
        },
        publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            url: buildCanonicalUrl("/"),
            logo: {
                "@type": "ImageObject",
                url: buildCanonicalUrl("/opengraph-image"),
            },
        },
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": canonicalUrl,
        },
    };
    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "홈", item: buildCanonicalUrl("/") },
            { "@type": "ListItem", position: 2, name: "정보마당", item: buildCanonicalUrl("/blog") },
            { "@type": "ListItem", position: 3, name: post.title, item: canonicalUrl },
        ],
    };

    return (
        <main className="mx-auto max-w-3xl pb-24 pt-8 px-4">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
                <Link href="/" className="hover:text-blue-600">홈</Link>
                <span>&gt;</span>
                <Link href="/blog" className="hover:text-blue-600">정보마당</Link>
                <span>&gt;</span>
                <span className="line-clamp-1 text-slate-900">{post.title}</span>
            </nav>

            <article className="prose prose-slate prose-lg max-w-none">
                {/* 헤더 섹션 */}
                <header className="mb-10 not-prose">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags?.map((tag) => (
                            <Badge key={tag} tone="primary">
                                #{tag}
                            </Badge>
                        ))}
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-6">
                        {post.title}
                    </h1>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-700">
                                보
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 text-sm">보조24 편집팀</div>
                                <div className="text-xs text-slate-500">
                                    {new Date(publishedAt).toLocaleDateString()} · {readMinutes}분 읽기
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* 본문 렌더링 (커스텀 스타일링) */}
                <div className="text-slate-700 leading-8">
                    <ReactMarkdown
                        components={{
                            // H2: 섹션 제목 스타일
                            h2: ({ node, ...props }) => (
                                <h2 className="text-2xl font-bold mt-12 mb-6 text-slate-900 flex items-center gap-2 border-b-2 border-slate-100 pb-3" {...props} />
                            ),
                            // H3: 소제목 스타일
                            h3: ({ node, ...props }) => (
                                <h3 className="text-xl font-bold mt-8 mb-4 text-slate-800" {...props} />
                            ),
                            // P: 본문 텍스트 (줄바꿈 처리)
                            p: ({ node, ...props }) => (
                                <p className="mb-6 whitespace-pre-line" {...props} />
                            ),
                            // Blockquote: 꿀팁/강조 박스 스타일 (타입 에러 수정됨)
                            blockquote: ({ node, children, ...props }) => (
                                <div className="bg-blue-50 border-l-4 border-blue-500 p-5 my-8 rounded-r-xl text-slate-700 shadow-sm">
                                    <div className="flex gap-3">
                                        <span className="text-2xl">💡</span>
                                        <div className="flex-1 italic">
                                            {children}
                                        </div>
                                    </div>
                                </div>
                            ),
                            // UL: 리스트 스타일
                            ul: ({ node, ...props }) => (
                                <ul className="space-y-3 my-6 list-none pl-0" {...props} />
                            ),
                            // LI: 체크리스트 아이템 스타일
                            li: ({ node, children, ...props }) => (
                                <li className="flex gap-3 items-start" {...props}>
                                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                                    <span>{children}</span>
                                </li>
                            ),
                            // Table: 테이블 스타일 (가로 스크롤 허용)
                            table: ({ node, ...props }) => (
                                <div className="overflow-x-auto my-8 rounded-xl border border-slate-200 shadow-sm">
                                    <table className="w-full text-sm text-left" {...props} />
                                </div>
                            ),
                            th: ({ node, ...props }) => (
                                <th className="bg-slate-50 px-4 py-3 font-bold text-slate-700 border-b border-slate-200" {...props} />
                            ),
                            td: ({ node, ...props }) => (
                                <td className="px-4 py-3 border-b border-slate-100 last:border-0" {...props} />
                            ),
                            // Link: 링크 스타일
                            a: ({ node, ...props }) => (
                                <a
                                    className="font-medium text-blue-700 underline decoration-blue-200 underline-offset-4 transition-colors hover:text-blue-900 hover:decoration-blue-500"
                                    target={props.href?.startsWith("http") ? "_blank" : undefined}
                                    rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                                    {...props}
                                />
                            ),
                            // HR: 구분선
                            hr: ({ node, ...props }) => (
                                <hr className="my-10 border-slate-100" {...props} />
                            ),
                            // Strong: 강조
                            strong: ({ node, ...props }) => (
                                <strong className="font-bold text-slate-900 bg-yellow-100/50 px-1 rounded" {...props} />
                            ),
                        }}
                    >
                        {post.content}
                    </ReactMarkdown>
                </div>
            </article>

            {/* 중간 광고 (본문 중간) */}
            <div className="my-12">
                <InlineAd adSlot={AD_SLOTS.blogInline} />
            </div>

            {/* 관련 링크 카드 */}
            {post.benefit_id && (
                <div className="mt-10 p-1 rounded-2xl bg-gradient-to-r from-blue-100 to-indigo-100">
                    <Card className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 border-0 shadow-sm">
                        <div className="flex-1">
                            <div className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full mb-3">
                                공식 데이터 확인
                            </div>
                            <h2 className="font-bold text-xl text-slate-900 mb-2">이 정책, 나에게 맞는지 확인해볼까요?</h2>
                            <p className="text-slate-600">신청 대상, 구비 서류, 접수 기간 등<br className="hidden sm:block" />더 정확한 공식 데이터를 지금 바로 확인하세요.</p>
                        </div>
                        <Link href={relatedBenefitHref} className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-blue-200">
                                상세 조건 보러가기 👉
                            </Button>
                        </Link>
                    </Card>
                </div>
            )}

            <div className="mt-16 text-center border-t pt-10">
                <Link href="/blog">
                    <Button variant="ghost" size="lg">목록으로 돌아가기</Button>
                </Link>
            </div>

            {[articleJsonLd, breadcrumbJsonLd].map((data, index) => (
                <script
                    key={index}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
                />
            ))}
        </main>
    );
}
