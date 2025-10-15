// src/controllers/paymentController.js
const paymentService = require("../services/paymentService");

// --- PUBLIC FUNCTIONS ---

// 1️⃣ Faol lease ma’lumotini olish
const getLeaseForPayment = async (req, res) => {
  try {
    const leaseId = parseInt(req.params.id, 10);
    if (isNaN(leaseId)) {
      return res.status(400).json({ message: "Invalid lease ID" });
    }

    const leaseInfo = await paymentService.getLeaseForPayment(leaseId);
    res.status(200).json(leaseInfo);
  } catch (error) {
    res
      .status(404)
      .json({ message: "Lease not found or not active", error: error.message });
  }
};

// 2️⃣ To‘lovni boshlash (bo‘lib to‘lash qo‘shilgan)
const initiatePayment = async (req, res) => {
  try {
    const { leaseId, amount, payment_method } = req.body;
    if (!leaseId || !amount) {
      return res
        .status(400)
        .json({ message: "Lease ID and amount are required" });
    }

    const result = await paymentService.initiatePayment(
      leaseId,
      amount,
      payment_method
    );

    res.status(200).json(result);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Payment initiation failed", error: error.message });
  }
};

// 3️⃣ Tadbirkor bo‘yicha lease’larni topish
const findLeasesByOwner = async (req, res) => {
  try {
    const { identifier } = req.body;
    if (!identifier) {
      return res
        .status(400)
        .json({ message: "STIR yoki telefon raqami kiritilishi shart" });
    }

    const leases = await paymentService.findLeasesByOwner(identifier);
    res.status(200).json(leases);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// 4️⃣ Public qidiruv
const searchPublic = async (req, res) => {
  try {
    const { term } = req.query;
    const leases = await paymentService.searchPublicLeases(term);
    res.status(200).json(leases);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Qidiruvda xatolik yuz berdi.", error: error.message });
  }
};

// 5️⃣ Oyma-oy to‘lov va qarz hisoboti
const getLeasePaymentSummary = async (req, res) => {
  try {
    const leaseId = parseInt(req.params.id, 10);
    if (isNaN(leaseId)) {
      return res.status(400).json({ message: "Invalid lease ID" });
    }

    const summary = await paymentService.getLeasePaymentSummary(leaseId);
    res.status(200).json(summary);
  } catch (error) {
    res
      .status(404)
      .json({ message: "Lease not found or not active", error: error.message });
  }
};

const getCurrentMonthDebt = async (req, res) => {
  try {
    const leaseId = parseInt(req.params.id, 10);
    if (isNaN(leaseId)) {
      return res.status(400).json({ message: "Invalid lease ID" });
    }

    const debtInfo = await paymentService.getCurrentMonthDebt(leaseId);
    res.status(200).json(debtInfo);
  } catch (error) {
    res.status(404).json({
      message: "Unable to fetch current month debt",
      error: error.message,
    });
  }
};

module.exports = {
  getLeaseForPayment,
  initiatePayment,
  findLeasesByOwner,
  searchPublic,
  getLeasePaymentSummary,
  getCurrentMonthDebt,
};
