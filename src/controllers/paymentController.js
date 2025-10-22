
const paymentService = require("../services/paymentService");




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


const initiatePayment = async (req, res) => {
  try {
    console.log("\n" + "=".repeat(60));
    console.log("💳 [PAYMENT REQUEST RECEIVED]");
    console.log("Tenant:", process.env.TENANT_ID);
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log("=".repeat(60));

    
    const { leaseId, amount, payment_method } = req.body;

    
    if (!leaseId || !amount) {
      return res.status(400).json({
        success: false,
        message: "Lease ID and amount are required",
      });
    }

    
    
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




const getStallForPayment = async (req, res) => {
  try {
    const stallId = parseInt(req.params.id, 10);
    if (isNaN(stallId)) {
      return res.status(400).json({ message: "Invalid stall ID" });
    }

    const stallInfo = await paymentService.getStallForPayment(stallId);
    res.status(200).json(stallInfo);
  } catch (error) {
    res
      .status(404)
      .json({ message: "Stall not found", error: error.message });
  }
};


const initiateStallPayment = async (req, res) => {
  try {
    const stallId = parseInt(req.params.id, 10);
    if (isNaN(stallId)) {
      return res.status(400).json({ message: "Invalid stall ID" });
    }

    const { payment_method } = req.body;

    const result = await paymentService.initiateStallPayment(
      stallId,
      payment_method
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message || "Failed to initiate stall payment",
    });
  }
};


const getTodayAttendance = async (req, res) => {
  try {
    const stallId = parseInt(req.params.id, 10);
    if (isNaN(stallId)) {
      return res.status(400).json({ message: "Invalid stall ID" });
    }

    const attendance = await paymentService.getTodayAttendance(stallId);
    res.status(200).json(attendance);
  } catch (error) {
    res.status(404).json({
      message: "Unable to fetch attendance",
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
  getStallForPayment,
  initiateStallPayment,
  getTodayAttendance,
};
