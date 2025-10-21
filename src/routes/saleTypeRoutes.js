const express = require("express");
const router = express.Router();
const SaleTypeController = require("../controllers/saleTypeController");

router.get("/", SaleTypeController.getAll.bind(SaleTypeController));

router.get("/:id", SaleTypeController.getById.bind(SaleTypeController));

router.post("/", SaleTypeController.create.bind(SaleTypeController));

router.put("/:id", SaleTypeController.update.bind(SaleTypeController));

router.delete("/:id", SaleTypeController.remove.bind(SaleTypeController));

module.exports = router;
