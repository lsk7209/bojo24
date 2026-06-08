import { publicEnv } from "@lib/env";
import { buildPostPath } from "@lib/postRouting";
import { getAnonClient } from "@lib/supabaseClient";

const BASE_URL = publicEnv.NEXT_PUBLIC_SITE_URL || "https://bojo24.kr";
const RSS_TITLE = "\ubcf4\uc87024 - \uc815\ubd80 \uc9c0\uc6d0\uae08\u00b7\ubcf5\uc9c0 \ud61c\ud0dd \uc815\ubcf4";
const RSS_DESCRIPTION =
    "\uc815\ubd80 \uc9c0\uc6d0\uae08, \ubcf5\uc9c0 \ud61c\ud0dd, \ubcf4\uc870\uae08 \uc790\uaca9 \uc870\uac74\uacfc \uc2e0\uccad \ubc29\ubc95\uc744 \uacf5\uc2dd \ucd9c\ucc98 \uae30\ubc18\uc73c\ub85c \uc815\ub9ac\ud55c \ubcf4\uc87024 RSS \ud53c\ub4dc\uc785\ub2c8\ub2e4.";
const BLOG_CATEGORY = "\ube14\ub85c\uadf8";
const DEFAULT_CATEGORY = "\uae30\ud0c0";
const BENEFIT_SUFFIX = "\ubcf4\uc870\uae08";

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

    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${toCdata(RSS_TITLE)}</title>
    <link>${BASE_URL}</link>
    <description>${toCdata(RSS_DESCRIPTION)}</description>
    <language>ko-KR</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <pubDate>${buildDate}</pubDate>
    <generator>Next.js RSS Generator</generator>
    <webMaster>contact@bojo24.kr (bojo24)</webMaster>
    <managingEditor>contact@bojo24.kr (bojo24)</managingEditor>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${BASE_URL}/favicon.svg</url>
      <title>${toCdata("bojo24")}</title>
      <link>${BASE_URL}</link>
    </image>`;

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
      <category>${toCdata(BLOG_CATEGORY)}</category>
    </item>`;
    }).join("");

    const benefitItems = recentBenefits.map((benefit) => {
        const category = benefit.category || DEFAULT_CATEGORY;
        const description = `${benefit.name} - ${category} \ubd84\uc57c\uc758 \uc815\ubd80 \uc9c0\uc6d0\uae08 \uc815\ubcf4\uc640 \uc2e0\uccad \uc870\uac74\uc744 \ud655\uc778\ud558\uc138\uc694.`;
        const benefitUrl = `${BASE_URL}/benefit/${encodeURIComponent(category)}/${benefit.id}`;

        return `
    <item>
      <title>${toCdata(`${benefit.name} - ${category} ${BENEFIT_SUFFIX}`)}</title>
      <link>${benefitUrl}</link>
      <guid isPermaLink="true">${benefitUrl}</guid>
      <description>${toCdata(description)}</description>
      <pubDate>${toRssDate(benefit.last_updated_at)}</pubDate>
      <category>${toCdata(category)}</category>
    </item>`;
    }).join("");

    const xmlFooter = `
  </channel>
</rss>`;

    return new Response(xmlHeader + postItems + benefitItems + xmlFooter, {
        headers: {
            "Content-Type": "text/xml; charset=utf-8",
            "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
        },
    });
}
