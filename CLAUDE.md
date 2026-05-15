# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # start dev server (localhost:3000)
pnpm build        # production build
pnpm lint         # eslint
```

**Always pass `--ignore-scripts` when installing packages** — pnpm 11 blocks build scripts by default. The `package.json` `pnpm.onlyBuiltDependencies` allowlist (`sharp`, `unrs-resolver`, `msw`) handles the exceptions, but new packages still need the flag:

```bash
pnpm add <pkg> --ignore-scripts
```

## Architecture

Next.js 16 App Router + React 19. `app/` holds only server components (`layout.tsx`, `page.tsx`). Everything interactive lives in `components/` and is client-only (`"use client"`).

**Tailwind v4** uses a CSS-first config — there is no `tailwind.config.ts`. All theme tokens live in `app/globals.css` inside `@theme inline { }`. Color values are oklch. Adding new design tokens goes there, not in a config file.

**Dark mode** is class-based (`.dark` on `<html>`). Do not use `next-themes` — it's installed but unused because it injects a `<script>` inside a client component, which React 19 warns about. Instead:
- FOUC prevention: a blocking `<script>` in `app/layout.tsx` `<head>` (server component, React never touches it)
- Runtime: `components/theme-provider.tsx` — custom context that reads/writes `localStorage` key `"cards-theme"` and toggles `.dark` directly on `document.documentElement`
- Always import `useTheme` from `@/components/theme-provider`, never from `next-themes`
- Check `resolvedTheme` (not `theme`) when branching on light/dark — `theme` can be `"system"`

**Card morph animation** — Framer Motion `layoutId={`card-${id}`}` ties the grid card to the expanded detail view. Both the `motion.div` wrapper in `card-grid.tsx` and the `motion.div` in the overlay share the same `layoutId`. When a card is selected, the grid card fades to `opacity: 0` (not unmounted) so Framer can measure both positions. Do not use shadcn `Dialog` for the detail view — it would break the shared-layout animation.

**Masonry layout** is pure CSS columns (`columns-1 sm:columns-2 xl:columns-3`) — no JS library. Cards use `break-inside-avoid`.

**Spring constants** are centralised in `lib/motion.ts` (`spring`, `springSnappy`, `springGentle`). Use these rather than inline transition objects.

**Fonts**: Geist Sans (`--font-geist-sans`) for body, Instrument Serif (`--font-instrument-serif`) for display headings. Apply display font via `style={{ fontFamily: "var(--font-instrument-serif), Georgia, serif" }}` or the `.font-display` utility class — Tailwind v4 does not support `font-display` as a utility out of the box without the CSS class defined in `globals.css`.

## Data shape

`lib/types.ts` defines `ContactCard`. `DashboardView` owns all mutable state (cards array + notes record); child components receive data and callbacks as props. Mutations call the REST API (`/api/cards/[id]`) which in turn hits Supabase; notes changes are debounced 600 ms.

## Supabase / Auth

Schema lives in `supabase/migrations/0001_init.sql` — run via the Supabase dashboard SQL editor or `supabase db push`.

**Client factories** in `lib/supabase/`:
- `server.ts` — cookie-based server client (`@supabase/ssr`); use in Server Components and Route Handlers
- `client.ts` — browser client; use in `"use client"` components
- `middleware.ts` — `updateSession()` called by `middleware.ts` at the root to refresh tokens on every request

**Auth flow**: `app/login/page.tsx` renders `components/login-form.tsx` (email+password + Google OAuth). OAuth callback is handled by `app/auth/callback/route.ts`. Sign-out is in `components/site-header.tsx`.

**RLS**: The `cards` table has row-level security enabled. All four policies (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) gate on `auth.uid() = user_id`. The Supabase server client in route handlers inherits the user's session from cookies — RLS is enforced automatically.

**Row mapping**: `lib/supabase/cards.ts` exports `rowToCard()` which translates snake_case DB columns to camelCase `ContactCard`. Use it wherever DB rows are converted for the UI.
