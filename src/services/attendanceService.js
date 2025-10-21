const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

function getUtcDateOnly(date = new Date()) {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
}

const markPresent = async (stallId) => {
  const date = getUtcDateOnly();
  const id = parseInt(stallId, 10);

  return prisma.attendance.upsert({
    where: {
      stallId_date: {
        stallId: id,
        date,
      },
    },
    update: {},
    create: {
      stallId: id,
      date,
      status: "UNPAID",
    },
  });
};

const getAttendanceByStall = async (stallId, status) => {
  const where = {
    stallId: parseInt(stallId, 10),
  };
  if (status) where.status = status.toUpperCase();

  return prisma.attendance.findMany({
    where,
    orderBy: { date: "desc" },
  });
};

const getAttendanceBySection = async (sectionId, status) => {
  const where = {
    Stall: {
      sectionId: parseInt(sectionId, 10),
    },
  };
  if (status) where.status = status.toUpperCase();

  return prisma.attendance.findMany({
    where,
    include: {
      Stall: {
        select: {
          id: true,
          stallNumber: true,
          area: true,
          sectionId: true,
        },
      },
    },
    orderBy: { date: "desc" },
  });
};

/**
 * Record absences for all stalls that didn't pay today
 * Should be run at end of each day (e.g., via cron job at 11:59 PM)
 *
 * @param {Date} date - Optional date to record absences for (defaults to yesterday)
 * @returns {Object} Summary of absences recorded
 */
const recordDailyAbsences = async (date = null) => {
  // Default to yesterday if no date provided
  const targetDate = date ? getUtcDateOnly(date) : getUtcDateOnly(new Date(Date.now() - 24 * 60 * 60 * 1000));

  console.log(`[ABSENCE] Recording absences for date: ${targetDate.toISOString()}`);

  // Get all active stalls
  const stalls = await prisma.stall.findMany({
    select: {
      id: true,
      stallNumber: true,
      dailyFee: true,
    },
  });

  console.log(`[ABSENCE] Found ${stalls.length} total stalls`);

  let absencesRecorded = 0;
  let alreadyPaid = 0;
  let errors = [];

  for (const stall of stalls) {
    try {
      // Check if attendance already exists for this stall on this date
      const existingAttendance = await prisma.attendance.findUnique({
        where: {
          stallId_date: {
            stallId: stall.id,
            date: targetDate,
          },
        },
      });

      if (existingAttendance) {
        if (existingAttendance.status === "PAID") {
          alreadyPaid++;
          console.log(`[ABSENCE] Stall ${stall.stallNumber} already paid for ${targetDate.toISOString()}`);
        } else {
          console.log(`[ABSENCE] Stall ${stall.stallNumber} already has UNPAID record for ${targetDate.toISOString()}`);
        }
        continue;
      }

      // No attendance record exists - create absence (UNPAID)
      await prisma.attendance.create({
        data: {
          stallId: stall.id,
          date: targetDate,
          status: "UNPAID",
          amount: stall.dailyFee || 0,
        },
      });

      absencesRecorded++;
      console.log(`[ABSENCE] Recorded absence for stall ${stall.stallNumber} (${stall.dailyFee} so'm debt)`);
    } catch (error) {
      errors.push({
        stallId: stall.id,
        stallNumber: stall.stallNumber,
        error: error.message,
      });
      console.error(`[ABSENCE] Error recording absence for stall ${stall.stallNumber}:`, error);
    }
  }

  const summary = {
    date: targetDate,
    totalStalls: stalls.length,
    absencesRecorded,
    alreadyPaid,
    errors: errors.length,
    errorDetails: errors,
  };

  console.log(`[ABSENCE] Summary:`, summary);
  return summary;
};

/**
 * Calculate total debt for a stall (all UNPAID attendance records)
 *
 * @param {number} stallId - The stall ID
 * @param {Date} startDate - Optional start date for debt calculation
 * @param {Date} endDate - Optional end date for debt calculation
 * @returns {Object} Debt summary
 */
const calculateStallDebt = async (stallId, startDate = null, endDate = null) => {
  const where = {
    stallId: parseInt(stallId, 10),
    status: "UNPAID",
  };

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = getUtcDateOnly(startDate);
    if (endDate) where.date.lte = getUtcDateOnly(endDate);
  }

  const unpaidAttendances = await prisma.attendance.findMany({
    where,
    orderBy: { date: "asc" },
  });

  const totalDebt = unpaidAttendances.reduce(
    (sum, attendance) => sum + Number(attendance.amount || 0),
    0
  );

  return {
    stallId: parseInt(stallId, 10),
    unpaidDays: unpaidAttendances.length,
    totalDebt,
    unpaidAttendances,
    startDate: startDate ? getUtcDateOnly(startDate) : null,
    endDate: endDate ? getUtcDateOnly(endDate) : null,
  };
};

/**
 * Get attendance summary for all stalls
 *
 * @param {Date} startDate - Start date for summary
 * @param {Date} endDate - End date for summary
 * @returns {Array} Array of stall summaries
 */
const getAttendanceSummary = async (startDate, endDate) => {
  const start = getUtcDateOnly(startDate);
  const end = getUtcDateOnly(endDate);

  const stalls = await prisma.stall.findMany({
    include: {
      attendances: {
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
        orderBy: { date: "asc" },
      },
      Section: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return stalls.map((stall) => {
    const paidDays = stall.attendances.filter((a) => a.status === "PAID").length;
    const unpaidDays = stall.attendances.filter((a) => a.status === "UNPAID").length;
    const totalDebt = stall.attendances
      .filter((a) => a.status === "UNPAID")
      .reduce((sum, a) => sum + Number(a.amount || 0), 0);
    const totalPaid = stall.attendances
      .filter((a) => a.status === "PAID")
      .reduce((sum, a) => sum + Number(a.amount || 0), 0);

    return {
      stallId: stall.id,
      stallNumber: stall.stallNumber,
      section: stall.Section?.name || "Tayinlanmagan",
      dailyFee: Number(stall.dailyFee || 0),
      paidDays,
      unpaidDays,
      totalDays: paidDays + unpaidDays,
      totalPaid,
      totalDebt,
      attendances: stall.attendances,
    };
  });
};

module.exports = {
  markPresent,
  getAttendanceByStall,
  getAttendanceBySection,
  recordDailyAbsences,
  calculateStallDebt,
  getAttendanceSummary,
};
