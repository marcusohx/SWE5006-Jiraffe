# AGENTS.md

## Project Summary
- Next.js App Router app (Next 16.1.6, React 19.2.3)
- Layered modules: controller -> service -> repository -> model, with DTO validation via Zod
- MongoDB with Mongoose
- Auth via NextAuth

## Key Paths
- API routes: `src/app/api/*`
- App routes/layouts: `src/app/*`
- Domain modules: `src/modules/*`
- Mongo connection: `src/lib/db/mongodb.ts`
- Auth config: `src/modules/auth/auth.options.ts`
- Middleware: `src/middleware.ts`
- Tests: `tests/`

## How to Work in This Repo
- Prefer `rg` for search.
- Keep the layering: API route -> controller -> service -> repository -> model.
- Validate/parse inputs using the module DTO helpers (Zod).
- Avoid editing `package-lock.json` unless dependency changes are required.
- Target Node.js 24.13.0 (see `package.json` engines).

## Common Commands
- `npm run dev`
- `npm run build`
- `npm run lint`
- `npm run test`
- `docker compose up --build`

## Environment
Create `.env` from `.env.example` and set:
- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GITHUB_ID`
- `GITHUB_SECRET`
- `DNS_SERVERS` (optional)