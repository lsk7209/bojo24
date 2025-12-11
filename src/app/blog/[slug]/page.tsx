import { getAnonClient } from "@lib/supabaseClient";
import Link from "next/link";
import { Badge, Card, Button } from "@components/ui";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AdPlaceholder } from "@components/ad-placeholder";

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
                <span className="line-clamp-1">{post.title}</span>
            </nav>

            <article className="prose prose-slate max-w-none">
                <header className="mb-8 not-prose">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {post.tags?.map((tag) => (
                            <Badge key={tag} tone="muted">
                                #{tag}
                            </Badge>
                        ))}
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
                        {post.title}
                    </h1>
                    <div className="text-sm text-slate-500 flex items-center gap-2">
                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        <span>·</span>
                        <span>에디터 🤖</span>
                    </div>
                </header>

                <div className="h-px w-full bg-slate-200 my-8" />

                {/* 본문 콘텐츠 (Markdown 스타일 흉내) */}
                <div className="whitespace-pre-line text-lg leading-relaxed text-slate-800 space-y-4">
                    {post.content.split('\n').map((line, i) => {
                        if (line.startsWith('## ')) {
                            return <h2 key={i} className="text-2xl font-bold text-slate-900 mt-10 mb-4">{line.replace('## ', '')}</h2>
                        }
                        if (line.startsWith('- ')) {
                            return <li key={i} className="ml-4 list-disc marker:text-blue-500">{line.replace('- ', '')}</li>
                        }
                        return <p key={i}>{line}</p>
                    })}
                </div>
            </article>

            {/* 중간 광고 */}
            <div className="my-10">
                <AdPlaceholder label="블로그 중간 광고" />
            </div>

            {/* 관련 링크 */}
            {post.benefit_id && (
                <Card className="mt-8 bg-blue-50 border-blue-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h4 className="font-bold text-blue-900">이 혜택, 더 자세히 보고 싶다면?</h4>
                        <p className="text-sm text-blue-700">공식 데이터와 자격 요건을 상세 페이지에서비교해보세요.</p>
                    </div>
                    <Link href={`/benefit/view/${post.benefit_id}`}>
                        <Button variant="primary">상세 정보 보러가기</Button>
                    </Link>
                </Card>
            )}

            <div className="mt-12 flex justify-center">
                <Link href="/blog">
                    <Button variant="ghost">목록으로 돌아가기</Button>
                </Link>
            </div>
        </main>
    );
}
