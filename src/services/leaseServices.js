// src/services/leaseService.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createLease = async (leaseData, createdByUserId) => {
  const { ownerId, storeId, stallId, paymeKassaId, ...restOfData } = leaseData;

  if (!ownerId || !paymeKassaId) {
    throw new Error("Tadbirkor ID (ownerId) va Payme Kassa ID majburiy.");
  }

  const owner = await prisma.owner.findUnique({ where: { id: ownerId } });
  if (!owner) throw new Error("Bunday tadbirkor mavjud emas.");

  if (storeId) {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new Error("Bunday do'kon mavjud emas.");

    const existingStoreLease = await prisma.lease.findFirst({
      where: { storeId: storeId, isActive: true },
    });
    if (existingStoreLease) {
      throw new Error(
        `Bu do'kon (${store.storeNumber}) allaqachon boshqa faol ijara shartnomasiga ega.`
      );
    }
  }

  if (stallId) {
    const stall = await prisma.stall.findUnique({ where: { id: stallId } });
    if (!stall) throw new Error("Bunday rasta mavjud emas.");

    const existingStallLease = await prisma.lease.findFirst({
      where: { stallId: stallId, isActive: true },
    });
    if (existingStallLease) {
      throw new Error(
        `Bu rasta (${stall.stallNumber}) allaqachon boshqa faol ijara shartnomasiga ega.`
      );
    }
  }

  const existingKassa = await prisma.lease.findUnique({
    where: { paymeKassaId },
  });
  if (existingKassa) {
    throw new Error("Bu Payme Kassa ID'si allaqachon ishlatilgan.");
  }

  return prisma.lease.create({
    data: {
      ...restOfData,
      ownerId,
      storeId,
      stallId,
      paymeKassaId,
      createdById: createdByUserId,
    },
  });
};

const getAllLeases = async () => {
  return prisma.lease.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: { select: { id: true, fullName: true, tin: true } },
      store: { select: { id: true, storeNumber: true } },
      stall: { select: { id: true, stallNumber: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
};

const getLeaseById = async (id) => {
  const leaseId = parseInt(id, 10);
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId },
    include: {
      owner: true,
      store: true,
      stall: true,
      createdBy: { select: { firstName: true, lastName: true, email: true } },
    },
  });

  if (!lease) {
    throw new Error("Ijara shartnomasi topilmadi");
  }
  return lease;
};

const updateLease = async (id, updateData) => {
  const leaseId = parseInt(id, 10);

  if (updateData.paymeKassaId) {
    const existingKassa = await prisma.lease.findFirst({
      where: { paymeKassaId: updateData.paymeKassaId, id: { not: leaseId } },
    });
    if (existingKassa) {
      throw new Error(
        "Bu Payme Kassa ID'si allaqachon boshqa shartnomaga tegishli."
      );
    }
  }

  return prisma.lease.update({
    where: { id: leaseId },
    data: updateData,
  });
};

const deactivateLease = async (id) => {
  return prisma.lease.update({
    where: { id: parseInt(id, 10) },
    data: { isActive: false },
  });
};

module.exports = {
  createLease,
  getAllLeases,
  getLeaseById,
  updateLease,
  deactivateLease,
};
