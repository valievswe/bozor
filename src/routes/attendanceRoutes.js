const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");

const {
  isAuthenticated,
  hasPermission,
} = require("../middlewares/authMiddleware");

const attendancePermission = [isAuthenticated, hasPermission("EDIT_LEASE")];

// ✅ Mark attendance (creates UNPAID if not exists)
router.post(
  "/mark/:stallId",
  attendancePermission,
  attendanceController.markPresent
);

// ✅ Get attendance by stall (optional ?status=UNPAID)
router.get(
  "/stall/:stallId",
  attendancePermission,
  attendanceController.getAttendanceByStall
);

// ✅ Get attendance by section (optional ?status=PAID)
router.get(
  "/section/:sectionId",
  attendancePermission,
  attendanceController.getAttendanceBySection
);

module.exports = router;