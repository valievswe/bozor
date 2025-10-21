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

    return crypto.createHash("md5").update(signString).digest("hex");
  }

  verifySignature(params, secretKey) {
    const hash = this.generateSignature(params, secretKey);
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
    try {
      const tenantId = process.env.TENANT_ID;
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

      let transaction = await prisma.transaction.findFirst({
        where: { id: parseInt(merchant_trans_id), status: "PENDING" },
      });
      let isDaily = false;

      if (!transaction) {
        const attendanceId = parseInt(merchant_trans_id);
        let attendance = await prisma.attendance.findUnique({
          where: { id: attendanceId },
        });

        if (!attendance) {
          const stall = await prisma.stall.findUnique({
            where: { id: attendanceId },
          });
          if (!stall)
            return {
              click_trans_id,
              merchant_trans_id,
              error: -5,
              error_note: "Attendance or Stall not found",
            };

          attendance = await prisma.attendance.findFirst({
            where: { stallId: stall.id, date: new Date() },
          });
          if (!attendance || attendance.status === "PAID")
            return {
              click_trans_id,
              merchant_trans_id,
              error: -5,
              error_note: attendance ? "Already paid" : "Attendance not found",
            };
        }

        transaction = attendance;
        isDaily = true;
      }

      if (parseFloat(amount) !== parseFloat(transaction.amount || 0))
        return {
          click_trans_id,
          merchant_trans_id,
          error: -2,
          error_note: "Incorrect amount",
        };

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
        return {
          click_trans_id,
          merchant_trans_id,
          merchant_prepare_id,
          error: 0,
          error_note: "Success",
        };
      }

      let transaction = await prisma.transaction.findUnique({
        where: { id: parseInt(merchant_trans_id) },
      });
      const isDaily = !transaction;

      if (isDaily) {
        await prisma.attendance.update({
          where: { id: parseInt(merchant_trans_id) },
          data: { status: "PAID", transactionId: click_trans_id },
        });
      } else {
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
        data: { status: 1 },
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

  async close() {
    await prisma.$disconnect();
  }
}

module.exports = new ClickPaymentService();
