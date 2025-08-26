const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {
  isAuthenticated,
  hasPermission,
} = require("../middlewares/authMiddleware");

router.post("/login", authController.login);
router.post(
  "/register",
  [isAuthenticated, hasPermission("MANAGE_USERS")],
  authController.register
);

module.exports = router;
