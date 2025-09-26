const attendanceService = require("../services/attendanceService");

const getMonthData = async (req, res) => {
  try {
    const { leaseId, year, month } = req.query;
    if (!leaseId || !year || !month) {
      return res
        .status(400)
        .json({ message: "leaseId, year, and month are required." });
    }
    const records = await attendanceService.getAbsencesForMonth(
      leaseId,
      year,
      month
    );
    res.status(200).json(records);
  } catch (error) {
    console.error("Error in getMonthData controller:", error);
    res.status(500).json({
      message: "Failed to get attendance data.",
      error: error.message,
    });
  }
};

const setStatus = async (req, res) => {
  try {
    const { leaseId, date, isPresent } = req.body;
    if (!leaseId || !date || isPresent === undefined) {
      return res
        .status(400)
        .json({ message: "leaseId, date, and isPresent are required." });
    }
    const result = await attendanceService.setAttendanceStatus(
      leaseId,
      date,
      isPresent
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in setStatus controller:", error);
    res
      .status(400)
      .json({ message: "Failed to update attendance.", error: error.message });
  }
};

module.exports = {
  getMonthData,
  setStatus,
};
