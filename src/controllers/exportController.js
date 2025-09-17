// File Location: src/controllers/exportController.js

const exportService = require("../services/exportService");

const exportLeases = async (req, res) => {
  try {
    const fileBuffer = await exportService.exportLeasesToExcel();

    const today = new Date().toISOString().split("T")[0];
    const fileName = `Faol_Ijaralar_Hisoboti_${today}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    res.send(fileBuffer);
  } catch (error) {
    console.error("Failed to export leases to Excel:", error);
    res.status(500).json({
      message: "Hisobotni yaratishda xatolik yuz berdi.",
      error: error.message,
    });
  }
};

module.exports = {
  exportLeases,
};
