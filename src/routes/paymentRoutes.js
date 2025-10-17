const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");

router.post("/find-leases", paymentController.findLeasesByOwner);

router.get("/search", paymentController.searchPublic);

router.get("/lease/:id", paymentController.getLeaseForPayment);

router.post("/initiate", paymentController.initiatePayment);

router.get("/summary/:id", paymentController.getLeasePaymentSummary);

router.get("/debt/:id", paymentController.getCurrentMonthDebt);

module.exports = router;