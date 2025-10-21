import { Router } from "express";
import SectionController from "../controllers/sectionController";

const router = Router();

router.post("/", SectionController.create);
router.get("/", SectionController.getAll);
router.get("/:id", SectionController.getById);
router.patch("/:id", SectionController.update);
router.delete("/:id", SectionController.delete);

export default router;