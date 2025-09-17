// src/routes/exportRoutes.js

const express = require("express");
const router = express.Router();
const {
  isAuthenticated,
  hasPermission,
} = require("../middlewares/authMiddleware");
const exportController = require("../controllers/exportController");

router.get(
  "/leases",
  [isAuthenticated, hasPermission("VIEW_REPORTS")],
  exportController.exportLeases
);

module.exports = router;
