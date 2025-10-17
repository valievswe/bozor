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
    // --- THIS IS THE FIX ---
    // 1. Destructure the 'provider' field from the request body.
    const { leaseId, amount, provider } = req.body;
    
    // 2. Add 'provider' to the validation check.
    if (!leaseId || !amount || !provider) {
      return res.status(400).json({ message: "Lease ID, amount, and provider are required" });
    }
    
    // 3. Pass all THREE arguments to the service function.
    const result = await paymentService.initiatePayment(leaseId, amount, provider);
    // --- END OF FIX ---
    
    res.status(200).json(result);
  } catch (error) {
    // Forward the specific error message from the service
    res.status(400).json({ message: "Payment initiation failed", error: error.message });
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
