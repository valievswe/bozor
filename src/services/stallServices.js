const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();

const createStall = async (stallData) => {
  const { stallNumber, area, description, sectionId, saleTypeId } = stallData;

  if (stallNumber) {
    const existingStall = await prisma.stall.findUnique({
      where: { stallNumber },
    });
    if (existingStall)
      throw new Error(`'${stallNumber}' raqamli rasta allaqachon mavjud.`);
  }

  if (sectionId) {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
    });
    if (!section) throw new Error("Bu pavilion yoki qator topilmadi.");
  }

  let saleType;
  if (saleTypeId) {
    saleType = await prisma.saleType.findUnique({ where: { id: saleTypeId } });
    if (!saleType) throw new Error("Berilgan savdo turi topilmadi.");
  }

  const stall = await prisma.stall.create({
    data: {
      stallNumber,
      area,
      description,
      sectionId,
      saleTypeId,
    },
  });

  const payment_url = `https://my.click.uz/services/pay?service_id=${
    process.env.PAYMENT_SERVICE_ID
  }&merchant_id=${process.env.PAYMENT_MERCHANT_ID}&amount=${
    area * (saleType?.tax || 1)
  }&transaction_param=${stall.id}`;

  const qrFilename = `${uuidv4()}.png`;
  const qrFolder = path.join(__dirname, "../public/qrcodes");
  if (!fs.existsSync(qrFolder)) fs.mkdirSync(qrFolder, { recursive: true });
  const qrPath = path.join(qrFolder, qrFilename);

  await QRCode.toFile(qrPath, payment_url, {
    type: "png",
    width: 300,
    margin: 2,
  });
  console.log("[INFO] QR code generated at:", qrPath);

  const updatedStall = await prisma.stall.update({
    where: { id: stall.id },
    data: {
      payment_url,
      paymentQR: qrPath,
    },
  });

  return updatedStall;
};

const getAllStalls = async (searchTerm) => {
  const whereClause = searchTerm
    ? {
        OR: [
          { stallNumber: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } },
        ],
      }
    : {};

  const stalls = await prisma.stall.findMany({
    where: whereClause,
    orderBy: { id: "asc" },
    include: {
      Section: true,
      saleType: true,
      _count: {
        select: {
          attendances: true,
        },
      },
    },
  });

  return stalls.map((stall) => ({
    ...stall,
    attendanceCount: stall._count.attendances,
    _count: undefined,
  }));
};

const getStallById = async (id) => {
  const stall = await prisma.stall.findUnique({
    where: { id: Number(id) },
    include: {
      Section: true,
      saleType: true,
      attendances: true,
    },
  });

  if (!stall) throw new Error("Rasta topilmadi.");
  return stall;
};

const updateStall = async (id, updateData) => {
  const stallId = Number(id);
  const existingStall = await prisma.stall.findUnique({
    where: { id: stallId },
  });
  if (!existingStall) throw new Error("Rasta topilmadi.");

  if (updateData.stallNumber) {
    const duplicate = await prisma.stall.findFirst({
      where: {
        stallNumber: updateData.stallNumber,
        id: { not: stallId },
      },
    });
    if (duplicate) {
      throw new Error(
        `'${updateData.stallNumber}' raqamli rasta allaqachon mavjud.`
      );
    }
  }

  if (updateData.sectionId) {
    const section = await prisma.section.findUnique({
      where: { id: updateData.sectionId },
    });
    if (!section) throw new Error("Bu pavilion yoki qator topilmadi.");
  }

  if (updateData.saleTypeId) {
    const saleType = await prisma.saleType.findUnique({
      where: { id: updateData.saleTypeId },
    });
    if (!saleType) throw new Error("Berilgan savdo turi topilmadi.");
  }

  return prisma.stall.update({
    where: { id: stallId },
    data: updateData,
  });
};

const deleteStall = async (id) => {
  const stallId = Number(id);

  const attendanceCount = await prisma.attendance.count({
    where: { stallId },
  });

  if (attendanceCount > 0) {
    throw new Error(
      "Bu rastani o‘chirib bo‘lmaydi. Unga tegishli attendance yozuvlari mavjud."
    );
  }

  return prisma.stall.delete({
    where: { id: stallId },
  });
};

module.exports = {
  createStall,
  getAllStalls,
  getStallById,
  updateStall,
  deleteStall,
};
