import { Router } from "express";
import { getMeetings, cancelMeeting } from "../controllers/meetingController";

const router = Router();

router.get("/", getMeetings);
router.patch("/:id/cancel", cancelMeeting);

export default router;
