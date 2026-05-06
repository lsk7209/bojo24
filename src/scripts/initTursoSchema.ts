/* eslint-disable no-console */
import "./loadScriptEnv";
import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL;
const authToken = process.env.TURSO_AUTH_TOKEN || process.env.LIBSQL_AUTH_TOKEN;

if (!url || !authToken) {
  throw new Error("TURSO_DATABASE_URL/TURSO_AUTH_TOKEN 환경 변수가 필요합니다.");
}

const db = createClient({ url, authToken });

const statements = [
  `CREATE TABLE IF NOT EXISTS benefits (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    governing_org TEXT,
    detail_json TEXT NOT NULL,
    last_updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    gemini_summary TEXT,
    gemini_faq_json TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_benefits_category ON benefits(category)`,
  `CREATE INDEX IF NOT EXISTS idx_benefits_governing_org ON benefits(governing_org)`,
  `CREATE INDEX IF NOT EXISTS idx_benefits_last_updated ON benefits(last_updated_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_benefits_name ON benefits(name)`,
  `CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    benefit_id TEXT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    tags TEXT DEFAULT '[]',
    seo_keywords TEXT DEFAULT '[]',
    meta_description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    published_at TEXT,
    is_published INTEGER DEFAULT 1,
    view_count INTEGER DEFAULT 0,
    UNIQUE(benefit_id, slug)
  )`,
  `CREATE INDEX IF NOT EXISTS idx_posts_slug ON posts(slug)`,
  `CREATE INDEX IF NOT EXISTS idx_posts_benefit_id ON posts(benefit_id)`,
  `CREATE INDEX IF NOT EXISTS idx_posts_published ON posts(is_published, published_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS content_duplicates (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    content_hash TEXT UNIQUE NOT NULL,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_content_duplicates_hash ON content_duplicates(content_hash)`,
  `CREATE TABLE IF NOT EXISTS seo_metadata (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    page_type TEXT NOT NULL,
    page_id TEXT NOT NULL,
    canonical_url TEXT NOT NULL,
    og_title TEXT,
    og_description TEXT,
    og_image TEXT,
    structured_data TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(page_type, page_id)
  )`,
  `CREATE TABLE IF NOT EXISTS admin_settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS page_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    path TEXT NOT NULL,
    ip_hash TEXT,
    user_agent TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path)`,
  `CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS benefit_content (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    benefit_id TEXT NOT NULL,
    content_type TEXT NOT NULL,
    title TEXT,
    summary TEXT,
    content TEXT,
    metadata TEXT DEFAULT '{}',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(benefit_id, content_type)
  )`,
  `CREATE TABLE IF NOT EXISTS content_sections (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    benefit_content_id TEXT NOT NULL,
    section_type TEXT NOT NULL,
    title TEXT,
    content TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(benefit_content_id, section_type)
  )`,
];

async function main() {
  for (const sql of statements) {
    await db.execute(sql);
  }

  console.log(`Turso schema ready: ${statements.length} statements`);
}

main().catch((error) => {
  console.error("Turso schema init failed", error);
  process.exit(1);
});
