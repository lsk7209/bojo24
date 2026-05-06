export const SITE_NAME = "보조24";
export const SITE_DESCRIPTION =
  "공공데이터 기반으로 정부지원금, 복지 혜택, 창업 지원 정보를 쉽고 정확하게 정리하는 정보 서비스";
export const SITE_TAGLINE = "정부지원금 정보를 이해하기 쉽게 정리합니다";
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
