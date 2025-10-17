// src/services/ownerService.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createOwner = async (ownerData, createdByUserId) => {
  const { fullName, tin, address, activityType, phoneNumber } = ownerData;

  // STIR (INN) bo'yicha dublikatni tekshirish
  const existingOwner = await prisma.owner.findUnique({ where: { tin } });
  if (existingOwner) {
    throw new Error("Bu STIR (INN) bilan tadbirkor allaqachon mavjud.");
  }

  return prisma.owner.create({
    data: {
      fullName,
      tin,
      address,
      activityType,
      phoneNumber,
      createdById: createdByUserId,
    },
  });
};
const getAllOwners = async (searchTerm, page = 1, limit = 10) => {
  const whereClause = searchTerm
    ? {
        OR: [
          { fullName: { contains: searchTerm, mode: "insensitive" } },
          { tin: { contains: searchTerm, mode: "insensitive" } },
          { phoneNumber: { contains: searchTerm, mode: "insensitive" } },
        ],
      }
    : {};

  // Convert to numbers and set defaults
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  // Get total count for pagination metadata
  const totalCount = await prisma.owner.count({
    where: whereClause,
  });

  // Get paginated data
  const owners = await prisma.owner.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    skip: skip,
    take: limitNum,
  });

  // Return data with pagination metadata
  return {
    data: owners,
    meta: {
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(totalCount / limitNum),
    },
  };
};

const getOwnerById = async (id) => {
  const owner = await prisma.owner.findUnique({
    where: { id: parseInt(id, 10) },
  });
  if (!owner) {
    throw new Error("Tadbirkor topilmadi");
  }
  return owner;
};

const updateOwner = async (id, updateData) => {
  const ownerId = parseInt(id, 10);

  const owner = await prisma.owner.findUnique({
    where: { id: ownerId },
  });
  if (!owner) {
    throw new Error("Tadbirkor topilmadi");
  }

  // VALIDATION: If the TIN is being updated, check if the new TIN already
  // belongs to another owner.
  if (updateData.tin) {
    const existingOwnerWithTin = await prisma.owner.findFirst({
      where: {
        tin: updateData.tin,
        id: { not: ownerId }, // Exclude the current owner from the search
      },
    });

    if (existingOwnerWithTin) {
      throw new Error("Bu STIR (INN) allaqachon boshqa tadbirkorga tegishli.");
    }
  }

  // Update the owner with the provided data
  return prisma.owner.update({
    where: { id: ownerId },
    data: updateData,
  });
};

const deleteOwner = async (id) => {
  const ownerId = parseInt(id, 10);

  // 1. Check if the owner has any associated leases.
  const leaseCount = await prisma.lease.count({
    where: { ownerId: ownerId },
  });

  if (leaseCount > 0) {
    throw new Error(
      "Bu tadbirkorni o'chirib bo'lmaydi. Unga tegishli ijara shartnomalari mavjud."
    );
  }

  // 2. If no leases are found, proceed with deletion.
  // First, check if the owner actually exists to provide a clear error message.
  const owner = await prisma.owner.findUnique({
    where: { id: ownerId },
  });
  if (!owner) {
    throw new Error("Tadbirkor topilmadi");
  }

  // 3. Delete the owner
  return prisma.owner.delete({
    where: { id: ownerId },
  });
};

module.exports = {
  createOwner,
  getAllOwners,
  getOwnerById,
  updateOwner,
  deleteOwner,
};
