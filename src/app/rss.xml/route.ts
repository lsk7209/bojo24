import { getAnonClient } from "@lib/supabaseClient";

const BASE_URL = "https://bojo24.kr";

export async function GET() {
    const supabase = getAnonClient();

    // 최신 포스트 20개 조회
    const { data: posts } = await supabase
        .from("posts")
        .select("id, title, slug, excerpt, created_at")
        .order("created_at", { ascending: false })
        .limit(20);

    // XML 헤더
    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>보조금24 - 정부 혜택 정보</title>
    <link>${BASE_URL}</link>
    <description>행정안전부 보조금24 정보를 AI로 요약하고 쉽게 찾을 수 있는 플랫폼입니다.</description>
    <language>ko-KR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />`;

    // 포스트 아이템 생성
    const xmlItems = posts?.map((post) => {
        return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${BASE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${BASE_URL}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt || ""}]]></description>
      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
    </item>`;
    }).join("") || "";

    // XML 푸터
    const xmlFooter = `
  </channel>
</rss>`;

    return new Response(xmlHeader + xmlItems + xmlFooter, {
        headers: {
            "Content-Type": "text/xml; charset=utf-8",
            "Cache-Control": "s-maxage=3600, stale-while-revalidate", // 1시간 캐시
        },
    });
}
