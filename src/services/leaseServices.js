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
    isActive,
    owner: { connect: { id: ownerId } },
    createdBy: { connect: { id: createdByUserId } },
  };

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

const getAllLeases = async (queryParams) => {
  const { search, status, page = 1, limit = 10 } = queryParams;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  const offset = (pageNum - 1) * limitNum;

  const where = {};
  if (status === "active") {
    where.isActive = true;
  } else if (status === "archived") {
    where.isActive = false;
  }
  if (search) {
    where.OR = [
      { owner: { fullName: { contains: search, mode: "insensitive" } } },
      { store: { storeNumber: { contains: search, mode: "insensitive" } } },
      { stall: { stallNumber: { contains: search, mode: "insensitive" } } },
      { paymeKassaId: { contains: search, mode: "insensitive" } },
    ];
  }

  const [leases, total] = await prisma.$transaction([
    prisma.lease.findMany({
      where,
      skip: offset,
      take: limitNum,
      orderBy: { createdAt: "desc" },
      include: {
        owner: { select: { id: true, fullName: true, tin: true } },
        store: { select: { id: true, storeNumber: true } },
        stall: { select: { id: true, stallNumber: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.lease.count({ where }),
  ]);

  return {
    data: leases,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
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
  if (isActive !== undefined) dataToUpdate.isActive = isActive;

  return prisma.lease.update({
    where: { id: leaseId },
    data: dataToUpdate,
  });
};
const deactivateLease = async (id) => {
  const leaseId = parseInt(id, 10);
  console.log(`--- SERVICE: Updating lease ${leaseId} to isActive: false ---`);
  return prisma.lease.update({
    where: { id: leaseId },
    data: { isActive: false },
  });
};

const activateLease = async (id) => {
  const leaseId = parseInt(id, 10);

  const leaseToActivate = await prisma.lease.findUnique({
    where: { id: leaseId },
  });

  if (!leaseToActivate) {
    throw new Error("Ijara shartnomasi topilmadi.");
  }

  //Validation
  if (leaseToActivate.storeId) {
    const conflictingLease = await prisma.lease.findFirst({
      where: {
        storeId: leaseToActivate.storeId,
        isActive: true,
        id: { not: leaseId },
      },
    });
    if (conflictingLease) {
      throw new Error(
        "Bu do'kon allaqachon boshqa faol shartnomaga biriktirilgan. Avval o'sha shartnomani arxivga jo'nating."
      );
    }
  }

  if (leaseToActivate.stallId) {
    const conflictingLease = await prisma.lease.findFirst({
      where: {
        stallId: leaseToActivate.stallId,
        isActive: true,
        id: { not: leaseId },
      },
    });
    if (conflictingLease) {
      throw new Error(
        "Bu rasta allaqachon boshqa faol shartnomaga biriktirilgan. Avval o'sha shartnomani arxivga jo'nating."
      );
    }
  }

  // If no conflicts, activate
  return prisma.lease.update({
    where: { id: leaseId },
    data: { isActive: true },
  });
};

module.exports = {
  createLease,
  getAllLeases,
  getLeaseById,
  updateLease,
  deactivateLease,
  activateLease,
};
