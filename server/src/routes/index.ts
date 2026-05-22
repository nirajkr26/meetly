import { Router } from "express";

import eventTypeRoutes from "./eventTypeRoutes";
import availabilityRoutes from "./availabilityRoutes";
import bookingRoutes from "./bookingRoutes";
import meetingRoutes from "./meetingRoutes";

const router = Router();

router.use("/event-types", eventTypeRoutes);
router.use("/availability", availabilityRoutes);
router.use("/book", bookingRoutes);
router.use("/meetings", meetingRoutes);


export default router;