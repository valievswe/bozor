const webhookService = require("../services/webhookService");

const updateStatus = async (req, res) => {
  console.log(`--- [WEBHOOK RECEIVED] ---`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Source IP: ${req.ip}`);
  console.log(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
  console.log(`Body: ${JSON.stringify(req.body, null, 2)}`);
  console.log(`--------------------------`);

  const receivedSecret = req.headers["x-webhook-secret"];
  const expectedSecret = process.env.WEBHOOK_SECRET_KEY;

  if (!receivedSecret || receivedSecret !== expectedSecret) {
    console.warn(
      "  -> SECURITY CHECK FAILED: Invalid or missing secret key. Denying access."
    );
    return res.status(403).json({ error: "Invalid secret key." });
  }
  console.log("  -> SECURITY CHECK PASSED.");

  try {
    const result = await webhookService.updatePaymentStatus(req.body);
    console.log("  -> WEBHOOK PROCESSED SUCCESSFULLY.");
    res.status(200).json(result);
  } catch (error) {
    console.error("  -> ERROR PROCESSING WEBHOOK:", error.message);
    res.status(400).json({ error: error.message });
  }
  console.log(`--- [WEBHOOK FINISHED] ---`);
};

module.exports = {
  updateStatus,
};
