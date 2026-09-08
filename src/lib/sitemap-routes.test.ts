import assert from "node:assert/strict";
import { getStaticSitemapRoutes } from "./sitemapRoutes";

const routes = getStaticSitemapRoutes();
const byPath = new Map(routes.map((route) => [new URL(route.url.toString()).pathname, route]));

for (const path of ["/", "/benefit", "/startup", "/blog", "/disclaimer"]) {
    assert.equal(byPath.get(path)?.lastModified, undefined, `${path} must not claim a generated modification date`);
}

for (const path of ["/about", "/contact", "/editorial-policy", "/privacy", "/terms"]) {
    assert.equal(byPath.get(path)?.lastModified, "2026-05-05", `${path} must retain its recorded modification date`);
}
