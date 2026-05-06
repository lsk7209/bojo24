import { getAnonClient } from "@lib/supabaseClient";
import { publicEnv } from "@lib/env";
import { buildPostPath } from "@lib/postRouting";

const BASE_URL = publicEnv.NEXT_PUBLIC_SITE_URL || "https://www.bojo24.kr";

type RssPost = {
    id: string;
    title: string;
    slug: string;
    excerpt: string | null;
    created_at: string | null;
    published_at: string | null;
};

type RssBenefit = {
    id: string;
    name: string;
    category: string | null;
    last_updated_at: string | null;
};

const toCdata = (value: string) => `<![CDATA[${value.replaceAll("]]>", "]]]]><![CDATA[>")}]]>`;

const toRssDate = (value?: string | null) => {
    const date = value ? new Date(value) : new Date();
    return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
};

const fetchRssRows = async () => {
    try {
        const db = getAnonClient();
        const now = new Date().toISOString();

        const [{ data: posts }, { data: recentBenefits }] = await Promise.all([
            db
                .from("posts")
                .select("id, title, slug, excerpt, created_at, published_at")
                .eq("is_published", true)
                .or(`published_at.is.null,published_at.lte.${now}`)
                .order("published_at", { ascending: false, nullsFirst: false })
                .limit(20),
            db
                .from("benefits")
                .select("id, name, category, last_updated_at")
                .order("last_updated_at", { ascending: false })
                .limit(10),
        ]);

        return {
            posts: (posts ?? []) as RssPost[],
            recentBenefits: (recentBenefits ?? []) as RssBenefit[],
        };
    } catch {
        return { posts: [], recentBenefits: [] };
    }
};

export async function GET() {
    const { posts, recentBenefits } = await fetchRssRows();
    const buildDate = new Date().toUTCString();

    // XML 헤더
    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>보조24 - 정부 혜택 정보</title>
    <link>${BASE_URL}</link>
    <description>행정안전부 보조24 공공데이터를 분석하여 쉽고 정확한 정보를 제공하는 플랫폼입니다. 최신 보조금 정보와 신청 가이드를 제공합니다.</description>
    <language>ko-KR</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <pubDate>${buildDate}</pubDate>
    <generator>Next.js RSS Generator</generator>
    <webMaster>contact@bojo24.kr (보조24)</webMaster>
    <managingEditor>contact@bojo24.kr (보조24)</managingEditor>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${BASE_URL}/favicon.svg</url>
      <title>보조24</title>
      <link>${BASE_URL}</link>
    </image>`;

    // 블로그 포스트 아이템 생성
    const postItems = posts.map((post) => {
        const pubDate = post.published_at || post.created_at;
        const postUrl = `${BASE_URL}${buildPostPath(post)}`;
        return `
    <item>
      <title>${toCdata(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description>${toCdata(post.excerpt || "")}</description>
      <pubDate>${toRssDate(pubDate)}</pubDate>
      <category>블로그</category>
    </item>`;
    }).join("");

    // 보조금 아이템 생성
    const benefitItems = recentBenefits.map((benefit) => {
        const category = benefit.category || "기타";
        const description = `${benefit.name} - ${category} 분야의 정부 지원금 정보를 확인하세요.`;
        const benefitUrl = `${BASE_URL}/benefit/${encodeURIComponent(category)}/${benefit.id}`;
        return `
    <item>
      <title>${toCdata(`${benefit.name} - ${category} 보조금`)}</title>
      <link>${benefitUrl}</link>
      <guid isPermaLink="true">${benefitUrl}</guid>
      <description>${toCdata(description)}</description>
      <pubDate>${toRssDate(benefit.last_updated_at)}</pubDate>
      <category>${toCdata(category)}</category>
    </item>`;
    }).join("");

    // XML 푸터
    const xmlFooter = `
  </channel>
</rss>`;

    return new Response(xmlHeader + postItems + benefitItems + xmlFooter, {
        headers: {
            "Content-Type": "text/xml; charset=utf-8",
            "Cache-Control": "s-maxage=3600, stale-while-revalidate", // 1시간 캐시
        },
    });
}
