// src/services/storeService.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createStore = async (storeData) => {
  // --- FIX IS HERE ---
  // We now correctly get 'type' from the storeData object.
  const { storeNumber, area, description, type } = storeData;

  // Basic validation
  if (!storeNumber || !area) {
    throw new Error(
      "Do'kon raqami (storeNumber) va maydoni (area) kiritilishi shart."
    );
  }

  // Check for duplicate store number
  const existingStore = await prisma.store.findUnique({
    where: { storeNumber },
  });
  if (existingStore) {
    throw new Error(`'${storeNumber}' raqamli do'kon allaqachon mavjud.`);
  }

  // Now, the 'type' variable exists and can be used here.
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

  const existingStore = await prisma.store.findUnique({
    where: { id: storeId },
  });
  if (!existingStore) {
    throw new Error("Do'kon topilmadi");
  }

  if (updateData.storeNumber) {
    const duplicateStore = await prisma.store.findFirst({
      where: {
        storeNumber: updateData.storeNumber,
        id: { not: storeId },
      },
    });
    if (duplicateStore) {
      throw new Error(
        `'${updateData.storeNumber}' raqamli do'kon allaqachon mavjud.`
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
