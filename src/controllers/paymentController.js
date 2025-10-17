// controllers/paymentController.js
const paymentService = require("../services/paymentService");

exports.findLeasesByOwner = async (req, res) => {
  try {
    const { identifier } = req.body;
    const leases = await paymentService.findLeasesByOwner(identifier);
    res.json({ success: true, data: leases });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.searchPublic = async (req, res) => {
  try {
    const { term } = req.query;
    const leases = await paymentService.searchPublicLeases(term || "");
    res.json({ success: true, data: leases });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getLeaseForPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const lease = await paymentService.getLeaseForPayment(parseInt(id));
    res.json({ success: true, data: lease });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.initiatePayment = async (req, res) => {
  try {
    const { leaseId, amount, paymentMethod } = req.body;
    const payment = await paymentService.initiatePayment(
      parseInt(leaseId),
      Number(amount),
      paymentMethod || "CLICK"
    );
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getLeasePaymentSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const summary = await paymentService.getLeasePaymentSummary(parseInt(id));
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getCurrentMonthDebt = async (req, res) => {
  try {
    const { id } = req.params;
    const debt = await paymentService.getCurrentMonthDebt(parseInt(id));
    res.json({ success: true, data: debt });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
