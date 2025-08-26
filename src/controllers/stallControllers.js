// src/controllers/stallController.js
const stallService = require("../services/stallService");

const create = async (req, res) => {
  try {
    const newStall = await stallService.createStall(req.body);
    res.status(201).json(newStall);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Rasta yaratishda xatolik", error: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const stalls = await stallService.getAllStalls();
    res.status(200).json(stalls);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Rastalarni olishda xatolik", error: error.message });
  }
};

const getOne = async (req, res) => {
  try {
    const stall = await stallService.getStallById(req.params.id);
    res.status(200).json(stall);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const updatedStall = await stallService.updateStall(
      req.params.id,
      req.body
    );
    res.status(200).json(updatedStall);
  } catch (error) {
    const statusCode = error.message.includes("topilmadi") ? 404 : 400;
    res
      .status(statusCode)
      .json({ message: "Rastani yangilashda xatolik", error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await stallService.deleteStall(req.params.id);
    res.status(204).send();
  } catch (error) {
    const statusCode = error.message.includes("topilmadi") ? 404 : 400;
    res
      .status(statusCode)
      .json({ message: "Rastani o'chirishda xatolik", error: error.message });
  }
};

module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove,
};
