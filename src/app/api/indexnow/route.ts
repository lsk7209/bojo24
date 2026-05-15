import { NextResponse } from "next/server";
import { publicEnv } from "@lib/env";

export const dynamic = "force-dynamic";

const BASE_URL = publicEnv.NEXT_PUBLIC_SITE_URL || "https://www.bojo24.kr";

// IndexNow 지원 엔진 (Google은 자체 크롤 일정으로 동작, IndexNow 미지원)
const INDEXNOW_ENDPOINTS = [
  "https://www.bing.com/indexnow",
  "https://searchadvisor.naver.com/indexnow",
  "https://yandex.com/indexnow",
];

type IndexNowPayload = {
  host: string;
  key: string;
  keyLocation: string;
  urlList: string[];
};

async function pingIndexNow(urls: string[], key: string): Promise<{ engine: string; status: number }[]> {
  const host = new URL(BASE_URL).hostname;
  const payload: IndexNowPayload = {
    host,
    key,
    keyLocation: `${BASE_URL}/${key}.txt`,
    urlList: urls.slice(0, 10000),
  };

  const results = await Promise.allSettled(
    INDEXNOW_ENDPOINTS.map(async (endpoint) => {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
      });
      return { engine: endpoint, status: res.status };
    })
  );

  return results.map((r, i) =>
    r.status === "fulfilled"
      ? r.value
      : { engine: INDEXNOW_ENDPOINTS[i], status: 0 }
  );
}

// POST /api/indexnow — 배포 훅 또는 콘텐츠 업데이트 시 호출
export async function POST(request: Request) {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) {
    return NextResponse.json({ error: "INDEXNOW_KEY not configured" }, { status: 503 });
  }

  const authHeader = request.headers.get("authorization");
  const expectedToken = process.env.INDEXNOW_PING_SECRET;
  if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let urls: string[] = [];
  try {
    const body = await request.json();
    urls = Array.isArray(body.urls) ? body.urls : [];
  } catch {
    // urls not provided — use default sitemap URLs
  }

  // 기본 URL: 주요 정적 페이지
  if (urls.length === 0) {
    urls = [
      BASE_URL,
      `${BASE_URL}/benefit`,
      `${BASE_URL}/startup`,
      `${BASE_URL}/blog`,
      `${BASE_URL}/about`,
    ];
  }

  const results = await pingIndexNow(urls, key);
  const allOk = results.every((r) => r.status === 200 || r.status === 202);

  return NextResponse.json({
    pinged: urls.length,
    results,
    ok: allOk,
  }, { status: allOk ? 200 : 207 });
}

// GET /api/indexnow?urls=url1,url2 — 디버그용
export async function GET(request: Request) {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) {
    return NextResponse.json({ error: "INDEXNOW_KEY not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const rawUrls = searchParams.get("urls");
  const urls = rawUrls ? rawUrls.split(",").map((u) => u.trim()).filter(Boolean) : [`${BASE_URL}/`];

  const results = await pingIndexNow(urls, key);
  return NextResponse.json({ pinged: urls.length, results });
}
