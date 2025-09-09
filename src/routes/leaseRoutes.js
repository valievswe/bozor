// src/routes/leaseRoutes.js
const express = require("express");
const router = express.Router();
const {
  isAuthenticated,
  hasPermission,
} = require("../middlewares/authMiddleware");
const leaseController = require("../controllers/leaseController");

router.post(
  "/",
  [isAuthenticated, hasPermission("CREATE_LEASE")],
  leaseController.create
);

router.get(
  "/",
  [isAuthenticated, hasPermission("VIEW_LEASES")],
  leaseController.getAll
);

router.get(
  "/:id",
  [isAuthenticated, hasPermission("VIEW_LEASES")],
  leaseController.getOne
);

router.put(
  "/:id",
  [isAuthenticated, hasPermission("EDIT_LEASE")],
  leaseController.update
);

router.patch(
  "/:id/archive",
  [isAuthenticated, hasPermission("DEACTIVATE_LEASE")],
  leaseController.deactivate
);

router.patch(
  "/:id/activate",
  [isAuthenticated, hasPermission("EDIT_LEASE")],
  leaseController.activate
);

module.exports = router;
