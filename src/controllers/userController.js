// src/controllers/userController.js
const userService = require("../services/userService");
const authService = require("../services/authServices"); // We need this for the 'register' logic

const create = async (req, res) => {
  try {
    const newUser = await authService.registerUser(req.body);
    res.status(201).json({
      message: "Foydalanuvchi muvaffaqiyatli yaratildi",
      user: newUser,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Foydalanuvchilarni olishda xatolik",
      error: error.message,
    });
  }
};

const getOne = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json(user);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    await userService.updateUser(req.params.id, req.body);
    res
      .status(200)
      .json({ message: "Foydalanuvchi muvaffaqiyatli yangilandi" });
  } catch (error) {
    res.status(400).json({
      message: "Foydalanuvchini yangilashda xatolik",
      error: error.message,
    });
  }
};

const remove = async (req, res) => {
  try {
    await userService.deleteUser(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(400).json({
      message: "Foydalanuvchini o'chirishda xatolik",
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
