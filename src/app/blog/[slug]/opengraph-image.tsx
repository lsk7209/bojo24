import { ImageResponse } from "next/og";
import { parsePostRouteSlug } from "@lib/postRouting";
import { getAnonClient } from "@lib/supabaseClient";

export const runtime = "edge";
export const alt = "보조24 글 썸네일";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

type ImageParams = {
  params: Promise<{ slug: string }>;
};

type PostForImage = {
  title: string;
  tags: string[] | null;
  published_at: string | null;
  created_at: string;
};

const fetchPost = async (routeSlug: string) => {
  const supabase = getAnonClient();
  const now = new Date().toISOString();
  const parsed = parsePostRouteSlug(routeSlug);
  const query = supabase
    .from("posts")
    .select("title, tags, published_at, created_at")
    .eq("is_published", true)
    .or(`published_at.is.null,published_at.lte.${now}`);

  const { data } = parsed.id
    ? await query.eq("id", parsed.id).maybeSingle()
    : await query.eq("slug", parsed.slug).order("created_at", { ascending: true }).limit(1).maybeSingle();

  return data as PostForImage | null;
};

const splitTitle = (title: string) => {
  if (title.length <= 28) return [title];
  const words = title.split(" ");
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > 24 && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);

  return lines.slice(0, 3);
};

export default async function Image({ params }: ImageParams) {
  const { slug } = await params;
  const post = await fetchPost(slug);
  const title = post?.title ?? "보조금 신청 전 확인할 기준";
  const tags = post?.tags?.filter(Boolean).slice(0, 2) ?? ["보조금24", "정부지원금"];
  const date = new Date(post?.published_at || post?.created_at || Date.now()).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f8fafc",
          color: "#0f172a",
          padding: "74px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "12px" }}>
            {tags.map((tag) => (
              <div
                key={tag}
                style={{
                  borderRadius: "999px",
                  background: "#dbeafe",
                  color: "#1d4ed8",
                  padding: "10px 20px",
                  fontSize: 28,
                  fontWeight: 800,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
          <div style={{ color: "#64748b", fontSize: 28, fontWeight: 700 }}>{date}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {splitTitle(title).map((line) => (
            <div key={line} style={{ fontSize: 70, fontWeight: 900, lineHeight: 1.08, letterSpacing: 0 }}>
              {line}
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "4px solid #dbeafe",
            paddingTop: "28px",
          }}
        >
          <div style={{ fontSize: 36, fontWeight: 900, color: "#1d4ed8" }}>보조24</div>
          <div style={{ fontSize: 26, color: "#475569", fontWeight: 700 }}>정부지원금 신청 기준 정리</div>
        </div>
      </div>
    ),
    size
  );
}
