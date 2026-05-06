import crypto from "node:crypto";
import type { StartupItem, StartupSource } from "@/types/startup";

export const STARTUP_SOURCE_LABELS: Record<StartupSource, string> = {
  mss_biz: "중소벤처기업부 사업공고",
  kstartup_announcement: "K-Startup 사업공고",
  kstartup_business: "K-Startup 사업소개",
  kstartup_content: "K-Startup 콘텐츠",
  kstartup_statistics: "K-Startup 통계보고서",
};

const DATE_KEYS = [
  "updated_at",
  "published_at",
  "end_date",
  "start_date",
] as const;

export const buildStartupPath = (item: Pick<StartupItem, "id">) =>
  `/startup/${encodeURIComponent(item.id)}`;

export const sourceLabel = (source: string) =>
  STARTUP_SOURCE_LABELS[source as StartupSource] || source;

export const formatStartupDate = (value?: string | null) => {
  if (!value) return "-";
  const normalized = value.length === 8 ? `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}` : value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const latestStartupDate = (item: Partial<StartupItem>) => {
  for (const key of DATE_KEYS) {
    if (item[key]) return item[key] ?? null;
  }
  return null;
};

export const stableStartupId = (source: StartupSource, raw: Record<string, unknown>) => {
  const rawId = findFirstString(raw, [
    "id",
    "seq",
    "no",
    "pblancId",
    "pblanc_id",
    "announcementId",
    "bizPbancSn",
    "pbancSn",
    "contentId",
    "businessId",
    "rptNo",
    "공고번호",
    "사업공고번호",
    "번호",
  ]);
  const sourceId = rawId || crypto.createHash("sha1").update(JSON.stringify(raw)).digest("hex").slice(0, 20);
  return { id: `${source}:${sourceId}`, sourceId };
};

export const findFirstString = (raw: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
};
