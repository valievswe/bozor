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

module.exports = {
  markPresent,
  getAttendanceByStall,
  getAttendanceBySection,
};
