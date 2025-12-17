import { getAnonClient } from "@lib/supabaseClient";
import { publicEnv } from "@lib/env";

const BASE_URL = publicEnv.NEXT_PUBLIC_SITE_URL || "https://bojo24.kr";

export async function GET() {
    const supabase = getAnonClient();

    // 최신 포스트 20개 조회
    const { data: posts } = await supabase
        .from("posts")
        .select("id, title, slug, excerpt, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(20);

    // 최신 보조금 10개 조회 (RSS에 포함)
    const { data: recentBenefits } = await supabase
        .from("benefits")
        .select("id, name, category, last_updated_at")
        .order("last_updated_at", { ascending: false })
        .limit(10);

    // XML 헤더
    const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>보조24 - 정부 혜택 정보</title>
    <link>${BASE_URL}</link>
    <description>행정안전부 보조금24 정보를 AI로 요약하고 쉽게 찾을 수 있는 플랫폼입니다. 최신 보조금 정보와 신청 가이드를 제공합니다.</description>
    <language>ko-KR</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <pubDate>${new Date().toUTCString()}</pubDate>
    <generator>Next.js RSS Generator</generator>
    <webMaster>contact@bojo24.kr (보조24)</webMaster>
    <managingEditor>contact@bojo24.kr (보조24)</managingEditor>
    <atom:link href="${BASE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${BASE_URL}/favicon.ico</url>
      <title>보조24</title>
      <link>${BASE_URL}</link>
    </image>`;

    // 블로그 포스트 아이템 생성
    const postItems = posts?.map((post) => {
        const pubDate = post.updated_at || post.created_at;
        return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${BASE_URL}/blog/${post.slug}</link>
      <guid isPermaLink="true">${BASE_URL}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt || ""}]]></description>
      <pubDate>${new Date(pubDate).toUTCString()}</pubDate>
      <category>블로그</category>
    </item>`;
    }).join("") || "";

    // 보조금 아이템 생성
    const benefitItems = recentBenefits?.map((benefit) => {
        const category = benefit.category || "기타";
        const description = `${benefit.name} - ${category} 분야의 정부 지원금 정보를 확인하세요.`;
        return `
    <item>
      <title><![CDATA[${benefit.name} - ${category} 보조금]]></title>
      <link>${BASE_URL}/benefit/${category}/${benefit.id}</link>
      <guid isPermaLink="true">${BASE_URL}/benefit/${category}/${benefit.id}</guid>
      <description><![CDATA[${description}]]></description>
      <pubDate>${new Date(benefit.last_updated_at || new Date()).toUTCString()}</pubDate>
      <category>${category}</category>
    </item>`;
    }).join("") || "";

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
