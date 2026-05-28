# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # start dev server (localhost:3000)
pnpm build        # production build
pnpm lint         # eslint
pnpm exec prisma migrate dev --name <name>   # create + apply a new migration
pnpm exec prisma generate                     # regenerate Prisma client after schema changes
pnpm exec prisma studio                       # browse the local SQLite DB
```

## Environment variables

Create a `.env.local` with:

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="<openssl rand -base64 33>"
AUTH_GOOGLE_ID="<google oauth client id>"
AUTH_GOOGLE_SECRET="<google oauth client secret>"
GEMINI_API_KEY="<gemini api key>"
```

**Google Cloud Console:** set the authorized redirect URI to `http://localhost:3000/api/auth/callback/google` (and your production equivalent).

**Always pass `--ignore-scripts` when installing packages** — pnpm 11 blocks build scripts by default. The `package.json` `pnpm.onlyBuiltDependencies` allowlist (`@prisma/client`, `prisma`, `sharp`, `unrs-resolver`, `msw`) handles the exceptions, but new packages still need the flag:

```bash
pnpm add <pkg> --ignore-scripts
```

After installing or updating Prisma, run `pnpm exec prisma generate` manually (postinstall is suppressed by `--ignore-scripts`).

## Architecture

Next.js 16 App Router + React 19. `app/` holds only server components (`layout.tsx`, `(main)/page.tsx`). Everything interactive lives in `components/` and is client-only (`"use client"`).

**Tailwind v4** uses a CSS-first config — there is no `tailwind.config.ts`. All theme tokens live in `app/globals.css` inside `@theme inline { }`. Color values are oklch. Adding new design tokens goes there, not in a config file.

**Dark mode** is class-based (`.dark` on `<html>`). Do not use `next-themes` — it's installed but unused because it injects a `<script>` inside a client component, which React 19 warns about. Instead:
- FOUC prevention: a blocking `<script>` in `app/layout.tsx` `<head>` (server component, React never touches it)
- Runtime: `components/theme-provider.tsx` — custom context that reads/writes `localStorage` key `"cards-theme"` and toggles `.dark` directly on `document.documentElement`
- Always import `useTheme` from `@/components/theme-provider`, never from `next-themes`
- Check `resolvedTheme` (not `theme`) when branching on light/dark — `theme` can be `"system"`

**Card morph animation** — Framer Motion `layoutId={`card-${id}`}` ties the grid card to the expanded detail view. Both the `motion.div` wrapper in `card-grid.tsx` and the `motion.div` in the overlay share the same `layoutId`. When a card is selected, the grid card fades to `opacity: 0` (not unmounted) so Framer can measure both positions. Do not use shadcn `Dialog` for the detail view — it would break the shared-layout animation.

**Masonry layout** is pure CSS columns (`columns-1 sm:columns-2 xl:columns-3`) — no JS library. Cards use `break-inside-avoid`.

**Spring constants** are centralised in `lib/motion.ts` (`spring`, `springSnappy`, `springGentle`). Use these rather than inline transition objects.

**Fonts**: Geist Sans (`--font-geist-sans`) for body, Fraunces (`--font-fraunces`) for display headings (`.font-display`, weight 500), Playfair Display (`--font-playfair`) for secondary display text (`.font-playfair`). Both utility classes are defined in `globals.css`. Do not add font variables to the `@theme inline {}` block — it creates a circular self-reference; variables are injected by Next.js directly onto `<html>`.

## Data shape & state

`lib/types.ts` defines `ContactCard` (fields: `id`, `name`, `title`, `company`, `email`, `phone`, `website`, `tags: CustomCategory[]`, `aiDescription`, `userNotes`, `capturedAt`). `DashboardView` owns all mutable state (cards array + notes record); child components receive data and callbacks as props. Mutations call the REST API which in turn hits Prisma; notes changes are debounced 600 ms.

**Search** state lives in `SearchProvider` (context in `components/search-provider.tsx`). Import `useSearch` from there to read/set the global query. Filtering happens inside `DashboardView` via `useMemo` — no server round-trip.

## AI card scan flow

Card ingestion is two steps:

