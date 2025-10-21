const attendanceService = require("../services/attendanceService");

const createAttendance = async (req, res) => {
  try {
    const attendance = await attendanceService.create(req.params.stallId);
    res.status(201).json(attendance);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const updateAttendance = async (req, res) => {
  try {
    const updated = await attendanceService.update(
      req.params.attendanceId,
      req.body
    );
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteAttendance = async (req, res) => {
  try {
    await attendanceService.remove(req.params.attendanceId);
    res.json({ message: "Attendance deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  createAttendance,
  updateAttendance,
  deleteAttendance,
};
