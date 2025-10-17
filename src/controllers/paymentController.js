// src/controllers/paymentController.js
const paymentService = require("../services/paymentService");

// --- PUBLIC FUNCTIONS ---
const getLeaseForPayment = async (req, res) => {
  try {
    const leaseInfo = await paymentService.getLeaseForPayment(
      parseInt(req.params.id, 10)
    );
    res.status(200).json(leaseInfo);
  } catch (error) {
    res
      .status(404)
      .json({ message: "Lease not found or not active", error: error.message });
  }
};

const initiatePayment = async (req, res) => {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("💳 [PAYMENT REQUEST RECEIVED]");
    console.log("Tenant:", process.env.TENANT_ID);
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log("=".repeat(60));

    // Extract fields - payment_method is now optional (auto-selects based on tenant)
    const { leaseId, amount, payment_method } = req.body;

    // Validate required fields
    if (!leaseId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Lease ID and amount are required",
      });
    }

    // Call service with optional payment_method
    // If not provided, it will auto-select: ipak_yuli -> PAYME, others -> CLICK
    const result = await paymentService.initiatePayment(
      leaseId,
      amount,
      payment_method
    );

    console.log("✅ Payment initiated:", result.provider);
    console.log("Transaction ID:", result.transactionId);
    console.log("=".repeat(60) + "\n");

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("❌ Payment initiation failed:", error.message);
    console.error("=".repeat(60) + "\n");

    res.status(400).json({
      success: false,
      message: "Payment initiation failed",
      error: error.message,
    });
  }
};

const findLeasesByOwner = async (req, res) => {
  try {
    const { identifier } = req.body;
    const leases = await paymentService.findLeasesByOwner(identifier);
    res.status(200).json(leases);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

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

module.exports = {
  getLeaseForPayment,
  initiatePayment,
  findLeasesByOwner,
  searchPublic,
};
