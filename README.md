# Drinks

Next.js app for browsing cocktail cards and recipes.

## Getting started

1. Install deps: `npm i`
2. Create `.env`:
   - `DATABASE_URL="file:./dev.db"`
   - `NEXTAUTH_SECRET="..."` (run `openssl rand -base64 32`)
   - `GOOGLE_CLIENT_ID="..."`
   - `GOOGLE_CLIENT_SECRET="..."`
   - Optional: `GITHUB_CLIENT_ID="..."` / `GITHUB_CLIENT_SECRET="..."`
3. Setup DB + seed: `npm run db:setup`
4. Run: `npm run dev`

## Database

- Quick start (recommended): `npm run db:setup`
- SQLite file is created at `prisma/dev.db` (SQLite paths are relative to `prisma/schema.prisma`).
