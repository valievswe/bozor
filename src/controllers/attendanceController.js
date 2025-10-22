const attendanceService = require("../services/attendanceService");

const getAllAttendances = async (req, res) => {
  try {
    const filters = {
      stallId: req.query.stallId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      status: req.query.status,
    };
    const attendances = await attendanceService.getAll(filters);
    res.json(attendances);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

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

const getAttendanceByDate = async (req, res) => {
  try {
    const date = req.query.date; // Optional, defaults to today
    console.log('Fetching attendance for date:', date);
    const data = await attendanceService.getByDate(date);
    console.log('Successfully fetched attendance, count:', data.length);
    res.json(data);
  } catch (err) {
    console.error('Error in getAttendanceByDate:', err);
    res.status(400).json({ error: err.message, stack: err.stack });
  }
};

const bulkCreateAttendance = async (req, res) => {
  try {
    const { date } = req.body;
    const result = await attendanceService.bulkCreate(date);
    res.status(201).json({
      message: "Bulk attendance created successfully",
      count: result.length,
      data: result,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const bulkUpdateAttendance = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { attendanceId, status }
    const result = await attendanceService.bulkUpdate(updates);
    res.json({
      message: "Bulk update successful",
      count: result.length,
      data: result,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const markAllPaid = async (req, res) => {
  try {
    const { date } = req.body;
    const result = await attendanceService.markAllPaid(date);
    res.json({
      message: "All attendance marked as paid",
      count: result.length,
      data: result,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  getAllAttendances,
  createAttendance,
  updateAttendance,
  deleteAttendance,
  getAttendanceByDate,
  bulkCreateAttendance,
  bulkUpdateAttendance,
  markAllPaid,
};
