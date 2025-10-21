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

// ✅ Record daily absences (run manually or via cron)
router.post(
  "/record-absences",
  attendancePermission,
  attendanceController.recordDailyAbsences
);

// ✅ Calculate debt for a specific stall
router.get(
  "/debt/:stallId",
  attendancePermission,
  attendanceController.calculateStallDebt
);

// ✅ Get attendance summary for all stalls (requires ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD)
router.get(
  "/summary",
  attendancePermission,
  attendanceController.getAttendanceSummary
);

module.exports = router;