const SaleTypeService = require("../services/saleTypeService");

class SaleTypeController {
  async getAll(req, res) {
    try {
      const saleTypes = await SaleTypeService.getAll();
      res.json(saleTypes);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const saleType = await SaleTypeService.getById(id);
      if (!saleType)
        return res.status(404).json({ message: "SaleType not found" });
      res.json(saleType);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async create(req, res) {
    try {
      const data = req.body;
      const newSaleType = await SaleTypeService.create(data);
      res.status(201).json(newSaleType);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const data = req.body;
      const updatedSaleType = await SaleTypeService.update(id, data);
      res.json(updatedSaleType);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async remove(req, res) {
    try {
      const { id } = req.params;
      await SaleTypeService.remove(id);
      res.json({ message: "SaleType deleted successfully" });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
}

module.exports = new SaleTypeController();
