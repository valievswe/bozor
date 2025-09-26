// src/services/transactionService.js
const prismaClientPackage = require("@prisma/client");

const Prisma = prismaClientPackage.Prisma;
const prisma = new prismaClientPackage.PrismaClient();
/**
 * @description Creates a new transaction record manually.
 *              This is for offline payments like cash or bank transfer.
 * @param {object} transactionData - Contains leaseId, amount, paymentMethod, notes, etc.
 * @returns {Promise<object>} The newly created transaction.
 */
const createManualTransaction = async (transactionData) => {
  const { leaseId, amount, paymentMethod, notes, paymentDate } =
    transactionData;

  // 1. --- Basic Validation ---
  if (!leaseId || !amount || !paymentMethod) {
    throw new Error(
      "Ijara ID (leaseId), summa (amount), va to'lov usuli (paymentMethod) kiritilishi shart."
    );
  }
  if (amount <= 0) {
    throw new Error("Summa musbat son bo'lishi kerak.");
  }
  // Check if it's a valid payment method from our Enum
  if (
    !Object.values(prismaClientPackage.PaymentMethod).includes(paymentMethod)
  ) {
    throw new Error(`'${paymentMethod}' noto'g'ri to'lov usuli.`);
  }

  // 2. --- Verify that the lease exists and is active ---
  const lease = await prisma.lease.findUnique({
    where: { id: parseInt(leaseId, 10), isActive: true },
  });
  if (!lease) {
    throw new Error("Bu ID'ga ega faol ijara shartnomasi topilmadi.");
  }

  // 3. --- Create the transaction. It's immediately marked as PAID. ---
  const transaction = await prisma.transaction.create({
    data: {
      leaseId: parseInt(leaseId, 10),
      amount: new Prisma.Decimal(amount),
      status: "PAID",
      paymentMethod: paymentMethod,
      paymeTransactionId: notes ? `MANUAL: ${notes}` : "MANUAL_ENTRY",
      createdAt: paymentDate ? new Date(paymentDate) : new Date(),
    },
  });

  console.log(
    `Manually recorded PAID transaction ${transaction.id} for Lease ${lease.id}`
  );
  return transaction;
};

/**
 * @description Fetches a paginated and searchable list of all transactions.
 * @param {object} queryParams - Contains search, page, limit, status.
 * @returns {Promise<object>} An object with transaction data and metadata.
 */
const getAllTransactions = async (queryParams) => {
  const { search, page = 1, limit = 10, status } = queryParams;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const offset = (pageNum - 1) * limitNum;

  const where = {};
  if (status) where.status = status.toUpperCase();
  if (search) {
    where.OR = [
      { paymeTransactionId: { contains: search, mode: "insensitive" } },
      {
        lease: {
          owner: { fullName: { contains: search, mode: "insensitive" } },
        },
      },
      {
        lease: {
          store: { storeNumber: { contains: search, mode: "insensitive" } },
        },
      },
      {
        lease: {
          stall: { stallNumber: { contains: search, mode: "insensitive" } },
        },
      },
    ];
  }

  const [transactions, total] = await prisma.$transaction([
    prisma.transaction.findMany({
      where,
      skip: offset,
      take: limitNum,
      orderBy: { createdAt: "desc" },
      include: {
        lease: {
          select: {
            id: true,
            owner: { select: { fullName: true } },
            store: { select: { storeNumber: true } },
            stall: { select: { stallNumber: true } },
          },
        },
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    data: transactions,
    meta: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

// Placeholder for a function to get a single transaction by its ID
const getTransactionById = async (id) => {
  const transaction = await prisma.transaction.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      lease: {
        select: {
          id: true,
          owner: { select: { fullName: true } },
          store: { select: { storeNumber: true } },
          stall: { select: { stallNumber: true } },
        },
      },
    },
  });

  if (!transaction) {
    throw new Error("Tranzaksiya topilmadi.");
  }
  return transaction;
};

module.exports = {
  createManualTransaction,
  getAllTransactions,
  getTransactionById,
};
