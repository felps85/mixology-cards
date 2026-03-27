# Mixology Cards

Dark, editorial cocktail cards built with Next.js, Prisma, and a Figma-driven design workflow.

## What this repo includes

- A dynamic Next.js app for browsing cocktail cards and opening full recipe details
- Seeded cocktail data and local SQLite setup through Prisma
- Local image assets plus lightweight gallery thumbnails
- Basic UI regression tests for filters, cards, and the fullscreen recipe panel
- A static `docs/` showcase designed for GitHub Pages

## Main app features

- Search drinks by name
- Filter by non-alcohol ingredients, alcohol ingredients, tags, and max ABV
- Fullscreen recipe modal with curiosity facts, ingredients, and method
- Dark speakeasy-inspired gallery styling with drink-specific accent colors

## Stack

- `Next.js 14`
- `React 18`
- `Prisma + SQLite`
- `Tailwind CSS`
- `Vitest + Testing Library`

## Local development

1. Install dependencies

   ```bash
   npm install
   ```

2. Create local env values

   ```bash
   cp .env.example .env.local
   ```

3. Generate the database and seed drinks

   ```bash
   npm run db:setup
   ```

4. Start the app

   ```bash
   npm run dev
   ```

5. Open the local preview

   ```text
   http://127.0.0.1:3000
   ```

## Environment variables

- `DATABASE_URL` — local SQLite database path
- `NEXTAUTH_SECRET` — session secret for auth
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` — optional GitHub auth provider
- `REQUIRE_AUTH` — optional toggle to protect the app behind auth

## Useful scripts

- `npm run dev` — run local dev server
- `npm run dev:clean` — clear Next build output and restart dev
- `npm run lint` — run Next lint
- `npm run test` — run unit tests
- `npm run check` — lint + tests + build verification
- `npm run db:setup` — push Prisma schema and reseed data

## Project structure

- `src/app` — Next.js app routes and layout
- `src/components` — gallery cards, filters, modal, and shared UI
- `src/lib` — Prisma client, auth config, and URL helpers
- `prisma` — schema, seed script, and drink seed data
- `public/drinks` — original drink images and generated thumbnails
- `docs` — static GitHub Pages showcase

## GitHub Pages

This repo includes a static showcase in `docs/` because the full app depends on Prisma and server-side data, which GitHub Pages cannot run directly.

The Pages site:

- reads drink data from this repository
- uses the same visual direction as the main app
- gives you a lightweight public demo without requiring a backend

If GitHub Pages is enabled for the repository with GitHub Actions, the included workflow will deploy the `docs/` site automatically on pushes to `main`.

## Notes

- Local-only files like `.env.local`, `.next-dev`, and `prisma/dev.db` are ignored
- The GitHub Pages site is a static showcase, not a replacement for the full Next.js app
