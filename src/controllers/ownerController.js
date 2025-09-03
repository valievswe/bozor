// src/controllers/ownerController.js
const ownerService = require("../services/ownerService");

const create = async (req, res) => {
  try {
    const createdByUserId = req.user.userId; // Bu middleware'dan keladi
    const newOwner = await ownerService.createOwner(req.body, createdByUserId);
    res.status(201).json(newOwner);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Tadbirkor yaratishda xatolik", error: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const { search } = req.query;
    const owners = await ownerService.getAllOwners(search);
    res.status(200).json(owners);
  } catch (error) {
    // --- THIS IS THE IMPORTANT CHANGE ---
    console.error("Error in getAllOwners:", error); // Log the full error to the backend console
    res.status(500).json({
      message: "An error occurred while fetching owners.",
      error: error.message, // Send a cleaner message to the frontend
    });
  }
};

const getOne = async (req, res) => {
  try {
    const owner = await ownerService.getOwnerById(req.params.id);
    res.status(200).json(owner);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const ownerId = req.params.id;
    const updateData = req.body;

    const updatedOwner = await ownerService.updateOwner(ownerId, updateData);

    res.status(200).json(updatedOwner);
  } catch (error) {
    // If the owner is not found, it will be a 404.
    // If the TIN is a duplicate, it will be a 400.
    const statusCode = error.message.includes("topilmadi") ? 404 : 400;
    res.status(statusCode).json({
      message: "Tadbirkorni yangilashda xatolik",
      error: error.message,
    });
  }
};

const remove = async (req, res) => {
  try {
    await ownerService.deleteOwner(req.params.id);
    // On successful deletion, we don't need to return any data.
    // The HTTP 204 No Content status code is perfect for this.
    res.status(204).send();
  } catch (error) {
    // If the owner has leases, it will be a 400 Bad Request.
    // If the owner is not found, it will be a 404 Not Found.
    const statusCode = error.message.includes("topilmadi") ? 404 : 400;
    res.status(statusCode).json({
      message: "Tadbirkorni o'chirishda xatolik",
      error: error.message,
    });
  }
};

module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove,
};
