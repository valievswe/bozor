const webhookService = require("../services/webhookService");

const updateStatus = async (req, res) => {
  // --- CRITICAL SECURITY CHECK ---
  const receivedSecret = req.headers["x-webhook-secret"];
  const expectedSecret = process.env.WEBHOOK_SECRET_KEY;

  if (!receivedSecret || receivedSecret !== expectedSecret) {
    console.warn(
      "Webhook received with invalid or missing secret key. Denying access."
    );

    return res.status(403).json({ error: "Invalid secret key." });
  }

  try {
    console.log("Received payment status update webhook:", req.body);
    const result = await webhookService.updatePaymentStatus(req.body);

    res.status(200).json(result);
  } catch (error) {
    console.error("Error processing webhook:", error.message);

    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  updateStatus,
};
