const express = require("express");
const cors = require("cors");
const { join } = require("path");
const errorHandler = require("./middleware/errorHandler");
const verifyToken = require("./middleware/auth");
const authRoutes = require("./routes/authRoutes");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(verifyToken);

app.get("/" , (req, res) => {
  res.sendFile(join(__dirname, "public", "index.html"));
});

app.use('/api/auth', authRoutes);

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
