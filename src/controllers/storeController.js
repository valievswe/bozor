// src/controllers/storeController.js
const storeService = require("../services/storeServices");

const create = async (req, res) => {
  try {
    const newStore = await storeService.createStore(req.body);
    res.status(201).json(newStore);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Do'kon yaratishda xatolik", error: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const { search } = req.query;
    const stores = await storeService.getAllStores(search);
    res.status(200).json(stores);
  } catch (error) {
    console.error("Error in storeController -> getAll:", error);
    res.status(500).json({
      message: "Do'konlarni olishda xatolik",
      error: error.message,
    });
  }
};

const getOne = async (req, res) => {
  try {
    const store = await storeService.getStoreById(req.params.id);
    res.status(200).json(store);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const updatedStore = await storeService.updateStore(
      req.params.id,
      req.body
    );
    res.status(200).json(updatedStore);
  } catch (error) {
    const statusCode = error.message.includes("topilmadi") ? 404 : 400;
    res
      .status(statusCode)
      .json({ message: "Do'konni yangilashda xatolik", error: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await storeService.deleteStore(req.params.id);
    res.status(204).send();
  } catch (error) {
    const statusCode = error.message.includes("topilmadi") ? 404 : 400;
    res
      .status(statusCode)
      .json({ message: "Do'konni o'chirishda xatolik", error: error.message });
  }
};

module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove,
};
