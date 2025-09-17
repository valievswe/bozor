const express = require("express");
const router = express.Router();
const webhookController = require("../controllers/webhookController");

router.post("/update-status", webhookController.updateStatus);

module.exports = router;
