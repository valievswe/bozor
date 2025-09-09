// src/controllers/leaseController.js
const leaseService = require("../services/leaseServices");

const create = async (req, res) => {
  try {
    const createdByUserId = req.user.userId;
    const newLease = await leaseService.createLease(req.body, createdByUserId);
    res.status(201).json(newLease);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Shartnoma yaratishda xatolik", error: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const leases = await leaseService.getAllLeases(req.query);
    res.status(200).json(leases);
  } catch (error) {
    console.error("Error in leaseController -> getAll:", error);
    res.status(500).json({
      message: "Ijaralarni olishda xatolik",
      error: error.message,
    });
  }
};

const getOne = async (req, res) => {
  try {
    const lease = await leaseService.getLeaseById(req.params.id);
    res.status(200).json(lease);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const updatedLease = await leaseService.updateLease(
      req.params.id,
      req.body
    );
    res.status(200).json(updatedLease);
  } catch (error) {
    res.status(400).json({
      message: "Shartnomani yangilashda xatolik",
      error: error.message,
    });
  }
};

const deactivate = async (req, res) => {
  console.log(
    `--- CONTROLLER: Deactivating lease with ID: ${req.params.id} ---`
  );
  try {
    const deactivatedLease = await leaseService.deactivateLease(req.params.id);
    res.status(200).json(deactivatedLease);
    console.log("--- CONTROLLER: Deactivation successful ---");
  } catch (error) {
    console.error("Error in leaseController -> deactivate:", error);
    res.status(400).json({
      message: "Shartnomani deaktivatsiya qilishda xatolik",
      error: error.message,
    });
  }
};

const activate = async (req, res) => {
  try {
    const activatedLease = await leaseService.activateLease(req.params.id);
    res.status(200).json(activatedLease);
  } catch (error) {
    res.status(400).json({
      message: "Shartnomani aktivatsiya qilishda xatolik",
      error: error.message,
    });
  }
};

module.exports = {
  create,
  getAll,
  getOne,
  update,
  deactivate,
  activate,
};
