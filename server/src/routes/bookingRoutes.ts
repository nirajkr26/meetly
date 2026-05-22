import { Router } from "express";
import {
  getPublicEventType,
  getAvailableSlots,
  createBooking,
} from "../controllers/bookingController";

const router = Router();

router.get("/:slug", getPublicEventType);
router.get("/:slug/slots", getAvailableSlots);
router.post("/:slug", createBooking);

export default router;
