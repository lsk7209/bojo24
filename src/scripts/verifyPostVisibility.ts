/* eslint-disable no-console */
import "./loadScriptEnv";
import { createClient } from "@supabase/supabase-js";
import { validateEnv } from "@lib/env";

type PostProbe = {
  slug: string;
  title: string;
  published_at: string | null;
  is_published: boolean;
};

const pickFutureSlug = async () => {
  const service = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await service
    .from("posts")
    .select("slug, title, published_at, is_published")
    .eq("is_published", true)
    .gt("published_at", new Date().toISOString())
    .order("published_at", { ascending: true })
    .limit(1)
    .maybeSingle<PostProbe>();

  if (error) throw error;
  return data;
};

async function main() {
  validateEnv(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY"]);

  const futurePost = await pickFutureSlug();
  if (!futurePost) {
    console.log(JSON.stringify({ status: "skip", reason: "future scheduled post not found" }, null, 2));
    return;
  }

  const anon = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  const service = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const [anonResult, serviceResult] = await Promise.all([
    anon
      .from("posts")
      .select("slug, title, published_at, is_published")
      .eq("slug", futurePost.slug)
      .maybeSingle<PostProbe>(),
    service
      .from("posts")
      .select("slug, title, published_at, is_published")
      .eq("slug", futurePost.slug)
      .maybeSingle<PostProbe>(),
  ]);

  console.log(
    JSON.stringify(
      {
        checkedSlug: futurePost.slug,
        futurePublishedAt: futurePost.published_at,
        anonCanRead: Boolean(anonResult.data),
        serviceCanRead: Boolean(serviceResult.data),
        anonError: anonResult.error?.message ?? null,
        serviceError: serviceResult.error?.message ?? null,
      },
      null,
      2
    )
  );

  if (anonResult.data || !serviceResult.data) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
