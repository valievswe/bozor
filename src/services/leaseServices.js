// src/services/leaseService.js
const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();

const createLease = async (leaseData, createdByUserId) => {
  // Destructure ALL expected fields from the frontend
  let {
    ownerId,
    storeId,
    stallId,
    certificateNumber,
    issueDate,
    expiryDate,
    shopMonthlyFee,
    stallMonthlyFee,
    guardFee,
    paymeKassaId,
    isActive,
  } = leaseData;

  if (!ownerId || !paymeKassaId) {
    throw new Error("Tadbirkor ID (ownerId) va Payme Kassa ID majburiy.");
  }
  ownerId = parseInt(ownerId, 10);
  if (storeId) storeId = parseInt(storeId, 10);
  if (stallId) stallId = parseInt(stallId, 10);
  if (shopMonthlyFee) shopMonthlyFee = new Prisma.Decimal(shopMonthlyFee);
  if (stallMonthlyFee) stallMonthlyFee = new Prisma.Decimal(stallMonthlyFee);
  if (guardFee) guardFee = new Prisma.Decimal(guardFee);

  const dataToCreate = {
    certificateNumber,
    issueDate: issueDate ? new Date(issueDate) : null,
    expiryDate: expiryDate ? new Date(expiryDate) : null,
    shopMonthlyFee,
    stallMonthlyFee,
    guardFee,
    paymeKassaId,
    isActive,
    // Connect to related models
    owner: { connect: { id: ownerId } },
    createdBy: { connect: { id: createdByUserId } },
  };

  // Conditionally connect store and stall if their IDs are provided
  if (storeId) {
    dataToCreate.store = { connect: { id: storeId } };
  }
  if (stallId) {
    dataToCreate.stall = { connect: { id: stallId } };
  }

  return prisma.lease.create({
    data: dataToCreate,
  });
};

const getAllLeases = async (searchTerm) => {
  const whereClause = searchTerm
    ? {
        OR: [
          { certificateNumber: { contains: searchTerm, mode: "insensitive" } },
          {
            owner: { fullName: { contains: searchTerm, mode: "insensitive" } },
          },
          {
            store: {
              storeNumber: { contains: searchTerm, mode: "insensitive" },
            },
          },
          {
            stall: {
              stallNumber: { contains: searchTerm, mode: "insensitive" },
            },
          },
        ],
      }
    : {};

  return prisma.lease.findMany({
    where: whereClause,
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
  // Destructure ALL possible fields from the frontend
  let {
    ownerId,
    storeId,
    stallId,
    certificateNumber,
    issueDate,
    expiryDate,
    shopMonthlyFee,
    stallMonthlyFee,
    guardFee,
    paymeKassaId,
    isActive,
  } = updateData;

  const dataToUpdate = {};

  if (ownerId !== undefined) dataToUpdate.ownerId = parseInt(ownerId, 10);
  if (storeId !== undefined)
    dataToUpdate.storeId = storeId ? parseInt(storeId, 10) : null;
  if (stallId !== undefined)
    dataToUpdate.stallId = stallId ? parseInt(stallId, 10) : null;
  if (certificateNumber !== undefined)
    dataToUpdate.certificateNumber = certificateNumber;
  if (issueDate !== undefined)
    dataToUpdate.issueDate = issueDate ? new Date(issueDate) : null;
  if (expiryDate !== undefined)
    dataToUpdate.expiryDate = expiryDate ? new Date(expiryDate) : null;
  if (shopMonthlyFee != null)
    dataToUpdate.shopMonthlyFee = new Prisma.Decimal(shopMonthlyFee);
  if (stallMonthlyFee != null)
    dataToUpdate.stallMonthlyFee = new Prisma.Decimal(stallMonthlyFee);
  if (guardFee != null) dataToUpdate.guardFee = new Prisma.Decimal(guardFee);
  if (paymeKassaId !== undefined) dataToUpdate.paymeKassaId = paymeKassaId;
  if (isActive !== undefined) dataToUpdate.isActive = isActive;

  return prisma.lease.update({
    where: { id: leaseId },
    data: dataToUpdate,
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
