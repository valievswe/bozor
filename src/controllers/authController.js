// src/controllers/authController.js

const authService = require("../services/authServices");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Ma'lumotlar to'liq kelganini tekshirish
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email va parol kiritilishi shart" });
    }

    // Asosiy logikani Service'ga topshiramiz
    const token = await authService.loginUser(email, password);

    // Muvaffaqiyatli javobni token bilan qaytaramiz
    res.status(200).json({
      message: "Tizimga muvaffaqiyatli kirildi",
      token,
    });
  } catch (error) {
    // Service'dan kelgan xatoliklarni ushlab olamiz
    res.status(401).json({ message: error.message });
  }
};

const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, roleName } = req.body;

    // Basic validation
    if (!email || !password || !roleName) {
      return res.status(400).json({
        message: "Email, parol va rol nomi (roleName) kiritilishi shart.",
      });
    }

    // Pass the data to the service layer
    const newUser = await authService.registerUser({
      email,
      password,
      firstName,
      lastName,
      roleName,
    });

    res.status(201).json({
      message: "Foydalanuvchi muvaffaqiyatli ro'yxatdan o'tkazildi",
      user: newUser,
    });
  } catch (error) {
    // Catch errors from the service (e.g., user already exists)
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  login,
  register,
};
