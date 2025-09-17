// src/controllers/reportController.js
const reportService = require("../services/reportService");

const getDaily = async (req, res) => {
  try {
    const { date } = req.query; // Expects date in 'YYYY-MM-DD' format
    if (!date || isNaN(new Date(date))) {
      return res.status(400).json({
        message:
          "A valid 'date' query parameter is required (e.g., YYYY-MM-DD).",
      });
    }
    const report = await reportService.getDailyReport(new Date(date));
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({
      message: "Daily report generation failed",
      error: error.message,
    });
  }
};

const getMonthly = async (req, res) => {
  try {
    const year = parseInt(req.query.year, 10);
    const month = parseInt(req.query.month, 10);
    if (!year || !month || month < 1 || month > 12) {
      return res.status(400).json({
        message:
          "Valid 'year' and 'month' (1-12) query parameters are required.",
      });
    }
    const report = await reportService.getMonthlyReport(year, month);
    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({
      message: "Monthly report generation failed",
      error: error.message,
    });
  }
};

const getStats = async (req, res) => {
  try {
    const stats = await reportService.getDashboardStats();
    res.status(200).json(stats);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Dashboard statistics failed", error: error.message });
  }
};

module.exports = {
  getDaily,
  getMonthly,
  getStats,
};
