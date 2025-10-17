const clickPaymentService = require("../services/clickPaymentService");

const handleClickWebhook = async (req, res) => {
  console.log("\n" + "=".repeat(60));
  console.log("📥 [CLICK WEBHOOK] Received");
  console.log("Tenant:", process.env.TENANT_ID);
  console.log("Time:", new Date().toISOString());
  console.log("Body:", JSON.stringify(req.body, null, 2));
  console.log("=".repeat(60));

  // Reject if ipak_yuli tries to use Click webhook
  if (process.env.TENANT_ID === "ipak_yuli") {
    console.log("❌ Click webhook called for ipak_yuli - rejected");
    return res.status(403).json({
      error: -3,
      error_note: "Click.uz not available for this tenant",
    });
  }

  const { action } = req.body;
  let response;

  try {
    if (action === 0) {
      response = await clickPaymentService.handlePrepare(req.body);
    } else if (action === 1) {
      response = await clickPaymentService.handleComplete(req.body);
    } else {
      response = {
        error: -3,
        error_note: "Action not found",
      };
    }
  } catch (error) {
    console.error("❌ Webhook error:", error);
    response = {
      error: -8,
      error_note: "System error",
    };
  }

  console.log("📤 [CLICK RESPONSE]:", JSON.stringify(response, null, 2));
  console.log("=".repeat(60) + "\n");

  return res.json(response);
};

module.exports = {
  handleClickWebhook,
};
