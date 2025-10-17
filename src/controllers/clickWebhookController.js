// --- UNIFIED CLICK WEBHOOK CONTROLLER ---

const clickPaymentService = require("../services/clickPaymentService");
const axios = require("axios");

const handleClickWebhook = async (req, res) => {
  const tenantId = process.env.TENANT_ID;

  console.log("\n" + "=".repeat(60));
  console.log(`📥 [WORKER] Webhook Received for tenant: ${tenantId}`);

  // --- PROXY LOGIC ---
  // If this instance is the main 'ipak_yuli' app, it acts as the proxy.
  if (tenantId === "ipak_yuli") {
    console.log(tenantId);

    console.log("\n" + "=".repeat(60));
    console.log(`📥 [PROXY] Webhook Received on myrent.uz`);
    console.log("Service ID:", req.body.service_id);

    const serviceIdToBackend = {
      84321: { port: 3003, name: "rizq_baraka" },
      84319: { port: 3004, name: "muzaffar-savdo" },
      84310: { port: 3005, name: "istiqlol" },
      84296: { port: 3006, name: "bogdod" },
      84316: { port: 3007, name: "beshariq-turon" },
      84272: { port: 3009, name: "beshariq" },
    };

    const backend = serviceIdToBackend[req.body.service_id];

    if (backend) {
      console.log(`→ Forwarding to ${backend.name} on port ${backend.port}...`);
      try {
        const response = await axios.post(
          `http://localhost:${backend.port}/api/payments/webhook/click`,
          req.body,
          { headers: { "Content-Type": "application/json" }, timeout: 15000 }
        );
        console.log(`✅ [PROXY] ${backend.name} responded successfully.`);
        return res.json(response.data);
      } catch (error) {
        console.error(
          `❌ [PROXY] Forward to ${backend.name} failed:`,
          error.message
        );
        return res.json({
          click_trans_id: req.body.click_trans_id,
          merchant_trans_id: req.body.merchant_trans_id,
          error: -8,
          error_note: "System error during forward",
        });
      }
    } else {
      console.log(
        "❌ [PROXY] Unknown service_id. This service does not use Click."
      );
      return res.json({
        click_trans_id: req.body.click_trans_id,
        merchant_trans_id: req.body.merchant_trans_id,
        error: -3,
        error_note: "Service not found",
      });
    }
  }

  // --- WORKER LOGIC ---
  // If this instance is ANY OTHER tenant, it acts as the worker.
  else {
    console.log("\n" + "=".repeat(60));
    console.log(`📥 [WORKER] Webhook Received for tenant: ${tenantId}`);

    const action = parseInt(req.body.action, 10);
    let response;
    try {
      if (action === 0) {
        response = await clickPaymentService.handlePrepare(req.body);
      } else if (action === 1) {
        console.log(req.body);
        response = await clickPaymentService.handleComplete(req.body);
      } else {
        response = { error: -3, error_note: "Action not found" };
      }
    } catch (error) {
      console.error(`❌ [WORKER] Error on tenant ${tenantId}:`, error);
      response = { error: -8, error_note: "System error" };
    }
    console.log(
      "📤 [WORKER] Sending Response:",
      JSON.stringify(response, null, 2)
    );
    console.log("=".repeat(60) + "\n");
    return res.json(response);
  }
};

module.exports = {
  handleClickWebhook,
};
