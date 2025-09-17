// src/routes/reportRoutes.js
const express = require("express");
const router = express.Router();
const {
  isAuthenticated,
  hasPermission,
} = require("../middlewares/authMiddleware");
const reportController = require("../controllers/reportController");

// All routes in this file are for viewing reports
const viewReportsPermission = [isAuthenticated, hasPermission("VIEW_REPORTS")];

// GET /api/reports/daily?date=YYYY-MM-DD
router.get("/daily", viewReportsPermission, reportController.getDaily);

// GET /api/reports/monthly?year=YYYY&month=MM
router.get("/monthly", viewReportsPermission, reportController.getMonthly);

// GET /api/reports/stats
router.get("/stats", isAuthenticated, reportController.getStats);

module.exports = router;
