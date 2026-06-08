/* eslint-disable no-console */
import crypto from "crypto";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { normalizeSiteUrl } from "@lib/site";

dotenv.config({ path: ".env.local" });
dotenv.config();

const DEFAULT_KEY_PATHS = [
  "D:\\env\\gsc_credentials.json",
  "D:\\env\\cursorai-451704-85a5abbe8eeb.json",
];

type ServiceAccountKey = {
  client_email: string;
  private_key: string;
};

type GscSiteEntry = {
  siteUrl: string;
  permissionLevel: string;
};

type GscSitemapEntry = {
  path?: string;
  isPending?: boolean;
  isSitemapsIndex?: boolean;
  lastSubmitted?: string;
  lastDownloaded?: string;
  warnings?: string;
  errors?: string;
};

const args = process.argv.slice(2);

const argValue = (name: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const siteUrl = normalizeSiteUrl(
  argValue("--site-url") ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://bojo24.kr"
);

const keyPath = argValue("--key") || process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE || DEFAULT_KEY_PATHS.find(fs.existsSync);

const sitemapUrls = [
  `${siteUrl}/sitemap.xml`,
  `${siteUrl}/benefit/sitemap.xml`,
  `${siteUrl}/startup/sitemap.xml`,
  `${siteUrl}/blog/sitemap.xml`,
];

const toB64url = (obj: unknown) => Buffer.from(JSON.stringify(obj)).toString("base64url");

const buildJwt = (key: ServiceAccountKey) => {
  const now = Math.floor(Date.now() / 1000);
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
};

const getAccessToken = async (key: ServiceAccountKey) => {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: buildJwt(key),
    }),
  });
  const data = (await response.json()) as { access_token?: string; error?: string };
  if (!response.ok || !data.access_token) {
    throw new Error(`Google OAuth token failed: ${response.status} ${data.error || ""}`.trim());
  }
  return data.access_token;
};

const gscFetch = async <T>(accessToken: string, url: string, init: RequestInit = {}) => {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) as T : ({} as T);
  if (!response.ok) {
    throw new Error(`GSC API ${response.status}: ${text.slice(0, 240)}`);
  }
  return data;
};

const chooseProperty = (sites: GscSiteEntry[]) => {
  const host = new URL(siteUrl).hostname.replace(/^www\./, "");
  const preferred = [
    siteUrl,
    `${siteUrl}/`,
    `sc-domain:${host}`,
    `https://${host}`,
    `https://${host}/`,
  ];

  return preferred
    .map((candidate) => sites.find((site) => site.siteUrl === candidate))
    .find(Boolean) || sites.find((site) => site.siteUrl.includes(host));
};

async function main() {
  if (!keyPath) {
    throw new Error("No GSC service-account key found. Set GOOGLE_SERVICE_ACCOUNT_KEY_FILE or place gsc_credentials.json in D:\\env.");
  }

  const resolvedKeyPath = path.resolve(keyPath);
  const key = JSON.parse(fs.readFileSync(resolvedKeyPath, "utf8")) as ServiceAccountKey;
  process.env.GOOGLE_SERVICE_ACCOUNT_KEY = JSON.stringify(key);

  const accessToken = await getAccessToken(key);
  const siteList = await gscFetch<{ siteEntry?: GscSiteEntry[] }>(
    accessToken,
    "https://searchconsole.googleapis.com/webmasters/v3/sites"
  );
  const property = chooseProperty(siteList.siteEntry || []);

  if (!property) {
    throw new Error(`No matching GSC property found for ${siteUrl}. Add the service account as an owner/user in Search Console.`);
  }

  const encodedSite = encodeURIComponent(property.siteUrl);

  console.log(`Stack: Next.js/Vercel`);
  console.log(`GSC property: ${property.siteUrl}`);
  console.log(`Permission: ${property.permissionLevel}`);
  console.log(`Credential: ${path.basename(resolvedKeyPath)}`);

  for (const sitemapUrl of sitemapUrls) {
    const encodedSitemap = encodeURIComponent(sitemapUrl);
    await gscFetch(
      accessToken,
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodedSitemap}`,
      { method: "PUT" }
    );
    const status = await gscFetch<GscSitemapEntry>(
      accessToken,
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSite}/sitemaps/${encodedSitemap}`
    );
    console.log(JSON.stringify({
      sitemap: sitemapUrl,
      submitted: true,
      status: status.isPending ? "pending" : "success_or_processing",
      lastSubmitted: status.lastSubmitted || null,
      lastDownloaded: status.lastDownloaded || null,
      warnings: Number(status.warnings || 0),
      errors: Number(status.errors || 0),
    }));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
