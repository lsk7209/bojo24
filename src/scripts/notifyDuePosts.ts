/* eslint-disable no-console */
import dotenv from "dotenv";
import { buildCanonicalUrl, resolveSiteUrl } from "@lib/site";
import { buildPostPath } from "@lib/postRouting";
import { notifySearchEngines } from "@lib/search-indexing";

dotenv.config({ path: ".env.local" });
dotenv.config();

const HOURS_TO_LOOK_BACK = Number(process.env.NOTIFY_DUE_POSTS_LOOKBACK_HOURS || 6);
const SITE_URL = resolveSiteUrl();

async function pingRss() {
  const rssUrl = `${SITE_URL}/rss.xml`;
  const endpoints = [
    `https://blogsearch.google.com/ping/RPC2`,
    `https://rpc.pingomatic.com/`,
  ];
  const xmlBody = (url: string) =>
    `<?xml version="1.0"?><methodCall><methodName>weblogUpdates.extendedPing</methodName><params><param><value>보조24</value></param><param><value>${SITE_URL}</value></param><param><value>${SITE_URL}</value></param><param><value>${url}</value></param></params></methodCall>`;

  await Promise.allSettled(
    endpoints.map((ep) =>
      fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "text/xml" },
        body: xmlBody(rssUrl),
        signal: AbortSignal.timeout(8000),
      })
    )
  );
  console.log(`  RSS ping → ${rssUrl}`);
}

async function main() {
  const hasTurso = process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN;
  const hasSupabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!hasTurso && !hasSupabase) {
    throw new Error("TURSO_DATABASE_URL/TURSO_AUTH_TOKEN 또는 SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY 환경 변수가 필요합니다.");
  }

  const { getServiceClient } = await import("@lib/supabaseClient");
  const supabase = getServiceClient();
  const now = new Date();
  const lookback = new Date(now.getTime() - HOURS_TO_LOOK_BACK * 60 * 60 * 1000);

  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, slug, title, published_at")
    .eq("is_published", true)
    .gte("published_at", lookback.toISOString())
    .lte("published_at", now.toISOString())
    .order("published_at", { ascending: true });

  if (error) throw error;

  const urls = (posts ?? []).map((post) => buildCanonicalUrl(buildPostPath(post)));

  if (urls.length === 0) {
    console.log("알림 대상 예약 글이 없습니다.");
    // 글이 없어도 사이트맵+RSS는 알림
    await pingRss();
    return;
  }

  console.log(`  알림 대상: ${urls.length}개 URL`);

  const [result] = await Promise.all([
    notifySearchEngines(urls),
    pingRss(),
  ]);

  console.log(
    JSON.stringify({
      notifiedUrls: urls.length,
      submitted: result.submitted,
      gsc: result.gsc,
      skippedReason: result.skippedReason,
    }, null, 2)
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
