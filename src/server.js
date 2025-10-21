// src/app.js
const express = require("express");
const mainRouter = require("./routes/index.js");
const cors = require("cors");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const app = express();

// Log environment variables
console.log("=== ENVIRONMENT VARIABLES ===");
console.log(
  "App Name:",
  process.env.TENANT_ID || process.env.MY_DOMAIN || "Unknown"
);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", process.env.PORT);
console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("JWT_SECRET:", process.env.JWT_SECRET);
console.log("WEBHOOK_SECRET_KEY:", process.env.WEBHOOK_SECRET_KEY);
console.log("MY_DOMAIN:", process.env.MY_DOMAIN);
console.log(
  "CENTRAL_PAYMENT_SERVICE_URL:",
  process.env.CENTRAL_PAYMENT_SERVICE_URL
);
console.log(
  "CENTRAL_PAYMENT_SERVICE_SECRET:",
  process.env.CENTRAL_PAYMENT_SERVICE_SECRET
);
console.log("PAYMENT_SERVICE_ID:", process.env.PAYMENT_SERVICE_ID);
console.log("PAYMENT_MERCHANT_ID:", process.env.PAYMENT_MERCHANT_ID);
console.log("PAYMENT_SECRET_KEY:", process.env.PAYMENT_SECRET_KEY);
console.log("=============================");

// Scheduler (if you have cron jobs)
const { startScheduler } = require("./utils/cron");

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Myrent API is running!",
    status: "OK",
  });
});

// API routes
app.use("/api", mainRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startScheduler();
});
