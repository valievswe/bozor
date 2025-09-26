// src/controllers/transactionController.js

const transactionService = require("../services/transactionService");

/**
 * @description Handles the request to create a manual transaction.
 */
const createManual = async (req, res) => {
  // --- ADD THIS LOGGING ---
  console.log("--- [BACKEND] Received Manual Transaction Request ---");
  console.log("Request Body:", req.body);
  console.log("----------------------------------------------------");

  try {
    const newTransaction = await transactionService.createManualTransaction(
      req.body
    );
    res.status(201).json({
      message: "To'lov muvaffaqiyatli qo'shildi.",
      data: newTransaction,
    });
  } catch (error) {
    // --- AND ADD THIS LOGGING ---
    console.error("ERROR in createManual controller:", error.message);

    res.status(400).json({
      message: "Tranzaksiyani qo'lda yaratishda xatolik",
      error: error.message,
    });
  }
};

/**
 * @description Handles the request to get all transactions.
 */
const getAll = async (req, res) => {
  try {
    // req.query will contain search, page, limit, etc.
    const result = await transactionService.getAllTransactions(req.query);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: "Tranzaksiyalarni olishda xatolik",
      error: error.message,
    });
  }
};

/**
 * @description Handles the request to get a single transaction by its ID.
 */
const getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await transactionService.getTransactionById(id);
    res.status(200).json(transaction);
  } catch (error) {
    res
      .status(404)
      .json({ message: "Tranzaksiya topilmadi", error: error.message });
  }
};

module.exports = {
  createManual,
  getAll,
  getOne,
};
