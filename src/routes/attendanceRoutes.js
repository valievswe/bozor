const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");

router.post("/:stallId", attendanceController.createAttendance);
router.put("/:attendanceId", attendanceController.updateAttendance);
router.delete("/:attendanceId", attendanceController.deleteAttendance);

module.exports = router;
