# HRRMS — Busia County HR Record Management System

Full-stack HR system built on Next.js 15 (App Router) and Convex: employee
master records with a digitized 18-category document repository, leave,
performance, training, disciplinary, and retirement/exit workflows, role-based
access control, an audit log, and analytics.

## Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion
- **Backend:** Convex (database, functions, file storage, auth)
- **Auth:** Convex Auth (email + password), with an email-OTP second factor
  wired but off by default (needs SMTP credentials to enable)

## Local development

```bash
pnpm install
npx convex dev      # in one terminal — syncs convex/ and provisions .env.local
pnpm dev            # in another terminal — Next.js dev server on :3000
```

First run only, bootstrap the initial admin account and seed departments:

```bash
npx convex run seed:seedDepartments
npx convex run seed:bootstrapAdmin '{"email":"you@example.com","password":"...","name":"..."}'
```

## Deploying

**Convex (production deployment):**

```bash
npx convex deploy
```

This provisions a production Convex deployment and prints its URL. Set the
following on that deployment (via `npx convex env set` or the Convex
dashboard) before anyone can sign in — see `.env.example` for what each does:
`JWT_PRIVATE_KEY`, `JWKS`, `SITE_URL`.

**Vercel:**

1. Import this repo into Vercel.
2. Set the environment variables from `.env.example`
   (`NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_CONVEX_SITE_URL`) to the values
   printed by `npx convex deploy` above.
3. Deploy. Build command and output are the Next.js defaults — no extra
   Vercel config needed.

Run the same `seed:seedDepartments` / `seed:bootstrapAdmin` commands against
the production deployment (`npx convex run ... --prod`) before first login.
