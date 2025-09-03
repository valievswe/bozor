// src/services/userService.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");

// Note: The 'create' logic is already in authService.js (registerUser)
// We are adding the Read, Update, and Delete operations here.

const getAllUsers = async () => {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      // Explicitly select fields to AVOID sending password hashes
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      role: {
        // Include the related role name
        select: {
          name: true,
        },
      },
    },
  });
};

const getUserById = async (id) => {
  const userId = parseInt(id, 10);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      roleId: true, // Send roleId for pre-filling forms
    },
  });
  if (!user) {
    throw new Error("Foydalanuvchi topilmadi");
  }
  return user;
};

const updateUser = async (id, updateData) => {
  const userId = parseInt(id, 10);
  const { email, roleName, password, ...restOfData } = updateData;

  // If email is being changed, check if it's already taken by another user
  if (email) {
    const existingUser = await prisma.user.findFirst({
      where: { email: email, id: { not: userId } },
    });
    if (existingUser) {
      throw new Error("Bu email allaqachon boshqa foydalanuvchiga tegishli.");
    }
  }

  const dataToUpdate = { ...restOfData, email };

  // If a new role name is provided, find its ID
  if (roleName) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) throw new Error(`'${roleName}' nomli rol mavjud emas.`);
    dataToUpdate.roleId = role.id;
  }

  // If a new password is provided, hash it
  if (password) {
    dataToUpdate.password = await bcrypt.hash(password, 10);
  }

  return prisma.user.update({
    where: { id: userId },
    data: dataToUpdate,
  });
};

const deleteUser = async (id) => {
  const userId = parseInt(id, 10);

  // Optional: Add logic to prevent deletion of the last admin user
  const userToDelete = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
  if (!userToDelete) throw new Error("Foydalanuvchi topilmadi");

  if (userToDelete.role.name === "ADMIN") {
    const adminCount = await prisma.user.count({
      where: { role: { name: "ADMIN" } },
    });
    if (adminCount <= 1) {
      throw new Error("Cannot delete the last remaining admin user.");
    }
  }

  return prisma.user.delete({
    where: { id: userId },
  });
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
