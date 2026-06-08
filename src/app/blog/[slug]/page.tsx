import { Badge, Button, Card } from "@components/ui";
import { buildPostPath, parsePostRouteSlug } from "@lib/postRouting";
import { buildCanonicalUrl, SITE_NAME } from "@lib/site";
import { createTursoCompatClient } from "@lib/tursoClient";
import { getAnonClient } from "@lib/supabaseClient";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

const getHeadingText = (children: React.ReactNode): string =>
  React.Children.toArray(children)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") return String(child);
      if (React.isValidElement<{ children?: React.ReactNode }>(child)) {
        return getHeadingText(child.props.children);
      }
      return "";
    })
    .join("")
    .trim();

const buildHeadingId = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);

const createHeadingIdFactory = () => {
  const seen = new Map<string, number>();

  return (text: string) => {
    const baseId = buildHeadingId(text) || "section";
    const count = seen.get(baseId) ?? 0;
    seen.set(baseId, count + 1);
    return count === 0 ? baseId : `${baseId}-${count + 1}`;
  };
};

const extractTocItems = (content: string) =>
  (() => {
    const headingId = createHeadingIdFactory();
    return [...content.matchAll(/^(##|###)\s+(.+)$/gm)].map((match) => {
      const text = stripMarkdown(match[2] ?? "");
      return {
        id: headingId(text),
        level: match[1] === "###" ? 3 : 2,
        text,
      };
    });
  })()
    .filter((item) => item.id && item.text)
    .slice(0, 12);

const extractFaqItems = (content: string) => {
  const faqSection =
    content.match(/##\s+[^\n]*(?:FAQ|자주 묻는 질문)[^\n]*\n([\s\S]*?)(?=\n##\s+|$)/i)?.[1] ?? "";
  if (!faqSection) return [];

  return [...faqSection.matchAll(/\*\*Q\d+\.\s*(.*?)\*\*\s*(?: {2})?\r?\n([\s\S]*?)(?=\r?\n\*\*Q\d+\.|$)/g)]
    .map((match) => ({
      question: stripMarkdown(match[1] ?? ""),
      answer: stripMarkdown(match[2] ?? ""),
    }))
    .filter((item) => item.question && item.answer)
    .slice(0, 5);
};

const fetchPost = async (routeSlug: string) => {
  const db = createTursoCompatClient();
  const now = new Date().toISOString();
  const parsed = parsePostRouteSlug(routeSlug);
  const query = db
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
  const ogImageUrl = buildCanonicalUrl(`${buildPostPath(post)}/opengraph-image`);

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
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${post.title} 썸네일`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [ogImageUrl],
    },
  };
};

export default async function BlogPostPage({ params }: PageParams) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) notFound();

  const relatedBenefit = post.benefit_id ? await fetchRelatedBenefit(post.benefit_id) : null;
  const relatedBenefitHref = relatedBenefit
    ? `/benefit/${encodeURIComponent(relatedBenefit.category || "기타")}/${relatedBenefit.id}`
    : "/benefit";
  const canonicalUrl = buildCanonicalUrl(buildPostPath(post));
  const publishedAt = post.published_at || post.created_at;
  const readMinutes = estimateReadMinutes(post.content);
  const tocItems = extractTocItems(post.content);
  const headingId = createHeadingIdFactory();
  const imageUrl = buildCanonicalUrl(`${buildPostPath(post)}/opengraph-image`);
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: buildDescription(post.content),
    image: imageUrl,
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
  const faqItems = extractFaqItems(post.content);
  const faqJsonLd = faqItems.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }
    : null;
  const structuredData = [articleJsonLd, breadcrumbJsonLd, faqJsonLd].filter(Boolean);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-24 pt-8">
      <nav className="mb-8 flex items-center gap-2 text-sm text-slate-500" aria-label="이동 경로">
        <Link href="/" className="hover:text-blue-600">
          홈
        </Link>
        <span>&gt;</span>
        <Link href="/blog" className="hover:text-blue-600">
          정보마당
        </Link>
        <span>&gt;</span>
        <span className="line-clamp-1 text-slate-900">{post.title}</span>
      </nav>

      <article className="prose prose-slate prose-lg max-w-none prose-img:rounded-xl prose-img:border prose-img:border-slate-200 prose-img:shadow-sm prose-a:break-words prose-table:text-sm">
        <header className="not-prose mb-10">
          <div className="mb-4 flex flex-wrap gap-2">
            {post.tags?.map((tag) => (
              <Badge key={tag} tone="primary">
                #{tag}
              </Badge>
            ))}
          </div>
          <h1 className="mb-6 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
            {post.title}
          </h1>
          <div className="flex items-center justify-between border-b border-slate-100 pb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                보조
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">보조24 편집팀</div>
                <div className="text-xs text-slate-500">
                  {new Date(publishedAt).toLocaleDateString("ko-KR")} · {readMinutes}분 읽기
                </div>
              </div>
            </div>
          </div>
        </header>

        {tocItems.length >= 3 && (
          <nav
            aria-label="글 목차"
            className="not-prose mb-10 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-base font-bold text-slate-900">목차</h2>
            <ol className="mt-4 space-y-2 text-sm leading-6">
              {tocItems.map((item) => (
                <li key={`${item.level}-${item.id}`} className={item.level === 3 ? "pl-4" : ""}>
                  <a className="text-slate-600 hover:text-blue-700" href={`#${item.id}`}>
                    {item.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        <div className="leading-8 text-slate-700">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h2: ({ node: _node, children, ...props }) => (
                <h2
                  id={headingId(getHeadingText(children))}
                  className="mt-12 scroll-mt-24 border-b-2 border-slate-100 pb-3 text-2xl font-bold text-slate-900"
                  {...props}
                >
                  {children}
                </h2>
              ),
              h3: ({ node: _node, children, ...props }) => (
                <h3
                  id={headingId(getHeadingText(children))}
                  className="mb-4 mt-8 scroll-mt-24 text-xl font-bold text-slate-800"
                  {...props}
                >
                  {children}
                </h3>
              ),
              p: ({ node: _node, ...props }) => <p className="mb-6 whitespace-pre-line" {...props} />,
              img: ({ node: _node, alt, ...props }) => (
                // Markdown 이미지에 alt가 비어 있으면 제목 기반 대체 텍스트를 보강한다.
                <img alt={alt || post.title} loading="lazy" decoding="async" {...props} />
              ),
              blockquote: ({ node: _node, children }) => (
                <div className="my-8 rounded-r-lg border-l-4 border-blue-500 bg-blue-50 p-5 text-slate-700 shadow-sm">
                  {children}
                </div>
              ),
              ul: ({ node: _node, ...props }) => <ul className="my-6 space-y-3 pl-0" {...props} />,
              li: ({ node: _node, children }) => (
                <li className="flex items-start gap-3">
                  <span className="mt-3 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                  <span>{children}</span>
                </li>
              ),
              table: ({ node: _node, ...props }) => (
                <div className="my-8 overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                  <table className="w-full text-left text-sm" {...props} />
                </div>
              ),
              th: ({ node: _node, ...props }) => (
                <th className="border-b border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700" {...props} />
              ),
              td: ({ node: _node, ...props }) => <td className="border-b border-slate-100 px-4 py-3 last:border-0" {...props} />,
              a: ({ node: _node, ...props }) => (
                <a
                  className="font-medium text-blue-700 underline decoration-blue-200 underline-offset-4 transition-colors hover:text-blue-900 hover:decoration-blue-500"
                  target={props.href?.startsWith("http") ? "_blank" : undefined}
                  rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                  {...props}
                />
              ),
              hr: ({ node: _node, ...props }) => <hr className="my-10 border-slate-100" {...props} />,
              strong: ({ node: _node, ...props }) => <strong className="rounded bg-yellow-100/50 px-1 font-bold text-slate-900" {...props} />,
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>
      </article>

      {post.benefit_id && (
        <section className="mt-10 rounded-lg bg-gradient-to-r from-blue-100 to-indigo-100 p-1">
          <Card className="flex flex-col items-center justify-between gap-6 border-0 p-6 shadow-sm sm:flex-row">
            <div className="flex-1">
              <div className="mb-3 inline-block rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
                공식 데이터 확인
              </div>
              <h2 className="mb-2 text-xl font-bold text-slate-900">내 조건에 맞는지 다시 확인하세요</h2>
              <p className="text-slate-600">
                신청 대상, 구비 서류, 접수 기간을 보조금24 공식 데이터로 다시 비교할 수 있습니다.
              </p>
            </div>
            <Link href={relatedBenefitHref} className="w-full sm:w-auto">
              <Button size="lg" className="w-full shadow-lg shadow-blue-200 sm:w-auto">
                상세 조건 보기
              </Button>
            </Link>
          </Card>
        </section>
      )}

      <div className="mt-16 border-t pt-10 text-center">
        <Link href="/blog">
          <Button variant="ghost" size="lg">
            목록으로 돌아가기
          </Button>
        </Link>
      </div>

      {structuredData.map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
    </main>
  );
}
