import { NextResponse } from "next/server";
import { getAnonClient } from "@lib/supabaseClient";

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 60;

const toPositiveInt = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return fallback;
  return parsed;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const source = searchParams.get("source")?.trim();
  const offset = toPositiveInt(searchParams.get("offset"), 0);
  const limit = Math.min(toPositiveInt(searchParams.get("limit"), DEFAULT_LIMIT), MAX_LIMIT);

  try {
    const db = getAnonClient();
    const query = db
      .from("startup_items")
      .select("id, source, title, category, organization, status, start_date, end_date, updated_at")
      .order("updated_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (q) query.ilike("title", `%${q}%`);
    if (source && source !== "all") query.eq("source", source);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(
      { items: data ?? [], hasMore: (data?.length ?? 0) === limit },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
    );
  } catch {
    return NextResponse.json(
      { items: [], hasMore: false },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
