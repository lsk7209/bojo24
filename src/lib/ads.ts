const PLACEHOLDER_AD_SLOT = "1234567890";

export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-3050601904412736";

export function normalizeAdSlot(slot?: string | null): string | null {
  const value = slot?.trim();

  if (!value || value === PLACEHOLDER_AD_SLOT) {
    return null;
  }

  return /^\d{8,}$/.test(value) ? value : null;
}

export const AD_SLOTS = {
  homeBanner: normalizeAdSlot(process.env.NEXT_PUBLIC_ADSENSE_HOME_BANNER_SLOT),
  benefitListInline: normalizeAdSlot(
    process.env.NEXT_PUBLIC_ADSENSE_BENEFIT_LIST_SLOT ||
      process.env.NEXT_PUBLIC_ADSENSE_INLINE_SLOT
  ),
  benefitDetailInline: normalizeAdSlot(
    process.env.NEXT_PUBLIC_ADSENSE_BENEFIT_DETAIL_SLOT ||
      process.env.NEXT_PUBLIC_ADSENSE_INLINE_SLOT
  ),
  blogInline: normalizeAdSlot(
    process.env.NEXT_PUBLIC_ADSENSE_BLOG_INLINE_SLOT ||
      process.env.NEXT_PUBLIC_ADSENSE_INLINE_SLOT
  ),
} as const;
