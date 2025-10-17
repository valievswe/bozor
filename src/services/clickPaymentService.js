const crypto = require("crypto");
const { PrismaClient, Prisma } = require("@prisma/client");
const prisma = new PrismaClient();

class ClickPaymentService {
  constructor() {
    // Click.uz configuration ONLY for tenants that use Click
    // ipak_yuli is NOT included - it uses Payme
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
    // ipak_yuli uses Payme only, not Click
    return (
      tenantId !== "ipak_yuli" && this.tenantConfig.hasOwnProperty(tenantId)
    );
  }

  getTenantConfig(tenantId) {
    if (!this.isClickEnabled(tenantId)) {
      throw new Error(`Click.uz is not enabled for tenant: ${tenantId}`);
    }
    const config = this.tenantConfig[tenantId];
    if (!config) {
      throw new Error(
        `Click.uz configuration not found for tenant: ${tenantId}`
      );
    }
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

    return crypto.createHash("md5").update(signString).digest("hex");
  }

  verifySignature(params, secretKey) {
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
    return hash === params.sign_string;
  }

  generatePaymentUrl(transactionId, amount, tenantId) {
    const config = this.getTenantConfig(tenantId);
    return `https://my.click.uz/services/pay?service_id=${config.serviceId}&merchant_id=${config.merchantId}&amount=${amount}&transaction_param=${transactionId}`;
  }

  async handlePrepare(clickData) {
    const {
      click_trans_id,
      service_id,
      click_paydoc_id,
      merchant_trans_id,
      amount,
      action,
      sign_time,
    } = clickData;

    console.log("\n🔍 [CLICK PREPARE] Request received");
    console.log("Service ID:", service_id);
    console.log("Transaction ID:", merchant_trans_id);
    console.log("Amount:", amount);

    try {
      const transaction = await prisma.transaction.findFirst({
        where: {
          id: parseInt(merchant_trans_id, 10),
          status: "PENDING",
        },
        include: {
          lease: {
            include: {
              owner: true,
              store: true,
              stall: true,
            },
          },
        },
      });

      if (!transaction) {
        console.log("❌ Transaction not found");
        return {
          click_trans_id,
          merchant_trans_id,
          error: -5,
          error_note: "Transaction not found",
        };
      }

      const tenantId = process.env.TENANT_ID;

      if (!this.isClickEnabled(tenantId)) {
        console.log("❌ Click not enabled for this tenant");
        return {
          click_trans_id,
          merchant_trans_id,
          error: -3,
          error_note: "Click not enabled for this merchant",
        };
      }

      const config = this.getTenantConfig(tenantId);

      if (service_id !== config.serviceId) {
        console.log("❌ Service ID mismatch");
        return {
          click_trans_id,
          merchant_trans_id,
          error: -3,
          error_note: "Service ID mismatch",
        };
      }

      if (!this.verifySignature(clickData, config.secretKey)) {
        console.log("❌ Signature verification failed");
        return {
          click_trans_id,
          merchant_trans_id,
          error: -1,
          error_note: "SIGN CHECK FAILED",
        };
      }

      if (parseFloat(amount) !== parseFloat(transaction.amount)) {
        console.log("❌ Amount mismatch");
        return {
          click_trans_id,
          merchant_trans_id,
          error: -2,
          error_note: "Incorrect amount",
        };
      }

      const existingClick = await prisma.clickTransaction.findUnique({
        where: { clickTransId: click_trans_id },
      });

      if (existingClick) {
        console.log("❌ Duplicate transaction");
        return {
          click_trans_id,
          merchant_trans_id,
          error: -4,
          error_note: "Transaction already exists",
        };
      }

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

      console.log("✅ PREPARE successful for tenant:", tenantId);

      return {
        click_trans_id,
        merchant_trans_id,
        merchant_prepare_id,
        error: 0,
        error_note: "Success",
        sign_string: responseSignature,
      };
    } catch (error) {
      console.error("❌ PREPARE error:", error);
      return {
        click_trans_id,
        merchant_trans_id,
        error: -8,
        error_note: "System error",
      };
    }
  }

  async handleComplete(clickData) {
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

    console.log("\n✅ [CLICK COMPLETE] Request received");
    console.log("Service ID:", service_id);
    console.log("Transaction ID:", merchant_trans_id);

    try {
      const tenantId = process.env.TENANT_ID;
      const config = this.getTenantConfig(tenantId);

      if (!this.verifySignature(clickData, config.secretKey)) {
        console.log("❌ Signature verification failed");
        return {
          click_trans_id,
          merchant_trans_id,
          merchant_prepare_id,
          error: -1,
          error_note: "SIGN CHECK FAILED",
        };
      }

      const prepareTransaction = await prisma.clickTransaction.findFirst({
        where: {
          id: parseInt(merchant_prepare_id),
          clickTransId: click_trans_id,
        },
      });

      if (!prepareTransaction) {
        console.log("❌ Prepare transaction not found");
        return {
          click_trans_id,
          merchant_trans_id,
          merchant_prepare_id,
          error: -6,
          error_note: "Transaction not found",
        };
      }

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

        console.log("⚠️ Already completed");
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

        console.log("⚠️ Payment cancelled by user");
        return {
          click_trans_id,
          merchant_trans_id,
          merchant_prepare_id,
          error: 0,
          error_note: "Success",
        };
      }

      await prisma.$transaction(async (tx) => {
        await tx.clickTransaction.update({
          where: { id: parseInt(merchant_prepare_id) },
          data: {
            status: 1,
            action: parseInt(action),
            error: 0,
            errorNote: "Success",
          },
        });

        await tx.transaction.update({
          where: { id: parseInt(merchant_trans_id) },
          data: {
            status: "PAID",
            paymentMethod: "CLICK",
            paymeTransactionId: click_trans_id,
          },
        });
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

      console.log("✅ COMPLETE successful - Payment marked as PAID");

      return {
        click_trans_id,
        merchant_trans_id,
        merchant_prepare_id,
        error: 0,
        error_note: "Success",
        sign_string: responseSignature,
      };
    } catch (error) {
      console.error("❌ COMPLETE error:", error);
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
