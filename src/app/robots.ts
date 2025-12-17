import { MetadataRoute } from "next";
import { publicEnv } from "@lib/env";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = publicEnv.NEXT_PUBLIC_SITE_URL || "https://bojo24.kr";

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/api/", "/private/"], // API 경로는 수집 제외
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
