// src/routes/attendanceRoutes.js

const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");

const {
  isAuthenticated,
  hasPermission,
} = require("../middlewares/authMiddleware");
const attendancePermission = [isAuthenticated, hasPermission("EDIT_LEASE")];

router.get("/", attendancePermission, attendanceController.getMonthData);
router.post("/", attendancePermission, attendanceController.setStatus);

module.exports = router;
