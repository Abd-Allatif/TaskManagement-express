# AGENTS.md

## Commands
- `npm run dev` — nodemon server (Express 5, CommonJS); `npm start` — node server.js
- `npm run lint` — ESLint flat config (`eslint.config.mjs`), CommonJS sourceType for `.js`
- `npm test` — intentionally fails ("no test specified"); there are no tests in this repo
- Prisma CLI reads `DATABASE_URL` via `prisma.config.ts` (imports `dotenv/config`); schema has **no** `url` in the datasource block — do not add one

## Architecture
- Entry: `server.js` → mounts `routes/authRoutes.js` at `/api/auth`; error handling via `middleware/errorHandler.js`, 404 catch-all before it
- `routes/taskRoutes.js` is **not mounted**; `controllers/taskController.js` is empty — task domain is unimplemented
- Auth flow: register → 6-digit email code (`VerificationToken`, 10-min expiry) → verify-email → login (JWT). Login gated on `emailVerifiedAt`
- DB: Prisma 7 + MariaDB via driver adapter `@prisma/adapter-mariadb`; client is a plain singleton module `prismaClient.js` (no global caching, so require it, don't reinstantiate)

## Gotchas
- **Env load order matters**: `prismaClient.js` captures `process.env.DATABASE_URL` at require time, but `server.js` requires routes (line 8) *before* `require("dotenv").config()` (line 10). Works only if `DATABASE_URL` is exported in the shell. Prefer `require("dotenv").config()` as the first line of `server.js` when touching startup.
- Controller file is misspelled: `controllers/authContoller.js` (not `authController.js`) — keep require paths exact
- JWT: `JWT_SECRET` required; `JWT_EXPIRES_IN` optional (default `7d`); `middleware/auth.js` (`verifyToken`) exists but is commented out in `server.js`
- Report `err.code`/`err.name` conventions: errorHandler maps Prisma `P2002`→409, `P2025`→404, JWT errors→401
- Verification code email text says "valid for 15 minutes" but code sets 10 minutes
- `.env` required keys: PORT, JWT_SECRET, NODE_ENV, CLIENT_URL, DATABASE_URL, EMAIL_HOST/PORT/USER/PASS/FROM
- Rate limits: global 100 req/15 min, `/api/auth` 20 req/15 min — tests/manual poking can hit these
- `postinstall` runs `prisma skills sync || exit 0` — safe to ignore failures
