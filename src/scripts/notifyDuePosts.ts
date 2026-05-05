/* eslint-disable no-console */
import "dotenv/config";
import { getServiceClient } from "@lib/supabaseClient";
import { buildCanonicalUrl } from "@lib/site";
import { notifySearchEngines } from "@lib/search-indexing";
import { validateEnv } from "@lib/env";

const HOURS_TO_LOOK_BACK = Number(process.env.NOTIFY_DUE_POSTS_LOOKBACK_HOURS || 6);

async function main() {
  validateEnv(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

  const supabase = getServiceClient();
  const now = new Date();
  const lookback = new Date(now.getTime() - HOURS_TO_LOOK_BACK * 60 * 60 * 1000);

  const { data: posts, error } = await supabase
    .from("posts")
    .select("slug, title, published_at")
    .eq("is_published", true)
    .gte("published_at", lookback.toISOString())
    .lte("published_at", now.toISOString())
    .order("published_at", { ascending: true });

  if (error) throw error;

  const urls = (posts ?? []).map((post) => buildCanonicalUrl(`/blog/${post.slug}`));

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
