// src/services/authService.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<string>} JWT token
 */
const loginUser = async (email, password) => {
  // 1. Foydalanuvchini email orqali topish
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // Agar foydalanuvchi topilmasa YOKI parol noto'g'ri bo'lsa
  if (!user) {
    throw new Error("Noto'g'ri email yoki parol");
  }

  // 2. Kiritilgan parol bilan bazadagi heshlangan parolni solishtirish
  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    throw new Error("Noto'g'ri email yoki parol");
  }

  // 3. Agar hammasi to'g'ri bo'lsa, JWT token yaratish
  const payload = {
    userId: user.id,
    roleId: user.roleId,
    // Kelajakda bu yerga boshqa ma'lumotlarni ham qo'shish mumkin
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "6h",
  });

  return token;
};

/**
 * Registers a new user in the system.
 * @param {object} userData - Contains email, password, firstName, lastName, roleName.
 * @returns {Promise<object>} The newly created user object (without the password).
 */
const registerUser = async (userData) => {
  const { email, password, firstName, lastName, roleName } = userData; // We'll use roleName now

  // 1. Check if the user's email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    throw new Error("Bu email bilan foydalanuvchi allaqachon mavjud.");
  }

  // 2. Find the role by its NAME (e.g., "CASHIER", "ADMIN"). This is more reliable.
  const role = await prisma.role.findUnique({
    where: { name: roleName },
  });
  if (!role) {
    throw new Error(
      `'${roleName}' nomli rol mavjud emas. Rollar: ADMIN, CASHIER, ACCOUNTANT.`
    );
  }

  // 3. Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 4. Create the new user using the found role.id
  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      roleId: role.id, // Use the ID from the role we found
    },
    select: {
      // Select which fields to return, excluding the password
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      roleId: true,
      createdAt: true,
    },
  });

  return newUser;
};

module.exports = {
  loginUser,
  registerUser,
};
