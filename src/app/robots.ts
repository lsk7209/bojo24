import { MetadataRoute } from "next";
import { publicEnv } from "@lib/env";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = publicEnv.NEXT_PUBLIC_SITE_URL || "https://www.bojo24.kr";

    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/api/", "/private/", "/admin/"],
            },
            {
                userAgent: [
                    "Googlebot",
                    "Bingbot",
                    "Yeti",
                    "Daumoa",
                    "GPTBot",
                    "ClaudeBot",
                    "anthropic-ai",
                    "PerplexityBot",
                    "OAI-SearchBot",
                    "Google-Extended",
                ],
                allow: "/",
                disallow: ["/api/", "/private/", "/admin/"],
            },
            {
                userAgent: "Bytespider",
                disallow: "/",
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
