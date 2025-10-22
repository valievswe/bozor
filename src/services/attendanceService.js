const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { v4: uuidv4 } = require("uuid");

function getUtcDateOnly(date = new Date()) {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
}

class AttendanceService {
  async create(stallId) {
    const date = getUtcDateOnly();
    const id = parseInt(stallId, 10);

    const existing = await prisma.attendance.findUnique({
      where: { stallId_date: { stallId: id, date } },
    });

    if (existing && existing.status === "PAID") {
      throw new Error("Attendance already PAID for today.");
    }

    const stall = await prisma.stall.findUnique({ where: { id } });
    if (!stall) throw new Error("Stall not found.");

    return prisma.attendance.upsert({
      where: { stallId_date: { stallId: id, date } },
      update: {},
      create: {
        stallId: id,
        date,
        status: "UNPAID",
        amount: stall.dailyFee || 0,
      },
    });
  }

  async update(attendanceId, data) {
    const id = parseInt(attendanceId, 10);
    if (isNaN(id)) throw new Error("Invalid attendance ID");

    const attendance = await prisma.attendance.findUnique({
      where: { id },
    });
    if (!attendance) throw new Error("Attendance not found.");

    // Prevent manual payment marking - payments must go through payment gateway
    if (data.status && data.status === "PAID") {
      throw new Error("Cannot manually mark attendance as PAID. Payments must be made through the payment gateway.");
    }

    return prisma.attendance.update({ where: { id }, data });
  }

  async remove(attendanceId) {
    const id = parseInt(attendanceId, 10);
    if (isNaN(id)) throw new Error("Invalid attendance ID");

    const attendance = await prisma.attendance.findUnique({
      where: { id },
    });
    if (!attendance) throw new Error("Attendance not found.");

    // Prevent deletion of paid attendance to avoid repayment fraud
    if (attendance.status === "PAID") {
      throw new Error("Cannot delete paid attendance. Payments are final and cannot be reversed.");
    }

    // Only delete unpaid attendance
    if (attendance.transactionId) {
      await prisma.transaction.delete({
        where: { id: attendance.transactionId },
      });
    }

    return prisma.attendance.delete({ where: { id } });
  }

  async getAll(filters = {}) {
    const { stallId, startDate, endDate, status } = filters;
    const where = {};

    if (stallId) where.stallId = parseInt(stallId, 10);
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    return prisma.attendance.findMany({
      where,
      include: {
        Stall: {
          select: {
            id: true,
            stallNumber: true,
          },
        },
      },
      orderBy: { date: "desc" },
    });
  }

  // Get attendance for a specific date with all stalls
  async getByDate(date) {
    const targetDate = date ? getUtcDateOnly(new Date(date)) : getUtcDateOnly();

    // Get all stalls
    const allStalls = await prisma.stall.findMany({
      orderBy: { stallNumber: "asc" },
      include: {
        SaleType: {
          select: {
            name: true,
          },
        },
        Section: {
          select: {
            name: true,
          },
        },
      },
    });

    // Get attendance records for this date
    const attendances = await prisma.attendance.findMany({
      where: { date: targetDate },
    });

    // Create a map for quick lookup
    const attendanceMap = new Map(
      attendances.map((a) => [a.stallId, a])
    );

    // Combine data
    return allStalls.map((stall) => {
      const attendance = attendanceMap.get(stall.id);
      return {
        stallId: stall.id,
        stallNumber: stall.stallNumber,
        dailyFee: stall.dailyFee,
        saleType: stall.SaleType?.name || "N/A",
        section: stall.Section?.name || "N/A",
        attendance: attendance || null,
        status: attendance ? attendance.status : null,
        amount: attendance ? attendance.amount : stall.dailyFee,
        attendanceId: attendance ? attendance.id : null,
      };
    });
  }

  // Bulk create attendance for all stalls on a specific date
  async bulkCreate(date) {
    try {
      const targetDate = date ? getUtcDateOnly(new Date(date)) : getUtcDateOnly();
      console.log('[BULK CREATE] Creating attendance for date:', targetDate);

      // Get all stalls
      const stalls = await prisma.stall.findMany();
      console.log('[BULK CREATE] Found stalls:', stalls.length);

      if (stalls.length === 0) {
        throw new Error('No stalls found to create attendance for');
      }

      const operations = stalls.map((stall) =>
        prisma.attendance.upsert({
          where: {
            stallId_date: { stallId: stall.id, date: targetDate },
          },
          update: {},
          create: {
            stallId: stall.id,
            date: targetDate,
            status: "UNPAID",
            amount: stall.dailyFee || 0,
          },
        })
      );

      const result = await prisma.$transaction(operations);
      console.log('[BULK CREATE] Successfully created/updated:', result.length);
      return result;
    } catch (error) {
      console.error('[BULK CREATE ERROR]:', error);
      throw new Error(`Failed to bulk create attendance: ${error.message}`);
    }
  }

  // Bulk update multiple attendance records
  async bulkUpdate(updates) {
    const operations = updates.map(({ attendanceId, status }) => {
      return prisma.attendance.update({
        where: { id: attendanceId },
        data: { status },
      });
    });

    return prisma.$transaction(operations);
  }

  // Mark all as paid for a specific date - DISABLED
  // Stall payments should only happen through Click.uz payment flow
  async markAllPaid(date) {
    throw new Error('Manual payment marking is disabled for stalls. All payments must go through the payment gateway.');
  }
}

module.exports = new AttendanceService();
