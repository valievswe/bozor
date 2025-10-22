// src/services/paymentService.js
// COMPLETE FIXED VERSION

const { PrismaClient, Prisma } = require("@prisma/client");
const clickPaymentService = require("./clickPaymentService");
const prisma = new PrismaClient();
const axios = require("axios");

// --- HELPER FUNCTIONS ---

function getUtcDateOnly(date = new Date()) {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
}

const calculateExpectedPayment = (lease, attendanceCount = 0) => {
  const totalFee =
    (Number(lease.shopMonthlyFee) || 0) +
    (Number(lease.stallMonthlyFee) || 0) +
    (Number(lease.guardFee) || 0);

  if (lease.paymentInterval === "DAILY") {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    let workdays = 0;
    const date = new Date(year, month, 1);

    while (date.getMonth() === month) {
      if (date.getDay() !== 0) workdays++;
      date.setDate(date.getDate() + 1);
    }
    const payableDays = workdays - attendanceCount;
    return totalFee * (payableDays > 0 ? payableDays : 0);
  }

  return totalFee;
};

const calculateLeasePaymentStatus = (lease, attendanceCount = 0) => {
  if (!lease || !lease.transactions || lease.transactions.length === 0) {
    return "UNPAID";
  }
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const expectedAmount = calculateExpectedPayment(lease, attendanceCount);

  if (lease.paymentInterval === "MONTHLY") {
    const totalPaidThisMonth = lease.transactions
      .filter((tx) => {
        const txDate = new Date(tx.createdAt);
        return (
          txDate.getFullYear() === currentYear &&
          txDate.getMonth() === currentMonth
        );
      })
      .reduce((sum, tx) => sum + Number(tx.amount), 0);
    if (totalPaidThisMonth >= expectedAmount) return "PAID";
    if (totalPaidThisMonth > 0 && totalPaidThisMonth < expectedAmount)
      return "PARTIALLY_PAID";
  } else if (lease.paymentInterval === "DAILY") {
    const paidToday = lease.transactions.some((tx) => {
      const txDate = new Date(tx.createdAt);
      return (
        txDate.getFullYear() === currentYear &&
        txDate.getMonth() === currentMonth &&
        txDate.getDate() === now.getDate()
      );
    });
    if (paidToday) return "PAID";
  }
  return "UNPAID";
};

// --- MAIN SERVICE FUNCTIONS ---

