# Web Quang Phúc Team

Internal mobile-first web app for a CapCut editing team (~20 → 100 users): skill library + learning path, daily TikTok trend radar (CapCut edits + sounds), watermark-free TikTok downloader, member management. Vietnamese UI.

## Source of truth — read before changing anything

- `docs/01-scope.md` — what is in/out of MVP, roles & permission matrix
- `docs/02-design-system.md` — 🔒 colors, fonts, spacing, components (no gradients, no glow, no card shadows)
- `docs/03-conventions.md` — 🔒 stack, folder structure, naming, Result<T> shape, error codes, DB rules
- `docs/04-architecture.md` — architecture, DB schema, screen map
- `docs/05-roadmap.md` — sprint plan; work on the current sprint only

## Next.js 16

@AGENTS.md
Key differences: `middleware.ts` is now `src/proxy.ts` (export `proxy`); `params`, `searchParams`, `cookies()`, `headers()` are async only.

## Commands

`pnpm dev` · `pnpm typecheck` · `pnpm lint` · `pnpm db:generate` · `pnpm db:migrate` · `pnpm seed`

## Hard rules

- Change a locked doc first, then code. Never add a library, role, color or component variant not listed in the docs.
- Only design tokens; no hex values in components (Tailwind default palette is disabled).
- Shared Zod schemas (from Drizzle via drizzle-zod) for both client and server; server always re-checks auth + permission.
- TypeScript strict, no `any`. Code/comments in English, user-facing text in Vietnamese.
- `features/*` must not import from each other.
- Talk to the project owner in Vietnamese; ask when anything is unclear before building.
