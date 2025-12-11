import { getAnonClient } from "@lib/supabaseClient";
import Link from "next/link";
import { Badge, Card } from "@components/ui";
import { SectionHeader } from "@components/section-header";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "정보마당 | 보조금 파인더",
    description: "정부 혜택과 관련된 유용한 정보와 꿀팁을 확인하세요."
};

type BlogPost = {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    tags: string[];
    created_at: string;
    benefit_id: string | null;
};

const fetchPosts = async () => {
    try {
        const supabase = getAnonClient();
        const { data, error } = await supabase
            .from("posts")
            .select("id, title, slug, excerpt, tags, created_at")
            .order("created_at", { ascending: false })
            .limit(20);

        if (error) {
            console.error("Error fetching posts:", error);
            return [];
        }
        return (data as BlogPost[]) ?? [];
    } catch (e) {
        console.error("Unexpected error in fetchPosts:", e);
        return [];
    }
};

export default async function BlogListPage() {
    const posts = await fetchPosts();

    return (
        <main className="mx-auto flex max-w-4xl flex-col gap-8 pb-16 pt-6">
            <SectionHeader
                eyebrow="BLOG"
                title="정보마당"
                description="놓치기 쉬운 혜택 정보, 알기 쉽게 정리해드립니다."
            />

            {posts.length === 0 ? (
                <Card className="py-12 text-center text-slate-500">
                    아직 발행된 글이 없습니다. 조금만 기다려주세요! 📝
                </Card>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2">
                    {posts.map((post) => (
                        <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                            <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-md">
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {post.tags?.slice(0, 2).map((tag) => (
                                        <Badge key={tag} tone="primary">
                                            #{tag}
                                        </Badge>
                                    ))}
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 line-clamp-2 mb-2">
                                    {post.title}
                                </h3>
                                <p className="text-slate-600 line-clamp-3 text-sm leading-relaxed mb-4">
                                    {post.excerpt}
                                </p>
                                <div className="text-xs text-slate-400">
                                    {new Date(post.created_at).toLocaleDateString()} · 보조금 파인더
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </main>
    );
}
