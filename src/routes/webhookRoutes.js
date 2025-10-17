const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");
const clickWebhookController = require("../controllers/clickWebhookController");

// Payme webhook (for ipak_yuli only)
router.post("/update-status", webhookController.updateStatus);

// Click.uz webhook (for all other tenants)
// This will be accessible at: /api/payments/webhook/click
router.post("/click", clickWebhookController.handleClickWebhook);

module.exports = router;
