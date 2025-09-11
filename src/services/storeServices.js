// src/services/storeService.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createStore = async (storeData) => {
  // --- FIX IS HERE ---
  // We must destructure ALL fields we intend to use from the incoming data.
  const { storeNumber, area, description, type, paymeKassaId } = storeData;

  // Basic validation for required fields
  if (!storeNumber || !area || !paymeKassaId || !type) {
    throw new Error(
      "Do'kon raqami, maydoni, Payme Kassa ID va turi kiritilishi shart."
    );
  }

  // Check for duplicate store number
  const existingStore = await prisma.store.findUnique({
    where: { storeNumber },
  });
  if (existingStore) {
    throw new Error(`'${storeNumber}' raqamli do'kon allaqachon mavjud.`);
  }

  // Check for duplicate Payme Kassa ID
  const existingKassa = await prisma.store.findUnique({
    where: { paymeKassaId },
  });
  if (existingKassa) {
    throw new Error(
      "Bu Payme Kassa ID'si allaqachon boshqa do'konga tegishli."
    );
  }

  // Now, all variables are correctly defined and can be used here.
  return prisma.store.create({
    data: {
      storeNumber,
      area,
      description,
      type,
      paymeKassaId,
    },
  });
};

const getAllStores = async (searchTerm) => {
  const whereClause = searchTerm
    ? {
        OR: [
          { storeNumber: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
          { paymeKassaId: { contains: searchTerm, mode: "insensitive" } },
        ],
      }
    : {};

  const stores = await prisma.store.findMany({
    where: whereClause,
    orderBy: { storeNumber: "asc" },
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

  return stores.map((store) => {
    const hasActiveLease = store._count.leases > 0;
    const { _count, ...rest } = store;
    return {
      ...rest,
      status: hasActiveLease ? "Band" : "Bo'sh",
    };
  });
};

const getStoreById = async (id) => {
  const store = await prisma.store.findUnique({
    where: { id: parseInt(id, 10) },
  });
  if (!store) {
    throw new Error("Do'kon topilmadi");
  }
  return store;
};

const updateStore = async (id, updateData) => {
  const storeId = parseInt(id, 10);
  const { storeNumber, paymeKassaId } = updateData;

  if (storeNumber) {
    const duplicateStore = await prisma.store.findFirst({
      where: {
        storeNumber: storeNumber,
        id: { not: storeId },
      },
    });
    if (duplicateStore) {
      throw new Error(`'${storeNumber}' raqamli do'kon allaqachon mavjud.`);
    }
  }

  if (paymeKassaId) {
    const duplicateKassa = await prisma.store.findFirst({
      where: { paymeKassaId: paymeKassaId, id: { not: storeId } },
    });
    if (duplicateKassa) {
      throw new Error(
        "Bu Payme Kassa ID'si allaqachon boshqa do'konga tegishli."
      );
    }
  }

  return prisma.store.update({
    where: { id: storeId },
    data: updateData,
  });
};

const deleteStore = async (id) => {
  const storeId = parseInt(id, 10);

  const leaseCount = await prisma.lease.count({
    where: { storeId: storeId },
  });

  if (leaseCount > 0) {
    throw new Error(
      "Bu do'konni o'chirib bo'lmaydi. Unga tegishli ijara shartnomalari mavjud."
    );
  }

  return prisma.store.delete({
    where: { id: storeId },
  });
};

module.exports = {
  createStore,
  getAllStores,
  getStoreById,
  updateStore,
  deleteStore,
};
