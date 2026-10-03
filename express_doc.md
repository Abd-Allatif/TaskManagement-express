# Express.js Project Initialization Reference

A comprehensive checklist and code reference for starting a new Express.js backend project with best practices baked in from day one.

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Essential Libraries](#essential-libraries)
3. [Configuration Files](#configuration-files)
4. [Entry Point (server.js)](#entry-point)
5. [Middleware](#middleware)
6. [Controllers](#controllers)
7. [Routes](#routes)
8. [Services](#services)
9. [Database (Prisma)](#database)
10. [Utilities](#utilities)
11. [Security Checklist](#security-checklist)
12. [Error Handling](#error-handling)
13. [Validation](#validation)
14. [Best Practices](#best-practices)

---

## Project Structure

```
my-express-project/
├── controllers/         # Request handlers (business logic)
│   └── authController.js
├── middleware/           # Express middleware
│   ├── auth.js
│   ├── errorHandler.js
│   └── validators/
│       └── authValidators.js
├── routes/              # Route definitions
│   └── authRoutes.js
├── services/            # External services (email, storage, etc.)
│   └── emailService.js
├── utils/               # Helper utilities
│   └── asyncHandler.js
├── prisma/              # Database
│   ├── schema.prisma
│   └── migrations/
├── public/              # Static files
│   └── index.html
├── .env                 # Environment variables
├── .gitignore
├── eslint.config.mjs
├── package.json
└── server.js            # Entry point
```

---

## Essential Libraries

```bash
# Core
npm install express cors dotenv

# Database
npm install @prisma/client @prisma/adapter-mariadb
npm install -D prisma

# Auth
npm install bcrypt jsonwebtoken

# Validation
npm install express-validator

# Security
npm install helmet express-rate-limit

# Email
npm install nodemailer

# Dev
npm install -D nodemon eslint @eslint/js globals
```

---

## Configuration Files

### package.json

```json
{
  "name": "my-express-project",
  "version": "1.0.0",
  "description": "Express API with best practices",
  "license": "ISC",
  "type": "commonjs",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "lint": "eslint .",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "@prisma/adapter-mariadb": "^7.10.0",
    "@prisma/client": "^7.10.0",
    "bcrypt": "^6.0.0",
    "cors": "^2.8.6",
    "dotenv": "^18.0.1",
    "express": "^5.2.1",
    "express-rate-limit": "^7.0.0",
    "express-validator": "^7.0.0",
    "helmet": "^7.0.0",
    "jsonwebtoken": "^9.0.3",
    "nodemailer": "^6.0.0"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.0",
    "eslint": "^10.0.0",
    "globals": "^17.0.0",
    "nodemon": "^3.0.0",
    "prisma": "^7.0.0"
  }
}
```

### .env

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=mysql://user:password@localhost:3306/my_db

# JWT
JWT_SECRET=your-super-secret-key-here
JWT_EXPIRES_IN=7d

# CORS
CLIENT_URL=http://localhost:3000

# Email (Mailtrap for dev)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_mailtrap_user
EMAIL_PASS=your_mailtrap_password
EMAIL_FROM="App Name <no-reply@app.com>"
```

### .gitignore

```
node_modules/
.env
dist/
*.log
```

### eslint.config.mjs

```js
import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["**/*.js"],
    languageOptions: { sourceType: "commonjs" },
  },
]);
```

---

## Entry Point

### server.js

```js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { join } = require("path");
const errorHandler = require("./middleware/errorHandler");
const verifyToken = require("./middleware/auth");
const authRoutes = require("./routes/authRoutes");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- Security Middleware ---
app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));

// --- Rate Limiting ---
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many auth attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// --- Body Parsing ---
app.use(express.json());

// --- Public Routes ---
app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

app.use("/api/auth", authLimiter, authRoutes);

// --- Protected Routes (apply verifyToken) ---
// app.use("/api/tasks", verifyToken, taskRoutes);

// --- 404 Handler ---
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// --- Global Error Handler ---
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

---

## Middleware

### middleware/auth.js — JWT Verification

```js
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      message: "Access denied. No token provided. Please login to access this resource.",
    });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    console.error("Token verification error:", err);
    return res.status(403).json({
      message: "Invalid or Expired Token. Please login again to access this resource.",
    });
  }
};

module.exports = verifyToken;
```

### middleware/errorHandler.js — Global Error Handler

```js
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Prisma unique constraint violation
  if (err.code === "P2002") {
    statusCode = 409;
    message = "A record with this value already exists.";
  }

  // Prisma record not found
  if (err.code === "P2025") {
    statusCode = 404;
    message = "Record not found.";
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token.";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired.";
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

module.exports = errorHandler;
```

### middleware/validators/authValidators.js — Input Validation

```js
const { body, validationResult } = require("express-validator");

const registerRules = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
];

const loginRules = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email format")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required"),
];

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

module.exports = { registerRules, loginRules, validate };
```

---

## Controllers

### controllers/authController.js

**Key rules:**
- No try/catch — let Express 5 forward errors to errorHandler
- Keep functions focused on one task
- Use async/await consistently

```js
const bcrypt = require("bcrypt");
const prisma = require("../prismaClient");
const jwt = require("jsonwebtoken");
const { sendVerificationEmail } = require("../services/emailService");

// Register
const register = async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ message: "User Email Already Exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await prisma.user.create({
    data: { name, email, password: hashedPassword },
  });

  // ... send verification email, etc.

  return res.status(201).json({
    message: "Registration Successful",
    userId: newUser.id,
  });
};

// Login
const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

  return res.status(200).json({
    message: "Login successful!",
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
};

// Logout
const logout = async (req, res) => {
  return res.status(200).json({ message: "Logged out successfully." });
};

module.exports = { register, login, logout };
```

---

## Routes

### routes/authRoutes.js

```js
const express = require("express");
const { register, login, logout } = require("../controllers/authController");
const { registerRules, loginRules, validate } = require("../middleware/validators/authValidators");

const router = express.Router();

router.post("/register", registerRules, validate, register);
router.post("/login", loginRules, validate, login);
router.post("/logout", logout);

module.exports = router;
```

---

## Services

### services/emailService.js

```js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (toEmail, verificationCode, name = "User") => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || '"App" <no-reply@app.com>',
    to: toEmail,
    subject: "Verify Your Email Address",
    text: `Hello ${name},\n\nYour verification code is: ${verificationCode}\n\nThis code is valid for 10 minutes.`,
    html: `<p>Hello <strong>${name}</strong>,</p><p>Your code: <strong>${verificationCode}</strong></p>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: %s", info.messageId);
    return true;
  } catch (err) {
    console.error("Error sending email:", err);
    throw new Error("Email dispatch failed.", { cause: err });
  }
};

module.exports = { sendVerificationEmail };
```

---

## Database

### prisma/schema.prisma

```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id              String   @id @default(uuid(7))
  name            String
  email           String   @unique
  emailVerifiedAt DateTime? @map("email_verified_at")
  isVerified      Boolean  @default(false) @map("is_verified")
  password        String
  createdAt       DateTime @default(now()) @map("created_at")

  @@map("users")
}
```

### prismaClient.js

```js
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

const adapter = new PrismaMariaDb({ url: process.env.DATABASE_URL });

const prisma = new PrismaClient({ adapter });

module.exports = prisma;
```

### Prisma Commands

```bash
npx prisma init              # Initialize Prisma
npx prisma migrate dev       # Create migration from schema changes
npx prisma generate          # Generate Prisma Client
npx prisma studio            # Open database GUI
```

---

## Utilities

### utils/asyncHandler.js (Express 4 only — skip for Express 5)

```js
// Only needed for Express 4. Express 5 handles async errors natively.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
```

---

## Security Checklist

| Item | Implementation |
|---|---|
| Helmet | `app.use(helmet())` |
| CORS restriction | `cors({ origin: process.env.CLIENT_URL })` |
| Rate limiting (global) | 100 req/15min per IP |
| Rate limiting (auth) | 20 req/15min per IP |
| Input validation | `express-validator` on all routes |
| Password hashing | `bcrypt` with salt rounds 10 |
| JWT secrets | Stored in `.env`, never hardcoded |
| HTTPS | Enforce in production (reverse proxy) |
| No sensitive data in JWT | Only store `userId` and `email` |

---

## Error Handling

**Rules:**
1. Controllers do NOT use try/catch — let errors propagate
2. Express 5 automatically catches async errors and forwards to errorHandler
3. `errorHandler` maps known error types to proper HTTP status codes
4. Stack traces only shown in development

**Error type mapping:**

| Error | Status |
|---|---|
| `err.statusCode` (custom) | As set |
| Prisma `P2002` (duplicate) | 409 |
| Prisma `P2025` (not found) | 404 |
| `JsonWebTokenError` | 401 |
| `TokenExpiredError` | 401 |
| Everything else | 500 |

---

## Validation

**Rules:**
1. Validate ALL user input at the route level
2. Use `express-validator` chains
3. Always `.trim()` text fields (except passwords)
4. Use `.normalizeEmail()` for emails
5. Return field-level error messages
6. Apply validation middleware BEFORE controller

---

## Best Practices

| Practice | Why |
|---|---|
| No try/catch in controllers | Let errorHandler deal with errors — less code, consistent responses |
| Validation at route level | Reject bad input before it hits business logic |
| Rate limiting on auth | Prevent brute-force attacks |
| Helmet | Free security headers |
| CORS origin restriction | Prevent unauthorized cross-origin requests |
| `return` before `res.json()` | Stop execution after sending response |
| Strict equality (`===`) | Avoid type coercion bugs |
| `.env` for secrets | Never hardcode credentials |
| Separate services layer | Reusable, testable, single responsibility |
| Prisma for type safety | Auto-generated types, migrations, and query builder |

---

## Quick Start Checklist

When starting a new Express project, create these files in order:

- [ ] `npm init -y`
- [ ] Install dependencies
- [ ] Create `.env` with all config values
- [ ] Create `.gitignore`
- [ ] Create `eslint.config.mjs`
- [ ] Create `server.js` with security middleware
- [ ] Create `middleware/errorHandler.js`
- [ ] Create `middleware/auth.js`
- [ ] Create `middleware/validators/` (as needed)
- [ ] Create `prisma/schema.prisma`
- [ ] Create `prismaClient.js`
- [ ] Create `controllers/`
- [ ] Create `routes/`
- [ ] Create `services/` (as needed)
- [ ] Create `utils/` (as needed)
- [ ] Run `npx prisma migrate dev`
- [ ] Test all endpoints
