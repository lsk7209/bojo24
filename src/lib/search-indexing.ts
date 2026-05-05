import { resolveSiteUrl } from "@lib/site";

const INDEXNOW_ENDPOINTS = [
  "https://www.bing.com/indexnow",
  "https://searchadvisor.naver.com/indexnow",
] as const;

type NotifySearchEnginesResult = {
  submitted: string[];
  skippedReason?: string;
};

const getIndexNowKey = () => process.env.INDEXNOW_KEY?.trim();

export async function notifySearchEngines(
  urls: string[]
): Promise<NotifySearchEnginesResult> {
  const key = getIndexNowKey();
  const normalizedUrls = urls.filter(Boolean);

  if (!key || normalizedUrls.length === 0) {
    return {
      submitted: [],
      skippedReason: "INDEXNOW_KEY 또는 제출 URL이 없습니다.",
    };
  }

  const host = new URL(resolveSiteUrl()).hostname;
  const body = {
    host,
    key,
    urlList: normalizedUrls,
  };

  const settled = await Promise.allSettled(
    INDEXNOW_ENDPOINTS.map((endpoint) =>
      fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify(body),
      })
    )
  );

  return {
    submitted: INDEXNOW_ENDPOINTS.filter((_, index) => {
      const result = settled[index];
      return result.status === "fulfilled" && result.value.ok;
    }),
  };
}
