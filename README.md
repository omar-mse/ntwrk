# ntwrk

AI-powered business card index. Snap a card, let Gemini extract the contact details, then organize, search, and annotate your network from one masonry-style dashboard.

## Features

- **AI card scan** — upload or capture a business card; Gemini 2.5 Flash extracts name, title, company, email, phone, website, and tags.
- **Smart categories** — the model reuses your existing tags when possible and assigns deterministic accent colors to new ones.
- **Search + notes** — global fuzzy search across every field; per-card notes auto-save (debounced).
- **Animated detail view** — Framer Motion shared-layout morph from grid card to full detail.
- **Auth** — Google OAuth or email/password (Auth.js v5, JWT sessions).
- **Dark mode** — class-based, with FOUC-prevention script.

## Stack

- Next.js 16 (App Router) + React 19
- TypeScript
- Tailwind CSS v4 (CSS-first config, no `tailwind.config.ts`)
- Framer Motion
- Prisma + SQLite (swap to SQL Server by changing one line)
- Auth.js v5 (`next-auth@beta`) + Prisma adapter
- Google Generative AI (`gemini-2.5-flash`)

## Getting started

### 1. Install dependencies

pnpm 11 blocks build scripts by default — always pass `--ignore-scripts`:

```bash
pnpm install --ignore-scripts
pnpm exec prisma generate
```

### 2. Configure environment

Create `.env.local`:

```
DATABASE_URL="file:./dev.db"
AUTH_SECRET="<openssl rand -base64 33>"
AUTH_GOOGLE_ID="<google oauth client id>"
AUTH_GOOGLE_SECRET="<google oauth client secret>"
GEMINI_API_KEY="<gemini api key>"
```

In the [Google Cloud Console](https://console.cloud.google.com/apis/credentials), set the authorized redirect URI to `http://localhost:3000/api/auth/callback/google` (plus the production equivalent).

### 3. Run migrations

```bash
pnpm exec prisma migrate dev
```

### 4. Start the dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Start dev server on `localhost:3000` |
| `pnpm build` | Production build |
| `pnpm start` | Run the production build |
| `pnpm lint` | ESLint |
| `pnpm exec prisma migrate dev --name <name>` | Create + apply a migration |
| `pnpm exec prisma studio` | Browse the local SQLite DB |

## Project structure

```
app/
  (main)/         # authed dashboard
  api/            # route handlers (analyze-card, cards, categories, auth)
  layout.tsx      # server component, providers, FOUC script
components/       # all client components ("use client")
lib/
  db/             # Prisma access (cards, categories) — filters every query by userId
  motion.ts       # shared Framer spring presets
  prisma.ts       # singleton client
  types.ts        # ContactCard, CustomCategory
prisma/
  schema.prisma   # User, Account, Session, Card, UserCategory
auth.ts           # full Auth.js config
auth.config.ts    # edge-safe partial
proxy.ts          # Next 16 edge middleware (renamed from middleware.ts)
```

## How card ingestion works

1. **`POST /api/analyze-card`** — multipart upload; Gemini OCRs and returns a `ContactCard`-shaped JSON. Nothing is saved yet.
2. The user reviews the preview, tweaks tags, then confirms.
3. **`POST /api/cards`** — persists the card and upserts any new tags into `UserCategory`.

The AI is given the user's existing category names before each call so it reuses them rather than inventing duplicates.

## Switching to SQL Server

All dialect-specific config lives in `schema.prisma` and `DATABASE_URL`:

1. `provider = "sqlite"` → `"sqlserver"` in `prisma/schema.prisma`
2. Update `DATABASE_URL` to the SQL Server connection string
3. `pnpm exec prisma migrate dev`

`tags String` maps to `NVARCHAR(MAX)`; `@default(uuid())` is app-generated. No code changes needed.

## License

MIT
