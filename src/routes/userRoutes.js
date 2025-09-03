// src/routes/userRoutes.js
const express = require("express");
const router = express.Router();
const {
  isAuthenticated,
  hasPermission,
} = require("../middlewares/authMiddleware");
const userController = require("../controllers/userController");

// All routes in this file are protected and require the 'MANAGE_USERS' permission.
router.use(isAuthenticated, hasPermission("MANAGE_USERS"));

router.post("/", userController.create);
router.get("/", userController.getAll);
router.get("/:id", userController.getOne);
router.put("/:id", userController.update);
router.delete("/:id", userController.remove);

module.exports = router;
