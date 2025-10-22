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

    if (data.status && data.status === "PAID") {
      if (!attendance.transactionId) {
        const transaction = await prisma.transaction.create({
          data: {
            amount: attendance.amount || 0,
            attendance: { connect: { id: attendance.id } },
          },
        });
        data.transactionId = transaction.id;
      }
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
    const targetDate = date ? getUtcDateOnly(new Date(date)) : getUtcDateOnly();

    // Get all stalls
    const stalls = await prisma.stall.findMany();

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

    return prisma.$transaction(operations);
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

  // Mark all as paid for a specific date
  async markAllPaid(date) {
    const targetDate = date ? getUtcDateOnly(new Date(date)) : getUtcDateOnly();

    // Get all unpaid attendances for this date
    const unpaidAttendances = await prisma.attendance.findMany({
      where: {
        date: targetDate,
        status: "UNPAID",
      },
    });

    // Create transactions and update attendance records
    const operations = unpaidAttendances.map(async (attendance) => {
      let transactionId = attendance.transactionId;

      if (!transactionId) {
        const transaction = await prisma.transaction.create({
          data: {
            amount: attendance.amount || 0,
            attendance: { connect: { id: attendance.id } },
          },
        });
        transactionId = transaction.id;
      }

      return prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          status: "PAID",
          transactionId,
        },
      });
    });

    return Promise.all(operations);
  }
}

module.exports = new AttendanceService();
