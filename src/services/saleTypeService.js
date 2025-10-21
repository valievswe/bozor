const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class SaleTypeService {
  async getAll() {
    return prisma.saleType.findMany();
  }

  async getById(id) {
    return prisma.saleType.findUnique({
      where: { id: Number(id) },
    });
  }

  async create(data) {
    return prisma.saleType.create({
      data: {
        name: data.name,
        description: data.description || null,
        tax: Number(data.tax),
      },
    });
  }

  async update(id, data) {
    const saleTypeId = Number(id);

    const updatedSaleType = await prisma.saleType.update({
      where: { id: saleTypeId },
      data: {
        name: data.name,
        description: data.description,
        tax: data.tax !== undefined ? Number(data.tax) : undefined,
      },
    });

    if (data.tax !== undefined) {
      const stalls = await prisma.stall.findMany({ where: { saleTypeId } });

      for (const stall of stalls) {
        await prisma.stall.update({
          where: { id: stall.id },
          data: {
            dailyFee: stall.area * Number(data.tax),
          },
        });
      }
    }
    return updatedSaleType;
  }

  async remove(id) {
    const saleTypeId = Number(id);

    return prisma.saleType.delete({
      where: { id: saleTypeId },
    });
  }
}

module.exports = new SaleTypeService();
