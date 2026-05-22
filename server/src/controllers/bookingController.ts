import { type Request, type Response } from "express";
import { prisma } from "../../lib/prisma";
import { generateAvailableSlots } from "../utils/slotGenerator";
import { TZDate } from "@date-fns/tz";
import { isBefore, isAfter } from "date-fns";
import { createBookingSchema } from "../utils/validations";


// GET /api/book/:slug
export const getPublicEventType = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug as string;

    const eventType = await prisma.eventType.findUnique({
      where: { slug },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            timezone: true,
          },
        },
      },
    });

    if (!eventType) {
      res.status(404).json({ error: "Event type not found" });
      return;
    }

    res.json(eventType);
  } catch (error: any) {
    console.error("Error fetching public event type:", error);
    res.status(500).json({ error: "Failed to fetch event type details" });
  }
};

// GET /api/book/:slug/slots
export const getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug as string;
    const { date, timezone } = req.query; // date: "YYYY-MM-DD", timezone: "America/New_York"

    if (!date || typeof date !== "string") {
      res.status(400).json({ error: "Date parameter (YYYY-MM-DD) is required" });
      return;
    }

    const inviteeTz = (timezone as string) || "UTC";

    // Fetch Event Type and host admin
    const eventType = await prisma.eventType.findUnique({
      where: { slug },
      include: { user: true },
    });

    if (!eventType) {
      res.status(404).json({ error: "Event type not found" });
      return;
    }

    const admin = eventType.user;

    // Parse date and find the day of the week in admin's timezone
    const parsedDate = new TZDate(`${date}T00:00:00`, admin.timezone);

    const dayOfWeek = parsedDate.getDay(); // 0 = Sunday, 6 = Saturday

    // Fetch admin availability for this day of week
    const availability = await prisma.availability.findFirst({
      where: {
        userId: admin.id,
        dayOfWeek,
      },
    });

    // Fetch all active booked meetings on this day
    // To cover timezone differences safely, we pull bookings within a +/- 24h window
    const targetDateObj = new Date(date);
    const startOfSearch = new Date(targetDateObj.getTime() - 24 * 60 * 60 * 1000);
    const endOfSearch = new Date(targetDateObj.getTime() + 48 * 60 * 60 * 1000);

    const bookedMeetings = await prisma.booking.findMany({
      where: {
        eventType: { userId: admin.id },
        status: "BOOKED",
        startTime: {
          gte: startOfSearch,
          lte: endOfSearch,
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Generate slots
    const slots = generateAvailableSlots(
      date,
      eventType.duration,
      admin.timezone,
      availability,
      bookedMeetings,
      inviteeTz
    );

    res.json({
      date,
      timezone: inviteeTz,
      slots,
    });
  } catch (error: any) {
    console.error("Error generating available slots:", error);
    res.status(500).json({ error: "Failed to generate available slots" });
  }
};

// POST /api/book/:slug
export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug as string;

    const validation = createBookingSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.issues[0]?.message ?? "Invalid input" });
      return;
    }

    const { inviteeName, inviteeEmail, startTime, endTime } = validation.data;
    const startUtc = new Date(startTime);
    const endUtc = new Date(endTime);

    // Validate times
    if (isBefore(endUtc, startUtc) || startUtc.getTime() === endUtc.getTime()) {
      res.status(400).json({ error: "End time must be after start time" });
      return;
    }

    // Fetch Event Type
    const eventType = await prisma.eventType.findUnique({
      where: { slug },
      include: { user: true },
    });

    if (!eventType) {
      res.status(404).json({ error: "Event type not found" });
      return;
    }

    // Double-Booking Prevention: Check overlap inside database
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        eventTypeId: eventType.id,
        status: "BOOKED",
        startTime: { lt: endUtc },
        endTime: { gt: startUtc },
      },
    });

    if (conflictingBooking) {
      res.status(400).json({
        error: "Double-booking conflict! This time slot has already been reserved.",
      });
      return;
    }

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        eventTypeId: eventType.id,
        inviteeName,
        inviteeEmail,
        startTime: startUtc,
        endTime: endUtc,
        status: "BOOKED",
      },
    });

    res.status(201).json({
      message: "Meeting booked successfully!",
      booking,
      eventDetails: {
        hostName: eventType.user.name,
        eventName: eventType.name,
        duration: eventType.duration,
      },
    });
  } catch (error: any) {
    console.error("Error creating booking:", error);
    if (error.code === "P2002") {
      res.status(400).json({
        error: "Double-booking conflict! A booking with this start time already exists.",
      });
    } else {
      res.status(500).json({ error: "Failed to create booking" });
    }
  }
};
