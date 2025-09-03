// src/middlewares/authMiddleware.js

const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const isAuthenticated = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "Authorization sarlavhasi (header) mavjud emas" });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Token mavjud emas" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // 3-TEKSHIRUV
    return res
      .status(401)
      .json({ message: "Token haqiqiy emas yoki muddati o'tgan" });
  }
};

const hasPermission = (permissionAction) => {
  return async (req, res, next) => {
    try {
      const { userId } = req.user;

      const userWithPermissions = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      });

      if (!userWithPermissions || !userWithPermissions.role) {
        return res.status(403).json({
          message: "Sizga bu amalni bajarish uchun ruxsat yo'q (rol topilmadi)",
        });
      }

      const userPermissions = userWithPermissions.role.permissions.map(
        (p) => p.permission.action
      );

      if (userPermissions.includes(permissionAction)) {
        next();
      } else {
        return res
          .status(403)
          .json({ message: "Sizga bu amalni bajarish uchun ruxsat yo'q" });
      }
    } catch (error) {
      res
        .status(500)
        .json({ message: "Ruxsatni tekshirishda xatolik yuz berdi" });
    }
  };
};

module.exports = {
  isAuthenticated,
  hasPermission,
};
