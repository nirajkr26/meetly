import { type Request, type Response } from "express";
import { prisma } from "../../lib/prisma";
import { generateAvailableSlots } from "../utils/slotGenerator";
import { TZDate } from "@date-fns/tz";
import { createBookingSchema } from "../utils/validations";
import { parseCustomQuestions, validateInviteeAnswers, validateBookingDuration, } from "../utils/bookingHelpers";
import { findHostBookingConflict } from "../utils/conflictCheck";
import { sendBookingConfirmationEmails, sendEmailSafe } from "../services/emailService";

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

    res.json({
      ...eventType,
      customQuestions: parseCustomQuestions(eventType.customQuestions),
    });
  } catch (error: unknown) {
    console.error("Error fetching public event type:", error);
    res.status(500).json({ error: "Failed to fetch event type details" });
  }
};

// GET /api/book/:slug/slots
export const getAvailableSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug as string;
    const { date, timezone, excludeBookingId } = req.query;

    if (!date || typeof date !== "string") {
      res.status(400).json({ error: "Date parameter (YYYY-MM-DD) is required" });
      return;
    }

    const inviteeTz = (timezone as string) || "UTC";

    const eventType = await prisma.eventType.findUnique({
      where: { slug },
      include: { user: true },
    });

    if (!eventType) {
      res.status(404).json({ error: "Event type not found" });
      return;
    }

    const admin = eventType.user;
    const parsedDate = new TZDate(`${date}T00:00:00`, admin.timezone);
    const dayOfWeek = parsedDate.getDay();

    const availability = await prisma.availability.findFirst({
      where: {
        userId: admin.id,
        dayOfWeek,
      },
    });

    const targetDateObj = new Date(date);
    const startOfSearch = new Date(
      targetDateObj.getTime() - 24 * 60 * 60 * 1000
    );
    const endOfSearch = new Date(
      targetDateObj.getTime() + 48 * 60 * 60 * 1000
    );

    const excludeId =
      excludeBookingId && typeof excludeBookingId === "string"
        ? parseInt(excludeBookingId, 10)
        : undefined;

    const bookedMeetings = await prisma.booking.findMany({
      where: {
        eventType: { userId: admin.id },
        status: "BOOKED",
        ...(excludeId && !isNaN(excludeId) ? { id: { not: excludeId } } : {}),
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

    const slots = generateAvailableSlots(date, eventType.duration, admin.timezone, availability, bookedMeetings, inviteeTz, eventType.bufferMinutes);

    res.json({
      date,
      timezone: inviteeTz,
      slots,
    });
  } catch (error: unknown) {
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
      res.status(400).json({
        error: validation.error.issues[0]?.message ?? "Invalid input",
      });
      return;
    }

    const { inviteeName, inviteeEmail, startTime, endTime, inviteeAnswers } = validation.data;
    const startUtc = new Date(startTime);
    const endUtc = new Date(endTime);

    const eventType = await prisma.eventType.findUnique({
      where: { slug },
      include: { user: true },
    });

    if (!eventType) {
      res.status(404).json({ error: "Event type not found" });
      return;
    }

    const durationError = validateBookingDuration(startUtc,  endUtc, eventType.duration);
    if (durationError) {
      res.status(400).json({ error: durationError });
      return;
    }

    const questions = parseCustomQuestions(eventType.customQuestions);
    const answersError = validateInviteeAnswers(questions, inviteeAnswers);
    if (answersError) {
      res.status(400).json({ error: answersError });
      return;
    }

    const hasConflict = await findHostBookingConflict(eventType.user.id, startUtc, endUtc, eventType.bufferMinutes);

    if (hasConflict) {
      res.status(400).json({
        error:
          "Double-booking conflict! This time slot has already been reserved.",
      });
      return;
    }

    const booking = await prisma.booking.create({
      data: {
        eventTypeId: eventType.id,
        inviteeName,
        inviteeEmail,
        inviteeAnswers: inviteeAnswers ?? undefined,
        startTime: startUtc,
        endTime: endUtc,
        status: "BOOKED",
      },
    });

    sendEmailSafe(
      sendBookingConfirmationEmails({
        inviteeName,
        inviteeEmail,
        hostName: eventType.user.name ?? "Host",
        hostEmail: eventType.user.email,
        eventName: eventType.name,
        startTime: startUtc.toISOString(),
        endTime: endUtc.toISOString(),
        duration: eventType.duration,
        hostTimezone: eventType.user.timezone,
        slug: eventType.slug,
      })
    );

    res.status(201).json({
      message: "Meeting booked successfully!",
      booking,
      eventDetails: {
        hostName: eventType.user.name,
        eventName: eventType.name,
        duration: eventType.duration,
      },
    });
  } catch (error: unknown) {
    console.error("Error creating booking:", error);
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") {
      res.status(400).json({
        error:
          "Double-booking conflict! A booking with this start time already exists.",
      });
    } else {
      res.status(500).json({ error: "Failed to create booking" });
    }
  }
};
