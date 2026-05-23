import { Router } from "express";
import { getMeetings, cancelMeeting, rescheduleMeeting } from "../controllers/meetingController";

const router = Router();

router.get("/", getMeetings);
router.patch("/:id/cancel", cancelMeeting);
router.patch("/:id/reschedule", rescheduleMeeting);

export default router;
