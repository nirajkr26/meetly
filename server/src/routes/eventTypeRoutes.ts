import { Router } from "express";
import {
  getEventTypes,
  createEventType,
  updateEventType,
  deleteEventType,
} from "../controllers/eventTypeController";

const router = Router();

router.get("/", getEventTypes);
router.post("/", createEventType);
router.put("/:id", updateEventType);
router.delete("/:id", deleteEventType);

export default router;