1. **`POST /api/analyze-card`** — accepts a `multipart/form-data` file, runs Gemini 2.5 Flash OCR, and returns a `ContactCard`-shaped JSON. Nothing is written to the DB yet.
2. **`POST /api/cards`** — saves the confirmed card to Prisma and upserts any new tags into `UserCategory`.

The AI is instructed to reuse the user's existing category names when possible (fetched from `UserCategory` before the Gemini call). Category accent colours are assigned deterministically via a hash palette in `analyze-card/route.ts`.

## API routes

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/analyze-card` | OCR + AI analysis (no DB write) |
| `POST` | `/api/cards` | Save card, upsert categories |
| `PATCH` | `/api/cards/[id]` | Update `userNotes` or `tags` |
| `DELETE` | `/api/cards/[id]` | Delete card |
| `GET` | `/api/categories` | List user's categories |
| `POST` | `/api/categories` | Upsert a category |
| `DELETE` | `/api/categories/[name]` | Remove a user category |
| `POST` | `/api/auth/register` | Create account (email + password) |

## Auth (Auth.js v5 / NextAuth)

**Stack:** Auth.js v5 (`next-auth@beta`) with Prisma adapter, JWT session strategy.

**Why JWT:** The Credentials provider is incompatible with database sessions — `session: { strategy: "jwt" }` is required. Google OAuth also works under JWT.

**Split config:**
- `auth.config.ts` — edge-safe partial (providers list, pages, `authorized` callback). Used by the edge middleware; no Prisma/bcrypt imports.
- `auth.ts` — full config with `PrismaAdapter`, `Credentials` provider (bcrypt password check), and JWT/session callbacks. Used in server components and API routes.
- `proxy.ts` — Next.js 16's renamed `middleware.ts`. Wires `auth.config.ts` into the edge runtime via `NextAuth(authConfig).auth` and gates every non-static route through the `authorized` callback.

**Session access:**
- Server components / Route Handlers: `const session = await auth()` from `@/auth`; `session.user.id` has the userId (typed via `types/next-auth.d.ts`).
- Client components: `useSession()` from `next-auth/react`; sign-in/out via `signIn`/`signOut`.

**Sign-up flow:** Credentials provider does NOT create users. POST `/api/auth/register` (bcrypt hash + `prisma.user.create`), then auto-`signIn("credentials", ...)`. No email confirmation — sign-up logs in immediately.

**Google OAuth** callback is handled automatically at `/api/auth/callback/google` by Auth.js. No custom callback route needed.

## Database (Prisma + SQLite)

Schema: `prisma/schema.prisma` — models: `User`, `Account`, `Session`, `VerificationToken` (Auth.js adapter), `Card`, `UserCategory`.

**`tags` is stored as `String` (JSON-encoded `CustomCategory[]`)** — SQLite has no JSON column type. The DB layer (`lib/db/cards.ts`) handles `JSON.parse`/`stringify`; app code always sees `CustomCategory[]`.

**No RLS** — SQLite/SQL Server have no row-level security. Every query in `lib/db/` explicitly filters by `userId`. Update/delete use `updateMany`/`deleteMany({ where: { id, userId } })` and return 404 if count is 0 (ownership check).

**Client singleton:** `lib/prisma.ts` — standard dev hot-reload guard (`globalThis.prisma`).

**DB layer:**
- `lib/db/cards.ts` — `listCards`, `createCard`, `updateCard`, `deleteCard`, `rowToCard` (maps Prisma `Card` → `ContactCard`).
- `lib/db/categories.ts` — `listCategories`, `upsertCategory`, `upsertCategoriesIgnoreDuplicates`, `deleteCategory`.

## Switching to SQL Server later

All dialect-specific config is in `schema.prisma` and `DATABASE_URL`. To switch:
1. Change `provider = "sqlite"` → `"sqlserver"` in `schema.prisma`.
2. Set `DATABASE_URL` to the SQL Server connection string.
3. Re-run `prisma migrate dev` (fresh schema; no data migration needed).

`tags String` maps to `NVARCHAR(MAX)` on SQL Server — no code changes needed. `@default(uuid())` is app-generated (provider-agnostic).
