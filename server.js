require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { join } = require("path");
const errorHandler = require("./middleware/errorHandler");
// const verifyToken = require("./middleware/auth");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Sets Secure HTTP headers
app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true,
}));

// 3. Global rate limit — 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// 4. Strict rate limit for auth routes — 20 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many auth attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});


app.use(express.json());
// app.use(verifyToken);

app.get("/" , (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

app.use('/api/auth',authLimiter, authRoutes);

// --- PLACEHOLDER FOR FUTURE ROUTES ---
// e.g., app.use('/api/tasks', require('./routes/taskRoutes'));

// 404 Route Not Found Middleware (Catches unmatched URLs)
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Global Error Handling Middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log("server is running on http://localhost:" + PORT);
});
