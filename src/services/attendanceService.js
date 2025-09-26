// src/services/attendanceService.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * @description Gets all absence records for a specific lease in a given month.
 * @param {number} leaseId The ID of the lease.
 * @param {number} year The year (e.g., 2025).
 * @param {number} month The month (1 for Jan, 12 for Dec).
 */
const getAbsencesForMonth = async (leaseId, year, month) => {
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1)); // Use the start of the next month as the boundary

  return prisma.attendance.findMany({
    where: {
      leaseId: parseInt(leaseId, 10),
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
    orderBy: { date: "asc" },
  });
};

/**
 * @description Sets the attendance status. If marking as ABSENT, it creates an absence record.
 *              If marking as PRESENT, it deletes the absence record.
 * @param {number} leaseId The ID of the lease.
 * @param {string} dateString The date in 'YYYY-MM-DD' format.
 * @param {boolean} isPresent The desired status.
 */
const setAttendanceStatus = async (leaseId, dateString, isPresent) => {
  const date = new Date(dateString);
  const utcDate = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );

  if (isPresent === false) {
    // MARK AS ABSENT: Create an absence record.
    // We use `upsert` so if the admin clicks it twice, it doesn't crash.
    return prisma.attendance.upsert({
      where: {
        leaseId_date: {
          leaseId: parseInt(leaseId, 10),
          date: utcDate,
        },
      },
      update: {}, // If it exists, do nothing.
      create: {
        leaseId: parseInt(leaseId, 10),
        date: utcDate,
      },
    });
  } else {
    // MARK AS PRESENT: The tenant is no longer an exception, so we delete the absence record.
    return prisma.attendance.deleteMany({
      where: {
        leaseId: parseInt(leaseId, 10),
        date: utcDate,
      },
    });
  }
};

module.exports = {
  getAbsencesForMonth,
  setAttendanceStatus,
};
