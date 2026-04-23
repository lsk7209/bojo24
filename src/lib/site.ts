export const SITE_NAME = "보조24";
export const SITE_DESCRIPTION =
  "행정안전부 보조24 공공데이터를 분석하여 쉽고 정확한 정보를 제공하는 플랫폼";
export const SITE_TAGLINE = "정부 지원금 정보를 이해하기 쉽게 정리합니다";
export const DEFAULT_SITE_URL = "https://www.bojo24.kr";
export const DEFAULT_GA_MEASUREMENT_ID = "G-ZQJVKK37Y2";
export const CONTACT_EMAIL = "contact@bojo24.kr";

export const resolveSiteUrl = (
  siteUrl = process.env.NEXT_PUBLIC_SITE_URL
): string => siteUrl?.replace(/\/$/, "") || DEFAULT_SITE_URL;

export const resolveGaMeasurementId = (
  measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
): string => measurementId || DEFAULT_GA_MEASUREMENT_ID;

export const buildCanonicalUrl = (path = "/"): string => {
  const normalizedPath =
    path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;

  return `${resolveSiteUrl()}${normalizedPath}`;
};
