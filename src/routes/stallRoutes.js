// src/routes/stallRoutes.js
const express = require("express");
const router = express.Router();
const {
  isAuthenticated,
  hasPermission,
} = require("../middlewares/authMiddleware");
const stallController = require("../controllers/stallController");

router.post(
  "/",
  [isAuthenticated, hasPermission("CREATE_STALL")],
  stallController.create
);
router.get(
  "/",
  [isAuthenticated, hasPermission("VIEW_STALLS")],
  stallController.getAll
);
router.get(
  "/:id",
  [isAuthenticated, hasPermission("VIEW_STALLS")],
  stallController.getOne
);
router.put(
  "/:id",
  [isAuthenticated, hasPermission("EDIT_STALL")],
  stallController.update
);
router.delete(
  "/:id",
  [isAuthenticated, hasPermission("DELETE_STALL")],
  stallController.remove
);

module.exports = router;
