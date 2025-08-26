const express = require("express");
const router = express.Router();
const {
  isAuthenticated,
  hasPermission,
} = require("../middlewares/authMiddleware");
const storeController = require("../controllers/storeController");

router.post(
  "/",
  [isAuthenticated, hasPermission("CREATE_STORE")],
  storeController.create
);
router.get(
  "/",
  [isAuthenticated, hasPermission("VIEW_STORES")],
  storeController.getAll
);
router.get(
  "/:id",
  [isAuthenticated, hasPermission("VIEW_STORES")],
  storeController.getOne
);
router.put(
  "/:id",
  [isAuthenticated, hasPermission("EDIT_STORE")],
  storeController.update
);
router.delete(
  "/:id",
  [isAuthenticated, hasPermission("DELETE_STORE")],
  storeController.remove
);

module.exports = router;
