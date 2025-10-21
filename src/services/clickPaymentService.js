const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class ClickPaymentService {
  constructor() {
    console.log("🔧 ClickPaymentService initialized");
    this.tenantConfig = {
      rizq_baraka: {
        serviceId: "84321",
        merchantId: "46942",
        secretKey: "p1oJkGcWDlLW8a4",
      },
      "muzaffar-savdo": {
        serviceId: "84319",
        merchantId: "46941",
        secretKey: "2vzlHCCdCiPxe",
      },
      istiqlol: {
        serviceId: "84310",
        merchantId: "46933",
        secretKey: "04uTwJvDT56NU",
      },
      bogdod: {
        serviceId: "84296",
        merchantId: "46927",
        secretKey: "Oq0fcQlqniz",
      },
      "beshariq-turon": {
        serviceId: "84316",
        merchantId: "46938",
        secretKey: "3f1RCN3QJvSVR",
      },
      beshariq: {
        serviceId: "84272",
        merchantId: "46913",
        secretKey: "OFuFke5FvD3Bg",
      },
    };
  }

  isClickEnabled(tenantId) {
    const enabled =
      tenantId !== "ipak_yuli" && this.tenantConfig.hasOwnProperty(tenantId);
    console.log(`[INFO] isClickEnabled(${tenantId}) → ${enabled}`);
    return enabled;
  }

  getTenantConfig(tenantId) {
    console.log(`[INFO] getTenantConfig(${tenantId})`);
    if (!this.isClickEnabled(tenantId))
      throw new Error(`Click.uz not enabled for tenant: ${tenantId}`);
    const config = this.tenantConfig[tenantId];
    if (!config)
      throw new Error(`Click.uz config not found for tenant: ${tenantId}`);
    return config;
  }

  generateSignature(params, secretKey) {
    const signString =
      params.click_trans_id +
      params.service_id +
      secretKey +
      params.merchant_trans_id +
      (params.merchant_prepare_id || "") +
      params.amount +
      params.action +
      params.sign_time;

    const hash = crypto.createHash("md5").update(signString).digest("hex");
    console.log("[SIGNATURE] Generated hash:", hash);
    return hash;
  }

  verifySignature(params, secretKey) {
    const hash = this.generateSignature(params, secretKey);
    const match = hash === params.sign_string;
    console.log(`[SIGNATURE] Verification → ${match}`);
    if (!match)
      console.log(
        "[SIGNATURE] Expected:",
        hash,
        "Received:",
        params.sign_string
      );
    return match;
  }

  generatePaymentUrl(transactionId, amount, tenantId) {
    const config = this.getTenantConfig(tenantId);
    const url = `https://my.click.uz/services/pay?service_id=${config.serviceId}&merchant_id=${config.merchantId}&amount=${amount}&transaction_param=${transactionId}`;
    console.log("[INFO] Payment URL generated:", url);
    return url;
  }

  async handlePrepare(clickData) {
    console.log("\n🔍 [CLICK PREPARE] Request received", clickData);
    const {
      click_trans_id,
      service_id,
      click_paydoc_id,
      merchant_trans_id,
      amount,
      action,
      sign_time,
    } = clickData;

    try {
      const tenantId = process.env.TENANT_ID;
      console.log(`[INFO] Tenant: ${tenantId}`);
      if (!this.isClickEnabled(tenantId))
        return {
          click_trans_id,
          merchant_trans_id,
          error: -3,
          error_note: "Click not enabled",
        };

      const config = this.getTenantConfig(tenantId);
      if (!this.verifySignature(clickData, config.secretKey))
        return {
          click_trans_id,
          merchant_trans_id,
          error: -1,
          error_note: "SIGN CHECK FAILED",
        };

      // Try monthly transaction first
      let transaction = await prisma.transaction.findFirst({
        where: { id: parseInt(merchant_trans_id), status: "PENDING" },
        include: { lease: true },
      });
      let isDaily = false;

      if (!transaction) {
        // Daily payment → lookup attendance by attendance ID
        console.log(
          "[INFO] Treating merchant_trans_id as attendance ID for daily payment"
        );
        const attendanceId = parseInt(merchant_trans_id, 10);

        const attendance = await prisma.attendance.findUnique({
          where: { id: attendanceId },
        });

        if (!attendance || attendance.status === "PAID")
          return {
            click_trans_id,
            merchant_trans_id,
            error: -5,
            error_note: attendance ? "Already paid" : "Attendance not found",
          };

        transaction = attendance;
        isDaily = true;
      }

      console.log(
        `[INFO] Amount verification: expected=${
          transaction.amount || 0
        }, received=${amount}`
      );
      if (parseFloat(amount) !== parseFloat(transaction.amount || 0))
        return {
          click_trans_id,
          merchant_trans_id,
          error: -2,
          error_note: "Incorrect amount",
        };

      // Check duplicate click
      const existingClick = await prisma.clickTransaction.findUnique({
        where: { clickTransId: click_trans_id },
      });
      if (existingClick)
        return {
          click_trans_id,
          merchant_trans_id,
          error: -4,
          error_note: "Duplicate transaction",
        };

      const clickTransaction = await prisma.clickTransaction.create({
        data: {
          clickTransId: click_trans_id,
          clickPaydocId: click_paydoc_id,
          merchantTransId: merchant_trans_id,
          amount: parseFloat(amount),
          action: parseInt(action),
          signTime: new Date(sign_time),
          status: 0,
          error: 0,
        },
      });

      const merchant_prepare_id = clickTransaction.id;
      const responseSignature = this.generateSignature(
        {
          click_trans_id,
          service_id,
          merchant_trans_id,
          merchant_prepare_id: merchant_prepare_id.toString(),
          amount,
          action,
          sign_time,
        },
        config.secretKey
      );

      console.log("[INFO] PREPARE successful");
      return {
        click_trans_id,
        merchant_trans_id,
        merchant_prepare_id,
        error: 0,
        error_note: "Success",
        sign_string: responseSignature,
      };
    } catch (err) {
      console.error("[ERROR] PREPARE failed:", err);
      return {
        click_trans_id: clickData.click_trans_id,
        merchant_trans_id: clickData.merchant_trans_id,
        error: -8,
        error_note: "System error",
      };
    }
  }

  async handleComplete(clickData) {
    console.log("\n✅ [CLICK COMPLETE] Request received", clickData);
    const {
      click_trans_id,
      service_id,
      merchant_trans_id,
      merchant_prepare_id,
      amount,
      action,
      sign_time,
      error,
    } = clickData;

    try {
      const tenantId = process.env.TENANT_ID;
      const config = this.getTenantConfig(tenantId);
      if (!this.verifySignature(clickData, config.secretKey))
        return {
          click_trans_id,
          merchant_trans_id,
          merchant_prepare_id,
          error: -1,
          error_note: "SIGN CHECK FAILED",
        };

      const prepareTransaction = await prisma.clickTransaction.findFirst({
        where: {
          id: parseInt(merchant_prepare_id),
          clickTransId: click_trans_id,
        },
      });
      if (!prepareTransaction)
        return {
          click_trans_id,
          merchant_trans_id,
          merchant_prepare_id,
          error: -6,
          error_note: "Transaction not found",
        };

      if (prepareTransaction.status === 1) {
        const responseSignature = this.generateSignature(
          {
            click_trans_id,
            service_id,
            merchant_trans_id,
            merchant_prepare_id: merchant_prepare_id.toString(),
            amount,
            action,
            sign_time,
          },
          config.secretKey
        );
        console.log("[INFO] Already completed");
        return {
          click_trans_id,
          merchant_trans_id,
          merchant_prepare_id,
          error: -4,
          error_note: "Already paid",
          sign_string: responseSignature,
        };
      }

      if (error < 0) {
        await prisma.clickTransaction.update({
          where: { id: parseInt(merchant_prepare_id) },
          data: {
            status: -1,
            error: parseInt(error),
            errorNote: "Payment cancelled",
          },
        });
        console.log("[INFO] Payment cancelled by user");
        return {
          click_trans_id,
          merchant_trans_id,
          merchant_prepare_id,
          error: 0,
          error_note: "Success",
        };
      }

      // Determine daily or monthly
      const isDaily = !(await prisma.transaction.findUnique({
        where: { id: parseInt(merchant_trans_id) },
      }));
      if (isDaily) {
        console.log(
          "[INFO] Completing daily payment → marking attendance PAID"
        );
        const attendanceId = parseInt(merchant_trans_id, 10);
        await prisma.attendance.update({
          where: { id: attendanceId },
          data: {
            status: "PAID",
            transactionId: click_trans_id,
          },
        });
      } else {
        console.log(
          "[INFO] Completing monthly payment → marking transaction PAID"
        );
        await prisma.transaction.update({
          where: { id: parseInt(merchant_trans_id) },
          data: {
            status: "PAID",
            paymentMethod: "CLICK",
            paymeTransactionId: click_trans_id,
          },
        });
      }

      await prisma.clickTransaction.update({
        where: { id: parseInt(merchant_prepare_id) },
        data: {
          status: 1,
          action: parseInt(action),
          error: 0,
          errorNote: "Success",
        },
      });
      const responseSignature = this.generateSignature(
        {
          click_trans_id,
          service_id,
          merchant_trans_id,
          merchant_prepare_id: merchant_prepare_id.toString(),
          amount,
          action,
          sign_time,
        },
        config.secretKey
      );
      console.log("[INFO] COMPLETE successful");

      return {
        click_trans_id,
        merchant_trans_id,
        merchant_prepare_id,
        error: 0,
        error_note: "Success",
        sign_string: responseSignature,
      };
    } catch (err) {
      console.error("[ERROR] COMPLETE failed:", err);
      return {
        click_trans_id,
        merchant_trans_id,
        merchant_prepare_id,
        error: -8,
        error_note: "System error",
      };
    }
  }
}

module.exports = new ClickPaymentService();
