import { getAnonClient } from "@lib/supabaseClient";
import Link from "next/link";
import { Badge, Card, Button } from "@components/ui";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AdPlaceholder } from "@components/ad-placeholder";
import ReactMarkdown from "react-markdown";

type PageParams = {
    params: { slug: string };
};

type BlogPostDetail = {
    id: string;
    title: string;
    content: string;
    tags: string[];
    created_at: string;
    benefit_id: string | null;
};

const fetchPost = async (slug: string) => {
    const supabase = getAnonClient();
    const { data } = await supabase
        .from("posts")
        .select("*")
        .eq("slug", slug)
        .single();
    return data as BlogPostDetail | null;
};

export const generateMetadata = async ({ params }: PageParams): Promise<Metadata> => {
    const post = await fetchPost(params.slug);
    if (!post) return {};
    return {
        title: post.title,
        description: post.content.substring(0, 150).replace(/\n/g, " "),
    };
};

export default async function BlogPostPage({ params }: PageParams) {
    const post = await fetchPost(params.slug);
    if (!post) notFound();

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
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                                🤖
                            </div>
                            <div>
                                <div className="font-bold text-slate-900 text-sm">보조금 파인더 AI</div>
                                <div className="text-xs text-slate-500">{new Date(post.created_at).toLocaleDateString()} · 3분 읽기</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* 본문 렌더링 (커스텀 스타일링) */}
                <div className="text-slate-700 leading-relaxed">
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
                                <span className="text-blue-600 hover:text-blue-800 font-medium underline underline-offset-4 decoration-blue-200 hover:decoration-blue-500 transition-colors cursor-pointer" {...props} />
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

            {/* 중간 광고 */}
            <div className="my-12">
                <AdPlaceholder label="맞춤형 정보 광고" />
            </div>

            {/* 관련 링크 카드 */}
            {post.benefit_id && (
                <div className="mt-10 p-1 rounded-2xl bg-gradient-to-r from-blue-100 to-indigo-100">
                    <Card className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 border-0 shadow-sm">
                        <div className="flex-1">
                            <div className="inline-block px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full mb-3">
                                공식 데이터 확인
                            </div>
                            <h4 className="font-bold text-xl text-slate-900 mb-2">이 정책, 나에게 맞는지 확인해볼까요?</h4>
                            <p className="text-slate-600">신청 대상, 구비 서류, 접수 기간 등<br className="hidden sm:block" />더 정확한 공식 데이터를 지금 바로 확인하세요.</p>
                        </div>
                        <Link href={`/benefit/view/${post.benefit_id}`} className="w-full sm:w-auto">
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
        </main>
    );
}
