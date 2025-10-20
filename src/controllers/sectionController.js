import SectionService from "../services/sectionService";

class SectionController {
  async create(req, res) {
    try {
      const data = req.body;
      const section = await SectionService.createSection(data);
      return res.status(201).json(section);
    } catch (error) {
      console.error("Error creating section:", error);
      return res.status(500).json({ message: "Failed to create section" });
    }
  }

  async getAll(_, res) {
    try {
      const sections = await SectionService.getAllSections();
      return res.json(sections);
    } catch (error) {
      console.error("Error fetching sections:", error);
      return res.status(500).json({ message: "Failed to fetch sections" });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const section = await SectionService.getSectionById(id);
      if (!section) {
        return res.status(404).json({ message: "Section not found" });
      }
      return res.json(section);
    } catch (error) {
      console.error("Error fetching section by id:", error);
      return res.status(500).json({ message: "Failed to fetch section" });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, description } = req.body;

      const data = {};
      if (name !== undefined) data.name = name;
      if (description !== undefined) data.description = description;

      const updated = await SectionService.updateSection(id, data);
      return res.json(updated);
    } catch (error) {
      console.error("Error updating section:", error);
      return res.status(500).json({ message: "Failed to update section" });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      await SectionService.deleteSection(id);
      return res.json({ message: "Section deleted successfully" });
    } catch (error) {
      console.error("Error deleting section:", error);
      return res.status(500).json({ message: "Failed to delete section" });
    }
  }
}

export default new SectionController();
