const express = require("express");
const cors = require("cors");
const path = require("path");
const errorHandler = require("./middleware/errorHandler");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

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

const server = app.listen(PORT, () => {
  console.log("server is running on http://localhost:" + PORT);
});
