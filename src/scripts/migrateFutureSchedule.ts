/* eslint-disable no-console */
import "./loadScriptEnv";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getServiceClient } from "@lib/supabaseClient";
import { validateEnv } from "@lib/env";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const KST_SLOTS = [9, 18] as const;

type FuturePost = {
  id: string;
  slug: string;
  published_at: string;
};

type PlanItem = FuturePost & {
  planned_at: string;
};

type Snapshot = {
  version: 1;
  cutoff: string;
  createdAt: string;
  posts: FuturePost[];
  plan: PlanItem[];
};

type Options = {
  apply: boolean;
  rollback: boolean;
  cutoff: Date;
  snapshotPath?: string;
  confirmSha?: string;
};

const usage = () => {
  console.error(
    "Usage: tsx src/scripts/migrateFutureSchedule.ts [--dry-run] [--now <ISO>] [--snapshot <path>] [--apply|--rollback --confirm-sha <sha256>]"
  );
};

const requiredArg = (args: string[], name: string) => {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value`);
  return value;
};

const parseOptions = (): Options => {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const rollback = args.includes("--rollback");
  if (apply && rollback) throw new Error("Choose either --apply or --rollback, not both");

  const cutoffValue = requiredArg(args, "--now") ?? new Date().toISOString();
  const cutoff = new Date(cutoffValue);
  if (Number.isNaN(cutoff.getTime())) throw new Error("--now must be a valid ISO timestamp");

  const options = {
    apply,
    rollback,
    cutoff,
    snapshotPath: requiredArg(args, "--snapshot"),
    confirmSha: requiredArg(args, "--confirm-sha"),
  };
  if ((apply || rollback) && (!options.snapshotPath || !options.confirmSha)) {
    throw new Error("--apply/--rollback require both --snapshot and --confirm-sha");
  }
  return options;
};

const toKstParts = (value: Date) => {
  const shifted = new Date(value.getTime() + KST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
};

const slotAt = (anchor: ReturnType<typeof toKstParts>, index: number) => {
  const dayOffset = Math.floor(index / KST_SLOTS.length);
  const hour = KST_SLOTS[index % KST_SLOTS.length];
  return new Date(Date.UTC(anchor.year, anchor.month - 1, anchor.day + dayOffset, hour - 9, 0, 0));
};

const koreaDay = (value: string) => {
  const { year, month, day } = toKstParts(new Date(value));
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const readFuturePosts = async (cutoff: Date): Promise<FuturePost[]> => {
  const db = getServiceClient();
  const { data, error } = await db
    .from("posts")
    .select("id, slug, published_at")
    .eq("is_published", true)
    .gt("published_at", cutoff.toISOString())
    .order("published_at", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as FuturePost[]).filter(
    (post) => post.id && post.slug && post.published_at && new Date(post.published_at).getTime() > cutoff.getTime()
  );
};

const buildPlan = (posts: FuturePost[], cutoff: Date): PlanItem[] => {
  if (posts.length === 0) return [];
  const anchor = toKstParts(new Date(posts[0].published_at));
  let firstSlot = 0;
  while (slotAt(anchor, firstSlot).getTime() <= cutoff.getTime()) firstSlot += 1;

  return posts.map((post, index) => ({
    ...post,
    planned_at: slotAt(anchor, firstSlot + index).toISOString(),
  }));
};

const sha256 = (value: Buffer | string) => createHash("sha256").update(value).digest("hex");

const parseSnapshot = (raw: Buffer): Snapshot => {
  const snapshot = JSON.parse(raw.toString("utf8")) as Snapshot;
  if (snapshot.version !== 1 || !Array.isArray(snapshot.posts) || !Array.isArray(snapshot.plan)) {
    throw new Error("Snapshot schema is invalid");
  }
  return snapshot;
};

const assertSnapshotMatchesCurrent = (snapshot: Snapshot, posts: FuturePost[]) => {
  const snapshotMap = new Map(snapshot.posts.map((post) => [post.id, post.published_at]));
  if (snapshotMap.size !== posts.length) throw new Error("Snapshot post count differs from current future schedule");
  for (const post of posts) {
    if (snapshotMap.get(post.id) !== post.published_at) {
      throw new Error(`Snapshot is stale for ${post.slug}; create a new snapshot and dry run`);
    }
  }
};

const countByKoreaDay = (items: Array<{ planned_at: string }>) =>
  items.reduce<Record<string, number>>((result, item) => {
    const day = koreaDay(item.planned_at);
    result[day] = (result[day] ?? 0) + 1;
    return result;
  }, {});

const printSummary = (posts: FuturePost[], plan: PlanItem[], cutoff: Date, mode: string) => {
  const days = countByKoreaDay(plan);
  const counts = Object.values(days);
  console.log(
    JSON.stringify(
      {
        mode,
        cutoff: cutoff.toISOString(),
        futurePosts: posts.length,
        changedPosts: plan.filter((item) => item.published_at !== item.planned_at).length,
        firstOriginal: posts[0]?.published_at ?? null,
        lastOriginal: posts.at(-1)?.published_at ?? null,
        firstPlanned: plan[0]?.planned_at ?? null,
        lastPlanned: plan.at(-1)?.planned_at ?? null,
        koreaDays: counts.length,
        maxPostsPerKoreaDay: counts.length ? Math.max(...counts) : 0,
        samples: plan.slice(0, 5).map(({ slug, published_at, planned_at }) => ({ slug, published_at, planned_at })),
      },
      null,
      2
    )
  );
};

const writeSnapshot = async (path: string, cutoff: Date, posts: FuturePost[], plan: PlanItem[]) => {
  const snapshot: Snapshot = { version: 1, cutoff: cutoff.toISOString(), createdAt: new Date().toISOString(), posts, plan };
  const encoded = `${JSON.stringify(snapshot, null, 2)}\n`;
  const target = resolve(path);
  await mkdir(resolve(target, ".."), { recursive: true });
  await writeFile(target, encoded, { encoding: "utf8", flag: "wx" });
  console.log(JSON.stringify({ snapshot: target, sha256: sha256(encoded), created: true }));
};

const applyPlan = async (plan: PlanItem[]) => {
  const db = getServiceClient();
  for (const item of plan) {
    if (item.published_at === item.planned_at) continue;
    const { error } = await db
      .from("posts")
      .update({ published_at: item.planned_at })
      .eq("id", item.id)
      .eq("published_at", item.published_at);
    if (error) throw error;
  }
};

const rollbackPlan = async (snapshot: Snapshot) => {
  const db = getServiceClient();
  for (const item of snapshot.posts) {
    const { error } = await db.from("posts").update({ published_at: item.published_at }).eq("id", item.id);
    if (error) throw error;
  }
};

async function main() {
  validateEnv(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);
  const options = parseOptions();
  const posts = await readFuturePosts(options.cutoff);
  const plan = buildPlan(posts, options.cutoff);

  if (!options.apply && !options.rollback) {
    printSummary(posts, plan, options.cutoff, "dry_run");
    if (options.snapshotPath) await writeSnapshot(options.snapshotPath, options.cutoff, posts, plan);
    return;
  }

  const rawSnapshot = await readFile(resolve(options.snapshotPath!), null);
  if (sha256(rawSnapshot) !== options.confirmSha) throw new Error("Snapshot SHA-256 does not match --confirm-sha");
  const snapshot = parseSnapshot(rawSnapshot);

  if (options.rollback) {
    await rollbackPlan(snapshot);
    console.log(JSON.stringify({ mode: "rollback", restoredPosts: snapshot.posts.length }, null, 2));
    return;
  }

  if (snapshot.cutoff !== options.cutoff.toISOString()) throw new Error("Snapshot cutoff differs from --now");
  assertSnapshotMatchesCurrent(snapshot, posts);
  const snapshotPlan = snapshot.plan as PlanItem[];
  if (snapshotPlan.length !== posts.length || Math.max(0, ...Object.values(countByKoreaDay(snapshotPlan))) > 2) {
    throw new Error("Snapshot plan is invalid or exceeds two Korea-day releases");
  }
  await applyPlan(snapshotPlan);
  printSummary(posts, snapshotPlan, options.cutoff, "apply");
}

main().catch((error) => {
  usage();
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
