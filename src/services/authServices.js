// src/services/authService.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

const loginUser = async (email, password) => {
  // This query is now more explicit about what we need from the Role table.
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      role: {
        select: {
          name: true, // Explicitly select only the 'name' field from the related Role
        },
      },
    },
  });

  if (!user || !user.role) {
    // Added a check to ensure the role was loaded
    throw new Error("Foydalanuvchi yoki uning roli topilmadi");
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    throw new Error("Noto'g'ri email yoki parol");
  }

  // The payload creation remains the same, as it relies on a correctly loaded user.role.name
  const payload = {
    userId: user.id,
    role: user.role.name,
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: "6h",
  });

  return token;
};

const registerUser = async (userData) => {
  const { email, password, firstName, lastName, roleName } = userData;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  if (existingUser) {
    throw new Error("Bu email bilan foydalanuvchi allaqachon mavjud.");
  }

  const role = await prisma.role.findUnique({
    where: { name: roleName },
  });
  if (!role) {
    throw new Error(
      `'${roleName}' nomli rol mavjud emas. Rollar: ADMIN, CASHIER, ACCOUNTANT.`
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      roleId: role.id,
    },
    select: {
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
