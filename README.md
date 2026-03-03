# LGS League MVP

Production-ready MVP for multi-tenant local game store events.

## Stack
- Next.js App Router + TypeScript
- PostgreSQL + Prisma
- Email magic link auth (extensible provider)
- Server-side RBAC + audited state machine

## Quickstart
1. `cp .env.example .env`
2. Set `DATABASE_URL` and `APP_URL`
3. `npm install`
4. `npm run prisma:migrate`
5. `npm run prisma:seed`
6. `npm run dev`

## Deploy (Vercel + Neon)
1. Create Neon Postgres database.
2. Set Vercel env vars: `DATABASE_URL`, `APP_URL`, `MAGIC_LINK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`.
3. `npm run build` locally to verify.
4. Push to GitHub and import into Vercel.
5. Run migrations in CI or via `prisma migrate deploy` in a post-deploy job.

## Working Magic-Link Login
- Visit `/auth/sign-in` and submit a known email.
- The API issues a 15-minute one-time token and emails the callback link via Resend.
- Callback consumes token, creates DB-backed session, and sets an httpOnly cookie.
- Seeded test users: `admin@platform.test`, `to@store.test`, `player@store.test`.

## State Machine
Allowed transitions:
- DRAFT -> PUBLISHED | CANCELLED
- PUBLISHED -> REGISTRATION_OPEN | DRAFT | CANCELLED
- REGISTRATION_OPEN -> IN_PROGRESS | PUBLISHED | CANCELLED
- IN_PROGRESS -> COMPLETED | CANCELLED
- COMPLETED -> ARCHIVED
- CANCELLED -> ARCHIVED
- ARCHIVED -> (none)

Enforced in `lib/events/state-machine.ts`.

## Suspend vs Ban
- **Suspended**: user cannot create/update events or moderate results; historic data retained.
- **Banned**: user cannot log in or participate in any org workflows.

## Future Extension Points
- `event_type` discriminator on `events` with type-specific config table(s)
- Notification event bus in `lib/notifications/events.ts`
- Pairing strategy interface in `lib/pairing/strategy.ts`
