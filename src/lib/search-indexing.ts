import { resolveSiteUrl } from "@lib/site";
import crypto from "crypto";

const SITE_URL = resolveSiteUrl();

const INDEXNOW_ENDPOINTS = [
  "https://www.bing.com/indexnow",
  "https://searchadvisor.naver.com/indexnow",
  "https://yandex.com/indexnow",
] as const;

type NotifySearchEnginesResult = {
  submitted: string[];
  gsc?: { ok: boolean; reason?: string };
  skippedReason?: string;
};

const getIndexNowKey = () => process.env.INDEXNOW_KEY?.trim();

// ── IndexNow (Bing / Naver / Yandex) ──────────────────────────────────────
export async function notifyIndexNow(urls: string[]): Promise<string[]> {
  const key = getIndexNowKey();
  const normalizedUrls = urls.filter(Boolean);
  if (!key || normalizedUrls.length === 0) return [];

  const host = new URL(SITE_URL).hostname;
  const body = { host, key, urlList: normalizedUrls };

  const settled = await Promise.allSettled(
    INDEXNOW_ENDPOINTS.map((endpoint) =>
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(body),
      })
    )
  );

  return INDEXNOW_ENDPOINTS.filter((_, i) => {
    const r = settled[i];
    return r.status === "fulfilled" && (r.value.ok || r.value.status === 202);
  });
}

// ── Google Search Console — service account JWT auth ──────────────────────
async function buildServiceAccountJwt(keyJson: string): Promise<string | null> {
  try {
    const key = JSON.parse(keyJson) as {
      client_email: string;
      private_key: string;
    };
    const now = Math.floor(Date.now() / 1000);
    const toB64url = (obj: unknown) =>
      Buffer.from(JSON.stringify(obj)).toString("base64url");
    const header = toB64url({ alg: "RS256", typ: "JWT" });
    const claims = toB64url({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/webmasters",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    });
    const sign = crypto.createSign("RSA-SHA256");
    sign.update(`${header}.${claims}`);
    const sig = sign.sign(key.private_key, "base64url");
    return `${header}.${claims}.${sig}`;
  } catch {
    return null;
  }
}

async function getGoogleAccessToken(keyJson: string): Promise<string | null> {
  const jwt = await buildServiceAccountJwt(keyJson);
  if (!jwt) return null;
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    });
    const data = (await res.json()) as { access_token?: string };
    return data.access_token ?? null;
  } catch {
    return null;
  }
}

export async function submitSitemapToGSC(sitemapUrl: string): Promise<{ ok: boolean; reason?: string }> {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) return { ok: false, reason: "GOOGLE_SERVICE_ACCOUNT_KEY not set" };

  const accessToken = await getGoogleAccessToken(keyJson);
  if (!accessToken) return { ok: false, reason: "failed to get access token" };

  const encodedSite = encodeURIComponent(SITE_URL.replace(/\/$/, ""));
  const encodedSitemap = encodeURIComponent(sitemapUrl);
  try {
    const res = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodedSitemap}`,
      { method: "PUT", headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return res.ok
      ? { ok: true }
      : { ok: false, reason: `GSC API ${res.status}` };
  } catch (e) {
    return { ok: false, reason: String(e) };
  }
}

// ── Combined helper ────────────────────────────────────────────────────────
export async function notifySearchEngines(
  urls: string[]
): Promise<NotifySearchEnginesResult> {
  const key = getIndexNowKey();
  const normalizedUrls = urls.filter(Boolean);

  if (!key || normalizedUrls.length === 0) {
    return { submitted: [], skippedReason: "INDEXNOW_KEY 또는 제출 URL이 없습니다." };
  }

  const [submitted, gsc] = await Promise.all([
    notifyIndexNow(normalizedUrls),
    submitSitemapToGSC(`${SITE_URL}/sitemap.xml`),
  ]);

  return { submitted, gsc };
}
