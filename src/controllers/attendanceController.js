const attendanceService = require("../services/attendance.service");

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
