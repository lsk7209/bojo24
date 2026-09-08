# Bojo24 AdSense quality repair — 2026-09-07

## Static sitemap lastmod repair — 2026-09-08 KST

- User goal: continue improving only AdSense non-READY sites in current DAU order; Bojo24 is rank 13 at DAU 6 and `GETTING_READY`.
- Current source: isolated clone of canonical `lsk7209/bojo24` `main` at `2055e2974a01f39b12e9cdef7fa5a6836381fdb2`; exact prior Production deployment `6309046441` is successful. Dirty/untracked primary artifacts were preserved.
- Completed locally: `getStaticSitemapRoutes()` no longer assigns the generation date to home, benefit/startup/blog hubs, or disclaimer. Trust pages retain their recorded `2026-05-05` dates, and record-backed benefit/blog/startup route logic is unchanged. Added a pure route-level regression test.
- Fresh validation: new test failed before the patch and passes after it; existing seven application-parser/HowTo tests pass; typecheck, scoped ESLint, 21-page production build, and diff check pass.
- Side effects/rollback: isolated clone and dependencies only at this checkpoint; no production mutation. Revert the eventual focused commit to roll back.
- Deliberately not run: no DB read/write or sync, content generation/publication, AdSense/CMP/account action, GSC/IndexNow request, or direct Vercel mutation.
- Next step: independent diff review, exact three-file allowlist commit/push, Git-connected deployment, and public sitemap proof.

---

- Goal: improve actual user value for one of the locked top-ten unapproved sites; no approval probability or AdSense submission.
- Source: fetched and fast-forwarded c848abc to origin/main1aee79029840ddacf895f8ab7bf09fe627daca7c. GitHub Vercel status success verified. Preserved existing untracked feed/.goal-harness/.omx/.playwright-cli.
- Confirmed parser defect: old parseApplySteps turns full 고용24(www.work24.go.kr) instruction into go.kr fragment, destroys dates/phone numbers, drops short instructions and truncates beyond5steps. Four regression fixtures failed before repair.
- Changed src/lib/benefitContentOptimizer.ts: explicit line-only steps, conservative leading markers, no missing-data sentinel. Changed src/app/benefit/[category]/[id]/schema.ts: reuse identical parser/field selection, remove unsourced fixed30minute/zero-cost assertions. New src/lib/benefit-apply-steps.test.ts includes actual optimizer and HowTo tests.
- Terra review found stale independent schema parser and missing-data sentinel issue; both fixed. Seven tests pass; final typecheck passes. Lint passed after runtime changes. Initial build99552 passed22pages before schema correction; final build is running and must be polled before claiming final build success. External writing API disabled via process-only GEMINI settings during builds; no collector, DB writes or backfill ran.
- Build includes pre-existing untracked /feed; exclude it from exact release commit. No commit/push or live repair yet. Rollback local three task code/test files by reverse task diff; don't revert other work.
- Remaining: final build, source/public runtime verification including mobile, independently review final schema delta, exact allowlist release and three AdSense reports. Public five-page sample shows other generic advice/freshness uncertainties; do not invent a last-checked date. Source ingestion is scheduled .github/workflows/data-sync.yml; no new content generation planned, DB freshness not independently checked yet.
- Final build6724 exited0 with22pages after schema correction; includes pre-existing untracked /feed. No server process was started. Final runtime and Git-connected release remain unverified.
- Runtime checkpoint: full real policy youth_20260625005400113245 returns200; visible application and HowTo preserve 고용24(www.work24.go.kr) including source instruction. Found actual FAQ long-URL overflow994px at390px; added scoped overflow-wrap:anywhere in detail page. Rebuilt21130 exit0/22pages; fresh production server and computed-style-guarded browser check now pass390/390 and1280/1280. Screenshot reviewed. External ads/analytics blocked; not ad/CMP proof.
- Initial npm wrapper Ctrl-C left child17700 serving stale assets; identified by exact command/port and stopped. Discarded unstyled intermediate browser pass. Current direct-node server session96965 port3254 and browserbojo-verify remain task-owned until cleanup. No DB writes or external content API ran.
- Release allowlist: optimizer, schema, detail page, test, this handoff. Existing untracked feed/OMX/artifacts excluded. Next: exact allowlist Git commit/push, then exact-SHA hosting and live page verification. Fullsitepolicy not assessed; no review submission.
