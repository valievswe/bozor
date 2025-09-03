// src/services/stallService.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createStall = async (stallData) => {
  const { stallNumber, area, description } = stallData;

  const existingStall = await prisma.stall.findUnique({
    where: { stallNumber },
  });
  if (existingStall) {
    throw new Error(`'${stallNumber}' raqamli rasta allaqachon mavjud.`);
  }

  return prisma.stall.create({
    data: {
      stallNumber,
      area,
      description,
    },
  });
};

const getAllStalls = async (searchTerm) => {
  const whereClause = searchTerm
    ? {
        OR: [
          { stallNumber: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
        ],
      }
    : {};

  const stalls = await prisma.stall.findMany({
    where: whereClause,
    orderBy: { stallNumber: "asc" },
    include: {
      _count: {
        select: {
          leases: {
            where: { isActive: true },
          },
        },
      },
    },
  });

  return stalls.map((stall) => {
    const isActiveLease = stall._count.leases > 0;
    return {
      ...stall,
      status: isActiveLease ? "Band" : "Bo'sh",
      _count: undefined,
    };
  });
};

const getStallById = async (id) => {
  const stall = await prisma.stall.findUnique({
    where: { id: parseInt(id, 10) },
  });
  if (!stall) {
    throw new Error("Rasta topilmadi");
  }
  return stall;
};

const updateStall = async (id, updateData) => {
  const stallId = parseInt(id, 10);

  const existingStall = await prisma.stall.findUnique({
    where: { id: stallId },
  });
  if (!existingStall) {
    throw new Error("Rasta topilmadi");
  }

  if (updateData.stallNumber) {
    const duplicateStall = await prisma.stall.findFirst({
      where: {
        stallNumber: updateData.stallNumber,
        id: { not: stallId },
      },
    });
    if (duplicateStall) {
      throw new Error(
        `'${updateData.stallNumber}' raqamli rasta allaqachon mavjud.`
      );
    }
  }

  return prisma.stall.update({
    where: { id: stallId },
    data: updateData,
  });
};

const deleteStall = async (id) => {
  const stallId = parseInt(id, 10);

  const leaseCount = await prisma.lease.count({
    where: { stallId: stallId },
  });

  if (leaseCount > 0) {
    throw new Error(
      "Bu rastani o'chirib bo'lmaydi. Unga tegishli ijara shartnomalari mavjud."
    );
  }

  return prisma.stall.delete({
    where: { id: stallId },
  });
};

module.exports = {
  createStall,
  getAllStalls,
  getStallById,
  updateStall,
  deleteStall,
};
