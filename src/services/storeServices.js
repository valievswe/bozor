const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createStore = async (storeData) => {
  const { storeNumber, area, description, type, paymeKassaId } = storeData;

  if (!storeNumber || !area || !paymeKassaId || !type) {
    throw new Error(
      "Do'kon raqami, maydoni, Payme Kassa ID va turi kiritilishi shart."
    );
  }

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
      type,
      paymeKassaId,
    },
  });
};

const getAllStores = async (queryParams) => {
  // Destructure page and limit, with defaults
  const { search, page = 1, limit = 10 } = queryParams;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const offset = (pageNum - 1) * limitNum;

  const whereClause = search
    ? {
        OR: [
          { storeNumber: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
          { paymeKassaId: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};

  const [stores, total] = await prisma.$transaction([
    prisma.store.findMany({
      where: whereClause,
      skip: offset,
      take: limitNum,

      orderBy: [{ sortKey: "asc" }, { storeNumber: "asc" }],
      include: {
        _count: {
          select: { leases: { where: { isActive: true } } },
        },
      },
    }),
    prisma.store.count({ where: whereClause }),
  ]);

  const storesWithStatus = stores.map((store) => {
    const hasActiveLease = store._count.leases > 0;
    const { _count, ...rest } = store;
    return {
      ...rest,
      status: hasActiveLease ? "Band" : "Bo'sh",
    };
  });

  return {
    data: storesWithStatus,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
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

  // if (paymeKassaId) {
  //   const duplicateKassa = await prisma.store.findFirst({
  //     where: { paymeKassaId: paymeKassaId, id: { not: storeId } },
  //   });
  //   if (duplicateKassa) {
  //     throw new Error(
  //       "Bu Payme Kassa ID'si allaqachon boshqa do'konga tegishli."
  //     );
  //   }
  // }

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
