import { Router } from "express";
import { getAvailability, updateAvailability } from "../controllers/availabilityController";

const router = Router();

router.get("/", getAvailability);
router.put("/", updateAvailability);

export default router;
