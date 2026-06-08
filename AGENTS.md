# Project Deployment Policy

- Do not deploy this project directly with Vercel CLI or Vercel API.
- Forbidden commands include `vercel deploy`, `vercel --prod`, deployment promotion, rollback promotion, or any direct Vercel production/preview deployment command.
- Deployment for this repository must go through GitHub only: prepare changes locally, verify, then commit/push or open a PR when requested so the existing GitHub/Vercel integration deploys it.
- Live checks may inspect `https://bojo24.kr` after a GitHub-triggered deployment, but must not create a deployment directly.
