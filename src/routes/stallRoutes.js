const express = require("express");
const router = express.Router();
const stallController = require("../controllers/stall.controller");

router.post("/", stallController.createStall);
router.get("/", stallController.getAllStalls);
router.get("/:id", stallController.getStallById);
router.put("/:id", stallController.updateStall);
router.delete("/:id", stallController.deleteStall);

module.exports = router;
