const stallService = require("../services/stallServices");

const createStall = async (req, res) => {
  try {
    const stall = await stallService.create(req.body);
    res.status(201).json(stall);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getAllStalls = async (req, res) => {
  try {
    const searchTerm = req.query.search || "";
    const stalls = await stallService.getAll(searchTerm);
    res.json(stalls);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getStallById = async (req, res) => {
  try {
    const stall = await stallService.getById(req.params.id);
    res.json(stall);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

const updateStall = async (req, res) => {
  try {
    const updated = await stallService.update(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteStall = async (req, res) => {
  try {
    await stallService.remove(req.params.id);
    res.json({ message: "Stall deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  createStall,
  getAllStalls,
  getStallById,
  updateStall,
  deleteStall,
};
