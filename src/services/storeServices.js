const createStore = async (storeData) => {
  const { storeNumber, area, description } = storeData;

  // Check for duplicate store number
  const existingStore = await prisma.store.findUnique({
    where: { storeNumber },
  });
  if (existingStore) {
    throw new Error(`'${storeNumber}' raqamli do'kon allaqachon mavjud.`);
  }

  return prisma.store.create({
    data: {
      storeNumber,
      area,
      description,
    },
  });
};

const getAllStores = async () => {
  return prisma.store.findMany({
    orderBy: { storeNumber: "asc" }, // Sort by store number
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

  // Check if the store exists
  const existingStore = await prisma.store.findUnique({
    where: { id: storeId },
  });
  if (!existingStore) {
    throw new Error("Do'kon topilmadi");
  }

  // Check if the new storeNumber is already taken by another store
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

  // Check if the store is associated with any leases
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
