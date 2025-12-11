import type { BenefitRecord } from "@/types/benefit";

export const buildFaqJsonLd = (benefit: BenefitRecord | null) => {
  const faqs = (benefit?.gemini_faq_json as { q: string; a: string }[] | null) || [];
  if (!faqs.length) return null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a
      }
    }))
  };
  return JSON.stringify(jsonLd);
};

