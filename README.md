# openclaw-briefing

OpenClaw morning briefing dashboard — standalone Next.js app.

Deployed to: https://openclaw-briefing.pages.dev

## Stack
- Next.js 14 (App Router)
- Cloudflare Pages (via GitHub Actions on push to `main`)
- Public HTML dashboard at `/public/index.html`
- API routes: `/api/revise`, `/api/trigger-now`

## Branches
- `main` — production (auto-deploys to CF Pages)
- `dev` — working branch (default)

## Development
```bash
npm install
npm run dev
```

## Environment Variables
Set in Cloudflare Pages dashboard:
- `LINEAR_API_KEY`
- `ANTHROPIC_API_KEY`
- `OPENCLAW_GATEWAY_URL`
- `OPENCLAW_GATEWAY_TOKEN`

## PIN Protection
The dashboard is PIN-gated (4-digit). Auth stored in sessionStorage for 24h.

---

*Migrated from RShuken/openclawinstall (PR #47 closed — wrong repo).*
