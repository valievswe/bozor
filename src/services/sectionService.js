const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class SectionService {
  async createSection(data) {
    return await prisma.section.create({
      data,
    });
  }

  async getAllSections() {
    return await prisma.section.findMany({
      include: { stalls: true },
      orderBy: { id: "asc" },
    });
  }

  async getSectionById(id) {
    return await prisma.section.findUnique({
      where: { id: Number(id) },
      include: { stalls: true },
    });
  }

  async updateSection(id, data) {
    return await prisma.section.update({
      where: { id: Number(id) },
      data,
    });
  }

  async deleteSection(id) {
    return await prisma.section.delete({
      where: { id: Number(id) },
    });
  }
}

export default new SectionService();
