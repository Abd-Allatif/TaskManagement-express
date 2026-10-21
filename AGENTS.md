# AGENTS.md

## Commands
- `npm run dev` — nodemon server (Express 5, CommonJS); `npm start` — node server.js
- `npm run lint` — ESLint flat config (`eslint.config.mjs`), CommonJS sourceType for `.js`
- `npm test` — Jest; Prisma/bcrypt/JWT/email are mocked, no DB or SMTP needed
- `npm run seed` — upserts PENDING/IN_PROGRESS/COMPLETED statuses
- Prisma CLI reads `DATABASE_URL` via `prisma.config.ts` (imports `dotenv/config`); schema has **no** `url` in the datasource block — do not add one

## Architecture
- Entry: `server.js` → mounts `routes/Authentication/authRoutes.js` at `/api/auth`,
  `routes/Task/taskRoutes.js` at `/api/tasks`, `routes/Category/categoryRoutes.js`
  at `/api/categories`, `routes/Status/statusRoutes.js` at `/api/statuses`,
  `routes/Admin/adminRoutes.js` at `/api/admin/auth`, and
  `routes/Admin/adminManagementRoutes.js` at `/api/admin`.
- Layered per domain: `routes/<Domain>/` → `controllers/<Domain>/` →
  `repository/<Domain>/` → Prisma. Validators live in `middleware/validators/`.
- Auth: `middleware/auth.js` (`verifyToken`) normalizes the JWT to
  `req.user = { id, type: "USER"|"ADMIN", ... }`. `middleware/adminAuth.js`
  (`verifyAdmin`) composes it and requires `type === "ADMIN"`.
  `middleware/authorization.js` (`taskOwnerOrAdmin`) guards task mutations.
- Flow: register → 6-digit email code (`VerificationToken`, 10-min expiry) →
  verify-email → login (JWT). Login gated on `emailVerifiedAt`.
- DB: Prisma 7 + MariaDB via driver adapter `@prisma/adapter-mariadb`; client is a
  plain singleton module `prismaClient.js` (require it, don't reinstantiate).

## Authorization
- Tasks: readable by any authenticated principal; mutations restricted to the
  owner (`createdById`) or an admin.
- Categories: readable by any authenticated principal; writes admin-only.
- Statuses: readable by any authenticated principal; managed under `/api/admin`.
- Admin management (`/api/admin`): admin-only.

## Gotchas
- `require("dotenv").config()` is the first line of `server.js` — keep it that way.
- Controller/require paths use the exact directory casing (`Authentication`,
  `Admin`, `Task`, `Category`, `Status`).
- JWT: `JWT_SECRET` required; `JWT_EXPIRES_IN` optional (default `7d`).
- errorHandler maps Prisma `P2002`→409, `P2025`→404, `P2003`→400, JWT errors→401.
- Verification code expiry is 10 minutes; the email copy matches.
- `.env` required keys: PORT, JWT_SECRET, NODE_ENV, CLIENT_URL, DATABASE_URL,
  EMAIL_HOST/PORT/USER/PASS/FROM.
- Rate limits: global 100 req/15 min, `/api/auth` and `/api/admin/auth` 20 req/15 min.
- `postinstall` runs `prisma skills sync || exit 0` — safe to ignore failures.

## Tests
- Jest suites in `__tests__/`. Unit tests mock `../prismaClient` per model;
  integration tests (`routes.test.js`) boot `server.js` on an ephemeral port.
- `jest.clearAllMocks()` does NOT reset mock implementations — set
  `mockResolvedValue` explicitly in each test that needs it.
