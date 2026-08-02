# HireFlow

A full-stack recruitment and applicant-tracking system (ATS). Companies post jobs, screen and
progress applicants through a hiring pipeline, run automated coding tests, schedule interviews, and
message candidates. Candidates build a structured profile, apply, and track their applications.

Built as a TypeScript monorepo: a Next.js 16 web client, an Express 5 REST API, and a shared
package of types and Zod schemas consumed by both, over PostgreSQL via Prisma 7.

---

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech stack](#tech-stack)
- [Data model](#data-model)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [API reference](#api-reference)
- [Testing](#testing)
- [Continuous integration](#continuous-integration)
- [Known limitations](#known-limitations)
- [Repository scope](#repository-scope)

---

## Features

**Authentication & accounts**
- Email/password registration with bcrypt hashing (cost 12) and email verification
- JWT access + refresh tokens; refresh tokens are persisted in a `Session` row and returned as an
  `httpOnly` cookie, with silent refresh handled by an Axios response interceptor on the client
- Google and GitHub OAuth via Passport, each registered only when its client credentials are present
- Password reset by emailed token; `forgotPassword` responds identically for unknown addresses so it
  cannot be used to enumerate accounts
- Four roles: `SUPER_ADMIN`, `COMPANY_ADMIN`, `RECRUITER`, `CANDIDATE`

**Companies**
- Create a company; the creator becomes an `OWNER` and a `FREE`/`ACTIVE` subscription is provisioned
- Invite members by email, accept invites, remove members, change member roles
- Per-company authorization enforced in the service layer against `CompanyMember` role

**Jobs & applications**
- Draft/open/closed job lifecycle with required skills
- Public job listing; candidates apply once per job
- Recruiters advance applications through `APPLIED → SCREENING → INTERVIEW → OFFER → HIRED`/`REJECTED`

**Candidate screening**
- Computes a fit score from the candidate profile against a job's required skills

  ```
  skillScore      = Σ (proficiency × 10 + min(yearsExperience, 5) × 2)  for each matched skill
                    normalised against requiredSkills.length × 70
  experienceScore = min(100, totalYears / 5 × 100)     derived from Experience date ranges
  educationBonus  = 10 if the candidate has any education records
  score           = min(100, round(skillScore × 0.6 + experienceScore × 0.3 + educationBonus))
  ```

  Applications scoring ≥ 50 are moved to `SCREENING`. This is a **deterministic, explainable
  heuristic — not a language model.** There is no LLM dependency or AI API key anywhere in this
  project. See [Known limitations](#known-limitations).

**Coding tests**
- Recruiters attach coding tests with JSON test cases to a job
- Candidates start and submit; submissions are graded against expected output and scored
- One submission per candidate per test, enforced by a composite unique key
- Submitted JavaScript executes in a separate process with **no inherited environment**, a capped
  heap, and a wall-clock SIGKILL, so an infinite loop, an allocation bomb, or a `process.exit()` in
  submitted code cannot affect the API. See [Known limitations](#known-limitations) for what this
  does and does not protect against.

**Interviews, messaging, notifications**
- Phone/video/in-person interviews attached to an application, with scheduling and status
- Threaded messages per interview
- Notifications for application, interview, status-change, and message events

**Analytics & billing**
- Per-company aggregates (applications by status, jobs, interview counts) and a platform-wide
  admin view gated on `SUPER_ADMIN`
- `FREE`/`STARTER`/`PRO` subscription plans and a candidate referral workflow

---

## Architecture

```
hireflow-ai/
├── apps/
│   ├── api/                    @hireflow/api — Express 5 REST API
│   │   └── src/
│   │       ├── config/         env validation (Zod), Prisma client, Passport strategies
│   │       ├── middleware/     authenticate, authorize, validate, rate-limiter
│   │       ├── routes/         11 routers, one per domain
│   │       ├── controllers/    thin HTTP adapters
│   │       ├── services/       all business logic + authorization (~1,800 lines)
│   │       ├── templates/      transactional email HTML
│   │       ├── utils/          tokens, password hashing, mailer
│   │       └── tests/          Supertest integration tests
│   └── web/                    @hireflow/web — Next.js 16 App Router client
│       └── src/
│           ├── app/            25 routes
│           ├── hooks/          8 TanStack Query hook modules
│           ├── stores/         Zustand auth store (persisted)
│           ├── lib/            Axios instance with refresh interceptor
│           └── middleware.ts   cookie-based route guard
├── packages/
│   └── shared/                 @hireflow/shared — types + Zod schemas for 7 domains
├── prisma/                     schema (25 models), 9 migrations, seed
└── jarvis/                     unrelated Python prototype — see Repository scope
```

**Request flow:** `route → middleware (authenticate / validate) → controller → service → Prisma`.
Routers never touch the database, and services never touch `req`/`res`. Authorization lives in the
services, so it holds regardless of which route calls in.

**One source of truth for contracts.** `packages/shared` exports the Zod schemas the API validates
against *and* the types the web client compiles against, so a change to a payload shape surfaces as
a type error on both sides rather than a runtime 400.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Monorepo | Turborepo 2, pnpm workspaces |
| API | Node.js, Express 5, TypeScript |
| Web | Next.js 16 (App Router), React 19, Tailwind CSS v4 |
| Database | PostgreSQL 16, Prisma 7 (`@prisma/adapter-pg` driver adapter) |
| Auth | `jsonwebtoken`, `bcryptjs`, Passport (Google + GitHub OAuth) |
| Validation | Zod, shared between client and server |
| Client state | TanStack Query (server state), Zustand (auth session) |
| Forms | React Hook Form + Zod resolvers |
| Email | Nodemailer |
| Security | Helmet, CORS, cookie-parser, in-memory rate limiter |
| Tests | Vitest, Supertest |
| CI | GitHub Actions with a Postgres 16 service container |

---

## Data model

25 Prisma models and 12 enums across 9 sequential migrations. `User` is the hub.

| Group | Models |
| --- | --- |
| Identity | `User`, `Account`, `Session`, `VerificationToken`, `PasswordReset` |
| Organisations | `Company`, `CompanyMember`, `CompanyInvite` |
| Candidate profile | `CandidateProfile`, `Education`, `Experience`, `Project`, `Certification`, `Skill`, `CandidateSkill` |
| Hiring | `Job`, `JobSkill`, `Application` |
| Assessment | `CodingTest`, `CodingSubmission` |
| Interviewing | `Interview`, `Message` |
| Platform | `Notification`, `Subscription`, `Referral` |

Notable relations:
- `Interview` hangs off `Application`, not directly off `User`, so an interview always carries its
  hiring context.
- `Application` holds the screening output (`aiMatchScore`, `aiNotes`).
- `Company → Subscription` is 1:1 on a unique `companyId`.
- Skills are many-to-many in both directions: `CandidateSkill` (with proficiency and years) and
  `JobSkill` (with a required flag).

The datasource URL is supplied by `prisma.config.ts`, not `schema.prisma` — this is the Prisma 7
convention.

---

## Getting started

**Prerequisites:** Node.js ≥ 18, pnpm 10 (`corepack enable`), Docker (for local Postgres).

```bash
git clone https://github.com/Mu0810/hireflow-ai.git
cd hireflow-ai
pnpm install

cp .env.example .env
# Set DATABASE_URL and both JWT secrets (each must be ≥ 32 characters).

docker compose up -d postgres     # Postgres 16 on :5432

pnpm --filter @hireflow/shared build   # both apps import this package's dist/
pnpm db:generate
pnpm db:migrate
pnpm db:seed                           # optional: creates a SUPER_ADMIN row

pnpm dev                               # API on :4000, web on :3000
```

Build `packages/shared` before type-checking or building either app — it publishes `dist/`, and
Turborepo's `dependsOn: ["^build"]` only covers the `build`, `test`, and `lint` tasks.

---

## Environment variables

All variables live in a single `.env` at the repository root; the API loads it from there.

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | yes | minimum 32 characters |
| `JWT_REFRESH_SECRET` | yes | minimum 32 characters |
| `PORT` | no | API port, default `4000` |
| `NODE_ENV` | no | `development` \| `test` \| `production` |
| `API_URL` | no | also becomes the client's `NEXT_PUBLIC_API_URL` |
| `WEB_URL` | no | CORS origin and OAuth redirect target |
| `JWT_ACCESS_EXPIRES_IN` | no | default `15m` |
| `JWT_REFRESH_EXPIRES_IN` | no | default `7d` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | no | Google OAuth is skipped if unset |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | no | GitHub OAuth is skipped if unset |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` | no | without credentials, emails are logged to the console instead of sent |

Startup fails fast: `apps/api/src/config/env.ts` parses `process.env` through a Zod schema, so a
missing or too-short secret is reported immediately rather than at first use.

---

## Scripts

| Scope | Command | Does |
| --- | --- | --- |
| root | `pnpm dev` | runs every workspace's `dev` via Turborepo |
| root | `pnpm build` / `pnpm test` / `pnpm lint` | fans out across workspaces |
| root | `pnpm db:generate` | `prisma generate` |
| root | `pnpm db:migrate` | `prisma migrate dev` |
| root | `pnpm db:studio` | Prisma Studio |
| root | `pnpm db:seed` | `tsx prisma/seed.ts` |
| api | `pnpm --filter @hireflow/api dev` | `tsx watch src/index.ts` |
| api | `pnpm --filter @hireflow/api test` | Vitest integration suite |
| web | `pnpm --filter @hireflow/web dev` | `next dev` |

---

## API reference

Base URL `http://localhost:4000`. All responses are JSON. Authenticated routes expect
`Authorization: Bearer <accessToken>`. `GET /health` is unauthenticated.

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | – | create account |
| POST | `/api/auth/verify-email` | – | confirm email token |
| POST | `/api/auth/login` | – | issue access + refresh tokens |
| POST | `/api/auth/refresh` | cookie | rotate access token |
| POST | `/api/auth/logout` | cookie | delete session |
| POST | `/api/auth/forgot-password` | – | send reset token |
| POST | `/api/auth/reset-password` | – | consume reset token |
| GET | `/api/auth/google` · `/api/auth/github` | – | begin OAuth |
| GET | `/api/users/me` | ✓ | current user |
| GET | `/api/admin/dashboard` | `SUPER_ADMIN` | admin placeholder |
| POST | `/api/companies` | ✓ | create company |
| GET | `/api/companies/my` | ✓ | companies you belong to |
| GET | `/api/companies/:id` | ✓ | company detail |
| PATCH | `/api/companies/:id` | ✓ | update company |
| GET | `/api/companies/:companyId/jobs` | ✓ | jobs for a company |
| POST | `/api/companies/:id/invite` | ✓ | invite a member |
| POST | `/api/companies/accept-invite` | ✓ | accept an invite |
| DELETE | `/api/companies/:id/members/:memberId` | ✓ | remove a member |
| PATCH | `/api/companies/:id/members/role` | ✓ | change a member's role |
| GET | `/api/profiles/me` | ✓ | get or create your profile |
| PATCH | `/api/profiles/me` | ✓ | update profile and nested records |
| GET | `/api/jobs` | – | list open jobs |
| POST | `/api/jobs` | ✓ | create a job |
| GET | `/api/jobs/my` | ✓ | your applications |
| POST | `/api/jobs/apply` | ✓ | apply to a job |
| PATCH | `/api/jobs/applications/status` | ✓ | advance an application |
| POST | `/api/jobs/applications/:id/screen` | ✓ | run screening |
| GET | `/api/jobs/applications/:id/screen` | ✓ | read screening result |
| GET | `/api/jobs/:id` | ✓ | job detail |
| PATCH | `/api/jobs/:id` | ✓ | update a job |
| GET | `/api/jobs/:id/applications` | ✓ | applications for a job |
| POST | `/api/coding/tests` | ✓ | create a coding test |
| GET | `/api/coding/jobs/:jobId/tests` | ✓ | tests for a job |
| GET | `/api/coding/tests/:id` | ✓ | test detail |
| POST | `/api/coding/tests/:id/start` | ✓ | start an attempt |
| POST | `/api/coding/tests/:id/submit` | ✓ | submit and grade |
| GET | `/api/coding/tests/:id/submissions` | ✓ | submissions for a test |
| POST | `/api/interviews` | ✓ | schedule an interview |
| GET | `/api/interviews/my` | ✓ | your interviews |
| GET | `/api/interviews/:id` | ✓ | interview detail |
| PATCH | `/api/interviews/:id` | ✓ | reschedule or set status |
| POST | `/api/interviews/messages` | ✓ | post a message |
| GET | `/api/notifications` | ✓ | all notifications |
| GET | `/api/notifications/unread` | ✓ | unread only |
| PATCH | `/api/notifications/:id/read` | ✓ | mark one read |
| PATCH | `/api/notifications/read-all` | ✓ | mark all read |
| GET | `/api/analytics/companies/:companyId` | ✓ | company analytics |
| GET | `/api/analytics/admin` | `SUPER_ADMIN` | platform analytics |
| GET | `/api/subscriptions/companies/:companyId` | ✓ | read subscription |
| PATCH | `/api/subscriptions/companies/:companyId` | ✓ | change plan |
| POST | `/api/subscriptions/referrals` | ✓ | create a referral |
| GET | `/api/subscriptions/referrals/my` | ✓ | your referrals |
| PATCH | `/api/subscriptions/referrals/:id` | ✓ | update referral status |

Within each router, literal paths are registered before parameterised ones, so
`/api/jobs/applications/status` is not swallowed by `/api/jobs/:id`.

### Error responses

Every failure returns `{ "error": "<message>" }` with a status that describes the *kind* of failure,
so a client can tell a permissions problem from a typo without parsing prose:

| Status | Meaning | Example |
| --- | --- | --- |
| `400` | malformed or invalid request | Zod validation failure (`{ error, issues }`) |
| `401` | no valid credentials | missing bearer token, bad password, unverified email |
| `403` | authenticated but not permitted | not a member of the company |
| `404` | resource absent, or route does not exist | unknown job id, unmatched URL |
| `409` | conflicts with current state | email already registered, slug taken, already applied |
| `500` | unexpected — logged server-side, generic message returned | — |

Services throw typed errors from `src/utils/errors.ts` (`NotFoundError`, `ForbiddenError`,
`ConflictError`, …), each carrying its own status code. Controllers pass them through `sendError`, and
anything that is *not* one of these is treated as unexpected and reported as a `500` without leaking
internals. Unmatched routes return a JSON `404` rather than Express's default HTML page.

---

## Testing

```bash
docker compose up -d postgres
pnpm --filter @hireflow/api test
```

These are true integration tests, not mocks: Supertest drives the real Express app against a real
Postgres database. `src/tests/setup.ts` applies migrations before the run, and `helpers.ts` truncates
all 26 tables inside a single transaction in foreign-key-safe order between suites. Files run
serially (`fileParallelism: false`) because they share one database.

Covered today: registration (including duplicate and invalid email), login (verified, unverified,
wrong password), `GET /api/users/me`, role enforcement on `/api/admin/dashboard`, company creation
(including owner promotion and automatic subscription), duplicate slug rejection, member invite and
accept, and profile get-or-create plus nested update.

`http-semantics.test.ts` additionally pins the status-code contract described above — JSON 404s for
unmatched routes, 404 for a missing resource, 403 for an authenticated-but-forbidden action, 409 for
state conflicts, and 400 reserved for validation failures — so the distinction cannot regress.

Not yet covered: jobs, applications, screening, coding tests, interviews, notifications, analytics,
subscriptions, referrals, OAuth callbacks, and token refresh/logout.

---

## Continuous integration

`.github/workflows/ci.yml` runs on pushes and pull requests to `main`: it boots a `postgres:16`
service container, installs with pnpm 10 on Node 20, runs `prisma generate` and
`prisma migrate deploy`, then executes the API test suite.

CI does not currently run `build` or `lint`, and there is no job for the web app.

---

## Known limitations

Honest inventory of what is unfinished or unsafe. None of this is hidden behind a green badge.

1. **Coding submissions are contained, but not fully isolated.** Candidate code runs in a separate
   process with no inherited environment, a capped heap, and a hard SIGKILL timeout
   (`src/utils/sandbox.ts`), so an escape reaches no secrets and cannot take the API down. It is
   still the same OS user on the same host, so submitted code can open network connections and read
   files that user can read. Genuinely untrusted input needs OS-level isolation — a container per
   submission, gVisor, seccomp, or a hosted execution service. `sandbox.ts` is the seam where that
   swaps in without changing callers.
2. **Only JavaScript is graded.** `PYTHON` and `TYPESCRIPT` are valid `CodingLanguage` values but
   return `"Language not supported yet"`.
3. **Screening is a heuristic, not AI.** The repository name says `hireflow-ai`; the scoring is the
   weighted formula documented above. Nothing here calls a model.
4. **Rate limiting is in-memory and production-only.** The limiter returns immediately unless
   `NODE_ENV === "production"`, keeps counters in a `Map` that is never evicted, and does not work
   across multiple processes. Redis or a shared store is needed for real deployment.
5. **`GET /api/admin/dashboard` is a placeholder** returning a static object.
6. **Registration behaves differently per environment.** In development a new user is auto-verified;
   in production a verification email is sent; in test neither happens.
7. **The seeded admin cannot log in** — `prisma/seed.ts` creates the row without a `passwordHash`,
   and login rejects users that have none. Use it as a role fixture, or register normally.
8. **Two-factor auth is modelled but not implemented.** `User.twoFactorEnabled` exists and is unused.
9. **Redis is declared in `docker-compose.yml` but unused** by application code.
10. **Shared types are hand-maintained,** not generated from `schema.prisma`, so they can drift.
11. **`express-validator` is a dependency but never imported;** all validation goes through Zod.

---

## Repository scope

`jarvis/` is a **separate, unrelated Python prototype** — an experimental desktop assistant whose
tools generate Unity, Android Studio, and macOS scaffolding. It shares no code, database, or purpose
with the ATS.

It is also **incomplete and does not currently run.** Several modules its own code imports
(`jarvis.core`, `jarvis.logging`, `jarvis.memory`, `jarvis.voice`, `jarvis.api`, and others) are not
present in the tree, so `container.py` and the CLI fail at import time and the Python test suite
cannot be collected. `pyproject.toml` additionally declares optional voice, Discord, and Slack
extras that have no corresponding implementation.

Treat everything under `jarvis/` as an unfinished experiment parked in this repository, not as part
of HireFlow. It should eventually move to its own repository.