const getLeaseForPayment = async (leaseId) => {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId, isActive: true },
    include: {
      owner: { select: { fullName: true } },
      store: { select: { storeNumber: true } },
      transactions: {
        where: { status: { in: ["PAID", "PARTIAL_PAID"] } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!lease) throw new Error("Faol ijara shartnomasi topilmadi.");

  const attendanceCount = lease.stallId
    ? await prisma.attendance.count({
      where: {
        stallId: lease.stallId,
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
    })
    : 0;
  const totalFee = calculateExpectedPayment(lease, attendanceCount);
  const paymentStatus = calculateLeasePaymentStatus(lease, attendanceCount);

  return {
    id: lease.id,
    ownerName: lease.owner.fullName,
    storeNumber: lease.store?.storeNumber,
    stallNumber: lease.stall?.stallNumber,
    totalFee,
    paymentInterval: lease.paymentInterval,
    paymentStatus: paymentStatus,
    transactions: lease.transactions,
  };
};

const initiatePayment = async (leaseId, amount, payment_method = null) => {
  console.log(`--- [PAYMENT INITIATION STARTED] ---`);
  console.log(`Lease ID: ${leaseId}, Amount: ${amount}`);

  const tenantId = process.env.TENANT_ID;

  // AUTO-SELECT payment method based on tenant
  if (!payment_method) {
    if (tenantId === "ipak_yuli") {
      payment_method = "PAYME";
      console.log("Auto-selected: PAYME (ipak_yuli tenant)");
    } else {
      payment_method = "CLICK";
      console.log(`Auto-selected: CLICK (${tenantId} tenant)`);
    }
  }

  console.log(`Provider: ${payment_method}`);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const lease = await prisma.lease.findUnique({
    where: { id: leaseId, isActive: true },
    include: {
      store: { select: { id: true, storeNumber: true, kassaID: true } },
      transactions: {
        where: { status: { in: ["PAID", "PARTIAL_PAID"] } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!lease) throw new Error("Faol ijara shartnomasi topilmadi.");

  // Get attendance count for current month if lease has a stall
  const attendanceCount = lease.stallId
    ? await prisma.attendance.count({
      where: {
        stallId: lease.stallId,
        date: {
          gte: new Date(currentYear, currentMonth, 1),
          lt: new Date(currentYear, currentMonth + 1, 1),
        },
      },
    })
    : 0;
  const expectedAmount = calculateExpectedPayment(lease, attendanceCount);

  const totalPaidThisMonth = lease.transactions
    .filter((tx) => {
      const txDate = new Date(tx.createdAt);
      return (
        txDate.getFullYear() === currentYear &&
        txDate.getMonth() === currentMonth
      );
    })
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const remainingAmount = expectedAmount - totalPaidThisMonth;

  if (remainingAmount <= 0)
    throw new Error("To'lov allaqachon to'liq amalga oshirilgan.");

  if (Number(amount) > remainingAmount) {
    throw new Error(
      `To'lov summasi ortiqcha. Qolgan to'lov: ${remainingAmount} UZS`
    );
  }

  const paymentType =
    Number(amount) === remainingAmount ? "FULL_PAID" : "PARTIAL_PAID";

  await prisma.transaction.deleteMany({
    where: { leaseId, status: "PENDING" },
  });

  const transaction = await prisma.transaction.create({
    data: {
      amount: new Prisma.Decimal(amount),
      status: "PENDING",
      leaseId,
      paymentMethod: payment_method.toUpperCase(),
    },
  });

  // ========== SMART ROUTING ==========
  if (payment_method.toUpperCase() === "CLICK") {
    // Click.uz direct integration (all tenants except ipak_yuli)
    if (!clickPaymentService.isClickEnabled(tenantId)) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED" },
      });
      throw new Error(`Click.uz is not available for tenant: ${tenantId}`);
    }

    const paymentUrl = clickPaymentService.generatePaymentUrl(
      transaction.id,
      amount,
      tenantId
    );

    console.log("✅ Click.uz payment URL generated");

    return {
      checkoutUrl: paymentUrl,
      transactionId: transaction.id,
      provider: "CLICK",
      paymentType,
      remainingAmount,
    };
  } else if (payment_method.toUpperCase() === "PAYME") {
    // Payme via central payment service (ipak_yuli only)
    const storageIdSource =
      lease.store?.kassaID || lease.store?.id || lease.stall?.id;
    if (!storageIdSource) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED" },
      });
      throw new Error("Lease is not associated with a valid store or stall.");
    }

    const storageIdAsNumber = parseInt(storageIdSource, 10);
    if (isNaN(storageIdAsNumber)) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED" },
      });
      throw new Error(
        `Invalid format for storage_id source: ${storageIdSource}`
      );
    }

    try {
      const payload = {
        lease_id: lease.id,
        storage_id: storageIdAsNumber,
        amount: Number(amount),
        tenant_id: tenantId,
        payment_method: "payme",
        callback_url: `https://${process.env.MY_DOMAIN}/api/payments/webhook/update-status`,
        return_url: `https://${process.env.MY_DOMAIN}/pay/status/${transaction.id}`,
      };

      const headers = {
        "Content-Type": "application/json",
        "X-Webhook-Secret": process.env.CENTRAL_PAYMENT_SERVICE_SECRET,
      };

      console.log("Calling central Payme service");

      const response = await axios.post(
        `${process.env.CENTRAL_PAYMENT_SERVICE_URL}/payment/transactions/create`,
        payload,
        { headers }
      );

      const paymentUrl = response.data?.payme_link;
      if (!paymentUrl) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: "FAILED" },
        });
        throw new Error(
          "Invalid response from payment service - no payme_link"
        );
      }

      console.log("✅ Payme payment URL received");

      return {
        checkoutUrl: paymentUrl,
        transactionId: transaction.id,
        provider: "PAYME",
        paymentType,
        remainingAmount,
      };
    } catch (error) {
      console.error(
        "Payme service call failed:",
        error.response?.data || error.message
      );
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED" },
      });
      const errorMessage =
        error.response?.data?.error || "To'lov xizmati vaqtincha ishlamayapti.";
      throw new Error(errorMessage);
    }
  } else {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "FAILED" },
    });
    throw new Error("Unsupported payment method");
  }
};

