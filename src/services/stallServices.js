const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { v4: uuidv4 } = require("uuid");

class StallService {
  async create(data) {
    let { stallNumber, area, description, sectionId, saleTypeId } = data;

    let sectionCode = "";
    if (sectionId) {
      const section = await prisma.section.findUnique({
        where: { id: sectionId },
      });
      if (!section) throw new Error("Bu pavilion yoki qator topilmadi.");
      sectionCode = `S${sectionId}`;
    }

    if (!saleTypeId) throw new Error("Sale type kerak.");
    const saleType = await prisma.saleType.findUnique({
      where: { id: saleTypeId },
    });
    if (!saleType) throw new Error("Berilgan savdo turi topilmadi.");

    if (!stallNumber) {
      const uniquePart = uuidv4().split("-")[0];
      stallNumber = `${sectionCode}-${uniquePart}`;
    } else {
      const existing = await prisma.stall.findUnique({
        where: { stallNumber },
      });
      if (existing)
        throw new Error(`'${stallNumber}' raqamli rasta allaqachon mavjud.`);
    }

    const dailyFee = area * saleType.tax;

    return prisma.stall.create({
      data: { stallNumber, area, dailyFee, description, sectionId, saleTypeId },
    });
  }

  async getAll(searchTerm) {
    const where = searchTerm
      ? {
          OR: [{ stallNumber: { contains: searchTerm, mode: "insensitive" } }],
        }
      : {};

    return prisma.stall.findMany({
      where,
      orderBy: { id: "asc" },
      include: { Section: true, SaleType: true },
    });
  }

  async getById(id) {
    const stall = await prisma.stall.findUnique({
      where: { id: Number(id) },
      include: { Section: true, SaleType: true },
    });
    if (!stall) throw new Error("Rasta topilmadi.");
    return stall;
  }

  async update(id, data) {
    const stallId = Number(id);

    const existing = await prisma.stall.findUnique({ where: { id: stallId } });
    if (!existing) throw new Error("Rasta topilmadi.");

    if (data.saleTypeId) {
      const saleType = await prisma.saleType.findUnique({
        where: { id: data.saleTypeId },
      });
      if (!saleType) throw new Error("Berilgan savdo turi topilmadi.");
      data.dailyFee = existing.area * saleType.tax;
    }

    if (data.sectionId) {
      const section = await prisma.section.findUnique({
        where: { id: data.sectionId },
      });
      if (!section) throw new Error("Bu pavilion yoki qator topilmadi.");
    }

    if (data.stallNumber && data.stallNumber !== existing.stallNumber) {
      const duplicate = await prisma.stall.findUnique({
        where: { stallNumber: data.stallNumber },
      });
      if (duplicate)
        throw new Error(
          `'${data.stallNumber}' raqamli rasta allaqachon mavjud.`
        );
    }

    return prisma.stall.update({ where: { id: stallId }, data });
  }

  async remove(id) {
    const stallId = Number(id);
    return prisma.stall.delete({ where: { id: stallId } });
  }
}

module.exports = new StallService();
