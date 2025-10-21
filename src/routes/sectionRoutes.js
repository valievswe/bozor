const express = require("express");
const SectionController = require("../controllers/sectionController.js");

const router = express.Router();

router.post("/", SectionController.create);
router.get("/", SectionController.getAll);
router.get("/:id", SectionController.getById);
router.patch("/:id", SectionController.update);
router.delete("/:id", SectionController.delete);

module.exports = router;