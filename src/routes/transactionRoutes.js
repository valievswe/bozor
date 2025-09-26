// src/routes/transactionRoutes.js

const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");

const protect = (req, res, next) => {
  console.log("Middleware: protect (placeholder)");
  next();
};
const authorize =
  (...roles) =>
  (req, res, next) => {
    console.log(`Middleware: authorize for ${roles.join(", ")} (placeholder)`);
    next();
  };

const createPermission = [protect, authorize("admin")];
const viewPermission = [protect, authorize("admin", "manager")];

router.post("/manual", createPermission, transactionController.createManual);
router.get("/", viewPermission, transactionController.getAll);
router.get("/:id", viewPermission, transactionController.getOne);

module.exports = router;
