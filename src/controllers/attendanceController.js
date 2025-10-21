const attendanceService = require("../services/attendanceService");

exports.markPresent = async (req, res) => {
  try {
    const { stallId } = req.params;
    const attendance = await attendanceService.markPresent(stallId);
    res.status(200).json({
      success: true,
      message: "Attendance marked successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark attendance",
      error: error.message,
    });
  }
};

exports.getAttendanceByStall = async (req, res) => {
  try {
    const { stallId } = req.params;
    const { status } = req.query;
    const attendance = await attendanceService.getAttendanceByStall(
      stallId,
      status
    );
    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error("Error fetching attendance by stall:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
      error: error.message,
    });
  }
};

exports.getAttendanceBySection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { status } = req.query;
    const attendance = await attendanceService.getAttendanceBySection(
      sectionId,
      status
    );
    res.status(200).json({
      success: true,
      data: attendance,
    });
  } catch (error) {
    console.error("Error fetching attendance by section:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch attendance",
      error: error.message,
    });
  }
};

exports.recordDailyAbsences = async (req, res) => {
  try {
    const { date } = req.body; // Optional: specify date, otherwise defaults to yesterday
    const targetDate = date ? new Date(date) : null;

    const summary = await attendanceService.recordDailyAbsences(targetDate);

    res.status(200).json({
      success: true,
      message: "Daily absences recorded successfully",
      data: summary,
    });
  } catch (error) {
    console.error("Error recording daily absences:", error);
    res.status(500).json({
      success: false,
      message: "Failed to record daily absences",
      error: error.message,
    });
  }
};

exports.calculateStallDebt = async (req, res) => {
  try {
    const { stallId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const debt = await attendanceService.calculateStallDebt(stallId, start, end);

    res.status(200).json({
      success: true,
      data: debt,
    });
  } catch (error) {
    console.error("Error calculating stall debt:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate debt",
      error: error.message,
    });
  }
};

exports.getAttendanceSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Start date and end date are required",
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const summary = await attendanceService.getAttendanceSummary(start, end);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error getting attendance summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get attendance summary",
      error: error.message,
    });
  }
};