const getLeasePaymentSummary = async (leaseId) => {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId, isActive: true },
    include: {
      transactions: {
        where: { status: { in: ["PAID", "PARTIAL_PAID"] } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!lease) throw new Error("Faol ijara shartnomasi topilmadi.");

  // Fetch all attendance records for this lease's stall if it has one
  const attendanceRecords = lease.stallId
    ? await prisma.attendance.findMany({
      where: { stallId: lease.stallId },
      select: { date: true },
    })
    : [];

  const isDaily = lease.paymentInterval === "DAILY";
  const totalMonthlyFee =
    (Number(lease.shopMonthlyFee) || 0) +
    (Number(lease.stallMonthlyFee) || 0) +
    (Number(lease.guardFee) || 0);

  const startDate = new Date(lease.issueDate);
  const endDate = new Date(lease.expiryDate);

  const summary = [];
  let totalPaid = 0;
  let totalDebt = 0;

  let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);

  while (current <= endDate) {
    const month = current.getMonth();
    const year = current.getFullYear();

    let expectedAmount = totalMonthlyFee;

    if (isDaily) {
      let workdays = 0;
      const date = new Date(year, month, 1);
      while (date.getMonth() === month) {
        if (date.getDay() !== 0) workdays++;
        date.setDate(date.getDate() + 1);
      }

      const attendanceCount = attendanceRecords.filter((a) => {
        const d = new Date(a.date);
        return d.getFullYear() === year && d.getMonth() === month;
      }).length;

      expectedAmount *= workdays - attendanceCount;
    }

    const paid = lease.transactions
      .filter((tx) => {
        const d = new Date(tx.createdAt);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    totalPaid += paid;
    const debt = Math.max(expectedAmount - paid, 0);
    totalDebt += debt;

    summary.push({
      month: current.toLocaleString("default", {
        month: "long",
        year: "numeric",
      }),
      expected: expectedAmount,
      paid,
      debt,
    });

    current.setMonth(current.getMonth() + 1);
  }

  return {
    summary,
    totalPaid,
    totalDebt,
  };
};

/**
 * Enhanced payment initiation with debt allocation support
 */
const initiatePaymentWithAllocation = async (
  leaseId,
  amount,
  payment_method = null,
  paymentMode = "DEBT_ALLOCATION"
) => {
  console.log(`--- [PAYMENT WITH ALLOCATION STARTED] ---`);

  const tenantId = process.env.TENANT_ID;

  // Auto-select payment method if not provided
  if (!payment_method) {
    if (tenantId === "ipak_yuli") {
      payment_method = "PAYME";
    } else {
      payment_method = "CLICK";
    }
    console.log(`[AUTO-SELECT] Payment method: ${payment_method}`);
  }

  console.log(
    `Lease ID: ${leaseId}, Amount: ${amount}, Mode: ${paymentMode}, Provider: ${payment_method}`
  );

  const lease = await prisma.lease.findUnique({
    where: { id: leaseId, isActive: true },
    include: {
      store: { select: { id: true, storeNumber: true, kassaID: true } },
      owner: { select: { fullName: true } },
      transactions: {
        where: { status: "PAID" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!lease) throw new Error("Faol ijara shartnomasi topilmadi.");

  // For CURRENT_MONTH mode, use regular initiatePayment
  if (paymentMode === "CURRENT_MONTH") {
    return await initiatePayment(leaseId, amount, payment_method);
  }

  // For DEBT_ALLOCATION and CUSTOM modes
  const debtAllocationService = require("./debtAllocationService");
  const debtSummary = await debtAllocationService.getDebtSummary(leaseId);

  if (debtSummary.totalDebt === 0) {
    throw new Error("Qarz mavjud emas. Barcha to'lovlar amalga oshirilgan.");
  }

  if (Number(amount) > debtSummary.totalDebt) {
    console.log(
      `Payment amount ${amount} exceeds debt ${debtSummary.totalDebt}. Will allocate fully.`
    );
  }

  // Remove old PENDING transactions
  await prisma.transaction.deleteMany({
    where: { leaseId, status: "PENDING" },
  });

  // Create PENDING transaction
  const transaction = await prisma.transaction.create({
    data: {
      amount: new Prisma.Decimal(amount),
      status: "PENDING",
      leaseId,
      paymentMethod: payment_method.toUpperCase(),
    },
  });

  // ========== SMART ROUTING FOR DEBT ALLOCATION ==========
  if (payment_method.toUpperCase() === "CLICK") {
    // Click.uz direct integration
    if (!clickPaymentService.isClickEnabled(tenantId)) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED" },
      });
      throw new Error(`Click.uz is not available for tenant: ${tenantId}`);
    }

    const paymentUrl = clickPaymentService.generatePaymentUrl(
      transaction.id,
      amount,
      tenantId
    );

    const allocation = await debtAllocationService.calculatePaymentAllocation(
      leaseId,
      amount
    );

    console.log("✅ Click.uz payment URL generated (with allocation)");

    return {
      checkoutUrl: paymentUrl,
      transactionId: transaction.id,
      paymentMode,
      allocationPreview: allocation,
      provider: "CLICK",
    };
  } else if (payment_method.toUpperCase() === "PAYME") {
    // Payme via central payment service
    const storageIdSource =
      lease.store?.kassaID || lease.store?.id || lease.stall?.id;
    if (!storageIdSource) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED" },
      });
      throw new Error("Lease is not associated with a valid store or stall.");
    }

    const storageIdAsNumber = parseInt(storageIdSource, 10);
    if (isNaN(storageIdAsNumber)) {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED" },
      });
      throw new Error(
        `Invalid format for storage_id source: ${storageIdSource}`
      );
    }

    try {
      const payload = {
        tenant_id: tenantId,
        storage_id: storageIdAsNumber,
        lease_id: lease.id,
        amount: parseInt(amount, 10),
        payment_method: "payme",
        callback_url: `https://${process.env.MY_DOMAIN}/api/payments/webhook/update-status`,
        return_url: `https://${process.env.MY_DOMAIN}/pay/status/${transaction.id}`,
      };

      const headers = {
        "Content-Type": "application/json",
        "X-Webhook-Secret": process.env.CENTRAL_PAYMENT_SERVICE_SECRET,
      };

      console.log("Calling central Payme service (with allocation)");

      const response = await axios.post(
        `${process.env.CENTRAL_PAYMENT_SERVICE_URL}/payment/transactions/create`,
        payload,
        { headers }
      );

      const paymentUrl = response.data?.payme_link;
      if (!paymentUrl) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: "FAILED" },
        });
        throw new Error(
          "Invalid response from payment service - no payme_link"
        );
      }

      const allocation = await debtAllocationService.calculatePaymentAllocation(
        leaseId,
        amount
      );

      console.log("✅ Payme payment URL received (with allocation)");

      return {
        checkoutUrl: paymentUrl,
        transactionId: transaction.id,
        paymentMode,
        allocationPreview: allocation,
        provider: "PAYME",
      };
    } catch (error) {
      console.error(
        "Payme service call failed:",
        error.response?.data || error.message
      );
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "FAILED" },
      });
      const errorMessage =
        error.response?.data?.error || "To'lov xizmati vaqtincha ishlamayapti.";
      throw new Error(errorMessage);
    }
  } else {
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: "FAILED" },
    });
    throw new Error("Unsupported payment method");
  }
};

