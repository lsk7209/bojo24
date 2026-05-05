/* eslint-disable no-console */
import dotenv from "dotenv";
import { buildCanonicalUrl } from "@lib/site";
import { buildPostPath } from "@lib/postRouting";
import { notifySearchEngines } from "@lib/search-indexing";

dotenv.config({ path: ".env.local" });
dotenv.config();

const HOURS_TO_LOOK_BACK = Number(process.env.NOTIFY_DUE_POSTS_LOOKBACK_HOURS || 6);

async function main() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY 환경 변수가 없습니다.");
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
    return;
  }

  const result = await notifySearchEngines(urls);
  console.log(
    JSON.stringify({
      notifiedUrls: urls.length,
      submitted: result.submitted,
      skippedReason: result.skippedReason,
    })
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
