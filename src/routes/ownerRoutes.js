// src/routes/ownerRoutes.js

const express = require("express");
const router = express.Router();

const {
  isAuthenticated,
  hasPermission,
} = require("../middlewares/authMiddleware");
const ownerController = require("../controllers/ownerController");

router.post(
  "/",
  [isAuthenticated, hasPermission("CREATE_OWNER")],
  ownerController.create
);
router.get(
  "/",
  [isAuthenticated, hasPermission("VIEW_OWNERS")],
  ownerController.getAll
);
router.get(
  "/:id",
  [isAuthenticated, hasPermission("VIEW_OWNERS")],
  ownerController.getOne
);
router.put(
  "/:id",
  [isAuthenticated, hasPermission("EDIT_OWNER")],
  ownerController.update
);
router.delete(
  "/:id",
  [isAuthenticated, hasPermission("DELETE_OWNER")],
  ownerController.remove
);

module.exports = router;