const findLeasesByOwner = async (identifier) => {
  const owner = await prisma.owner.findFirst({
    where: {
      OR: [{ tin: identifier }, { phoneNumber: identifier }],
    },
  });

  if (!owner) {
    throw new Error("Tadbirkor topilmadi.");
  }

  const leases = await prisma.lease.findMany({
    where: {
      ownerId: owner.id,
      isActive: true,
    },
    include: {
      owner: { select: { fullName: true, tin: true, phoneNumber: true } },
      store: { select: { storeNumber: true } },
      transactions: {
        where: { status: { in: ["PAID", "PARTIAL_PAID"] } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // Get current month for attendance counting
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Fetch attendance counts for all stalls in parallel
  const attendanceCounts = await Promise.all(
    leases.map((lease) =>
      lease.stallId
        ? prisma.attendance.count({
          where: {
            stallId: lease.stallId,
            date: {
              gte: new Date(currentYear, currentMonth, 1),
              lt: new Date(currentYear, currentMonth + 1, 1),
            },
          },
        })
        : Promise.resolve(0)
    )
  );

  return leases.map((lease, index) => {
    const attendanceCount = attendanceCounts[index];
    const paymentStatus = calculateLeasePaymentStatus(lease, attendanceCount);
    const expectedAmount = calculateExpectedPayment(lease, attendanceCount);

    return {
      id: lease.id,
      ownerName: lease.owner.fullName,
      ownerStir: lease.owner.tin,
      ownerPhone: lease.owner.phoneNumber,
      storeNumber: lease.store?.storeNumber,
      stallNumber: lease.stall?.stallNumber,
      certificateNumber: lease.certificateNumber,
      issueDate: lease.issueDate,
      expiryDate: lease.expiryDate,
      paymentInterval: lease.paymentInterval,
      expectedAmount,
      paymentStatus,
      shopMonthlyFee: lease.shopMonthlyFee,
      stallMonthlyFee: lease.stallMonthlyFee,
      guardFee: lease.guardFee,
    };
  });
};

const searchPublicLeases = async (term) => {
  if (!term || term.trim() === "") {
    throw new Error("Qidiruv so'zi kiritilishi shart.");
  }

  const searchTerm = term.trim();

  console.log(`[SEARCH] Searching for term: "${searchTerm}"`);

  try {
    // Search for leases based on store number, stall number, or owner name
    const leases = await prisma.lease.findMany({
      where: {
        isActive: true,
        OR: [
          {
            store: {
              storeNumber: {
                contains: searchTerm,
                mode: "insensitive", // Case-insensitive search
              },
            },
          },
          {
            owner: {
              fullName: {
                contains: searchTerm,
                mode: "insensitive",
              },
            },
          },
          {
            certificateNumber: {
              contains: searchTerm,
              mode: "insensitive",
            },
          },
        ],
      },
      include: {
        owner: { select: { fullName: true, tin: true, phoneNumber: true } },
        store: { select: { storeNumber: true } },
        transactions: {
          where: { status: { in: ["PAID", "PARTIAL_PAID"] } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    console.log(`[SEARCH] Found ${leases.length} leases`);

    if (leases.length === 0) {
      return []; // Return empty array instead of throwing error
    }

    // Get current month for attendance counting
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Fetch attendance counts for all stalls in parallel
    const attendanceCounts = await Promise.all(
      leases.map((lease) =>
        lease.stallId
          ? prisma.attendance.count({
            where: {
              stallId: lease.stallId,
              date: {
                gte: new Date(currentYear, currentMonth, 1),
                lt: new Date(currentYear, currentMonth + 1, 1),
              },
            },
          })
          : Promise.resolve(0)
      )
    );

    return leases.map((lease, index) => {
      const attendanceCount = attendanceCounts[index];
      const paymentStatus = calculateLeasePaymentStatus(lease, attendanceCount);
      const expectedAmount = calculateExpectedPayment(lease, attendanceCount);

      return {
        id: lease.id,
        ownerName: lease.owner.fullName,
        ownerStir: lease.owner.tin,
        ownerPhone: lease.owner.phoneNumber,
        storeNumber: lease.store?.storeNumber || null,
        stallNumber: lease.stall?.stallNumber || null,
        certificateNumber: lease.certificateNumber,
        issueDate: lease.issueDate,
        expiryDate: lease.expiryDate,
        paymentInterval: lease.paymentInterval,
        expectedAmount,
        paymentStatus,
        shopMonthlyFee: lease.shopMonthlyFee,
        stallMonthlyFee: lease.stallMonthlyFee,
        guardFee: lease.guardFee,
      };
    });
  } catch (error) {
    console.error(`[SEARCH ERROR] ${error.message}`, error);
    throw new Error(`Qidiruvda xatolik: ${error.message}`);
  }
};

const getCurrentMonthDebt = async (leaseId) => {
  const lease = await prisma.lease.findUnique({
    where: { id: leaseId, isActive: true },
    include: {
      transactions: {
        where: { status: { in: ["PAID", "PARTIAL_PAID"] } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!lease) throw new Error("Faol ijara shartnomasi topilmadi.");

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Get attendance count for current month if lease has a stall
  const attendanceCount = lease.stallId
    ? await prisma.attendance.count({
      where: {
        stallId: lease.stallId,
        date: {
          gte: new Date(currentYear, currentMonth, 1),
          lt: new Date(currentYear, currentMonth + 1, 1),
        },
      },
    })
    : 0;

  const expectedAmount = calculateExpectedPayment(lease, attendanceCount);

  const totalPaidThisMonth = lease.transactions
    .filter((tx) => {
      const txDate = new Date(tx.createdAt);
      return (
        txDate.getFullYear() === currentYear &&
        txDate.getMonth() === currentMonth
      );
    })
    .reduce((sum, tx) => sum + Number(tx.amount), 0);

  const debt = Math.max(expectedAmount - totalPaidThisMonth, 0);

  return {
    expectedAmount,
    paidAmount: totalPaidThisMonth,
    debtAmount: debt,
    paymentStatus:
      debt === 0
        ? "PAID"
        : totalPaidThisMonth > 0
          ? "PARTIALLY_PAID"
          : "UNPAID",
  };
};

// ==================== STALL ATTENDANCE PAYMENT ==================== //

/**
 * Get stall information for payment
 */
const getStallForPayment = async (stallId) => {
  const stall = await prisma.stall.findUnique({
    where: { id: stallId },
    include: {
      Section: true,
      SaleType: true,
    },
  });

  if (!stall) {
    throw new Error("Rasta topilmadi");
  }

  // Check today's attendance
  const today = getUtcDateOnly();

  const todayAttendance = await prisma.attendance.findUnique({
    where: {
      stallId_date: {
        stallId: stall.id,
        date: today,
      },
    },
  });

  return {
    stall,
    todayAttendance,
    alreadyPaid: todayAttendance?.status === "PAID",
  };
};

const initiateStallPayment = async (stallId, payment_method) => {
  const stall = await prisma.stall.findUnique({
    where: { id: stallId },
  });

  if (!stall) {
    throw new Error("Rasta topilmadi");
  }

  if (!stall.dailyFee || Number(stall.dailyFee) <= 0) {
    throw new Error("Ushbu rasta uchun kunlik to'lov miqdori belgilanmagan");
  }

  const today = getUtcDateOnly();

  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      stallId_date: {
        stallId: stall.id,
        date: today,
      },
    },
  });

  if (!existingAttendance) {
    throw new Error("Bugungi kun uchun to'lov uchun attendance topilmadi");
  }

  if (existingAttendance.status === "PAID") {
    throw new Error("Bugungi kun uchun to'lov allaqachon amalga oshirilgan");
  }

  if (existingAttendance.status !== "UNPAID") {
    throw new Error("To'lov holati noto‘g‘ri, faqat UNPAID holatiga ruxsat beriladi");
  }

  const tenantId = process.env.TENANT_ID || "default";
  let finalPaymentMethod = payment_method;

  if (!finalPaymentMethod) {
    finalPaymentMethod = tenantId === "ipak_yuli" ? "PAYME" : "CLICK";
  }

  const amount = Number(stall.dailyFee);
  let checkoutUrl;

  if (finalPaymentMethod === "PAYME") {
    const merchantId = process.env.PAYME_MERCHANT_ID;
    const accountId = `stall_${stallId}_attendance_${existingAttendance.id}`;
    const amountInTiyin = Math.round(amount * 100);

    const params = new URLSearchParams({
      m: merchantId,
      ac: accountId,
      a: amountInTiyin.toString(),
      c: `Rasta ${stall.stallNumber} - ${today.toLocaleDateString()}`,
    });

    checkoutUrl = `https://checkout.paycom.uz/${params.toString()}`;
  } else if (finalPaymentMethod === "CLICK") {
    // Get tenant-specific Click configuration
    if (!clickPaymentService.isClickEnabled(tenantId)) {
      throw new Error(`Click.uz is not available for tenant: ${tenantId}`);
    }

    const config = clickPaymentService.getTenantConfig(tenantId);
    const merchantUserId = existingAttendance.id;
    const merchantTransId = existingAttendance.id;
    const amountFormatted = amount.toFixed(2);

    const frontendUrl = process.env.FRONTEND_URL ||
                        (process.env.MY_DOMAIN ? `https://${process.env.MY_DOMAIN}` : "http://localhost:5173");

    const params = new URLSearchParams({
      service_id: config.serviceId,
      merchant_id: config.merchantId,
      merchant_user_id: merchantUserId.toString(),
      amount: amountFormatted,
      transaction_param: merchantTransId.toString(),
      return_url: `${frontendUrl}/payment/success`,
      card_type: "uzcard",
    });

    checkoutUrl = `https://my.click.uz/services/pay?${params.toString()}`;
  }

  return {
    success: true,
    checkoutUrl,
    attendance: {
      id: existingAttendance.id,
      date: existingAttendance.date,
      amount: existingAttendance.amount,
      status: existingAttendance.status,
    },
    stall: {
      id: stall.id,
      stallNumber: stall.stallNumber,
    },
  };
};


/**
 * Get today's attendance for a stall
 */
const getTodayAttendance = async (stallId) => {
  const today = getUtcDateOnly();

  const attendance = await prisma.attendance.findUnique({
    where: {
      stallId_date: {
        stallId: stallId,
        date: today,
      },
    },
  });

  return {
    attendance: attendance || null,
    hasPaid: attendance?.status === "PAID",
  };
};

module.exports = {
  getLeaseForPayment,
  initiatePayment,
  initiatePaymentWithAllocation,
  findLeasesByOwner,
  searchPublicLeases,
  getCurrentMonthDebt,
  calculateLeasePaymentStatus,
  calculateExpectedPayment,
  getLeasePaymentSummary,
  getStallForPayment,
  initiateStallPayment,
  getTodayAttendance,
};
