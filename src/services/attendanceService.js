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
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
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

    return prisma.attendance.update({ where: { id: attendanceId }, data });
  }

  async remove(attendanceId) {
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
    });
    if (!attendance) throw new Error("Attendance not found.");

    if (attendance.transactionId) {
      await prisma.transaction.delete({
        where: { id: attendance.transactionId },
      });
    }

    return prisma.attendance.delete({ where: { id: attendanceId } });
  }
}

module.exports = new AttendanceService();
