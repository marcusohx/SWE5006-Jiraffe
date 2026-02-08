# SWE5006 Jiraffe

Enterprise-style Next.js App Router project with layered architecture (controller/service/repository), MongoDB (Mongoose ODM), NextAuth, Docker, CI, and SonarQube.

## Requirements

- Node.js 24.13.0
- MongoDB (local or Docker)

## Environment

Copy `.env.example` to `.env` and fill values:

```
MONGODB_URI=mongodb://localhost:27017/swe5006
NEXTAUTH_SECRET=replace-with-strong-secret
NEXTAUTH_URL=http://localhost:3000
GITHUB_ID=
GITHUB_SECRET=
DNS_SERVERS=1.1.1.1,1.0.0.1,8.8.8.8
```

## Run locally

```
npm install
npm run dev
```

## Run with Docker

```
docker compose up --build
```

## Key paths

- API routes: `src/app/api/*`
- Modules: `src/modules/*`
- Mongo connection: `src/lib/db/mongodb.ts`
- Auth config: `src/modules/auth/auth.options.ts`
- Middleware protection: `src/middleware.ts`

## Optional DNS override

If your environment has DNS resolution issues (for example, Node.js using `127.0.0.53`), you can set:

```
DNS_SERVERS=1.1.1.1,1.0.0.1
```

This forces Node.js to use explicit DNS servers before connecting to MongoDB.
