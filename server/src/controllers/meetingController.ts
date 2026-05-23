import { type Request, type Response } from "express";
import { prisma } from "../../lib/prisma";
import { cancelBookingSchema, rescheduleBookingSchema } from "../utils/validations";
import { validateBookingDuration } from "../utils/bookingHelpers";
import { findHostBookingConflict } from "../utils/conflictCheck";
import { sendCancellationEmails, sendRescheduleEmails, sendEmailSafe } from "../services/emailService";

// GET /api/meetings
export const getMeetings = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      res.status(404).json({ error: "Default user not found. Please seed the database." });
      return;
    }

    const now = new Date();

    const bookings = await prisma.booking.findMany({
      where: {
        eventType: { userId: user.id },
      },
      include: {
        eventType: {
          select: {
            name: true,
            duration: true,
            slug: true,
            bufferMinutes: true,
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    const upcoming = bookings.filter((b) => new Date(b.startTime) >= now && b.status === "BOOKED");
    const past = bookings.filter((b) => new Date(b.startTime) < now || b.status === "CANCELLED");

    past.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    res.json({
      upcoming,
      past,
    });
  } catch (error: unknown) {
    console.error("Error fetching meetings:", error);
    res.status(500).json({ error: "Failed to fetch meetings" });
  }
};

// PATCH /api/meetings/:id/cancel
export const cancelMeeting = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const bookingId = parseInt(id);

    if (isNaN(bookingId)) {
      res.status(400).json({ error: "Invalid meeting ID" });
      return;
    }

    const validation = cancelBookingSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: validation.error.issues[0]?.message ?? "Invalid input",
      });
      return;
    }

    const { cancellationReason } = validation.data;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        eventType: { include: { user: true } },
      },
    });

    if (!booking) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }

    if (booking.status === "CANCELLED") {
      res.status(400).json({ error: "Meeting is already cancelled" });
      return;
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancellationReason: cancellationReason || "Cancelled by admin",
      },
    });

    const host = booking.eventType.user;
    sendEmailSafe(
      sendCancellationEmails({
        inviteeName: booking.inviteeName,
        inviteeEmail: booking.inviteeEmail,
        hostName: host.name ?? "Host",
        hostEmail: host.email,
        eventName: booking.eventType.name,
        startTime: booking.startTime.toISOString(),
        endTime: booking.endTime.toISOString(),
        duration: booking.eventType.duration,
        hostTimezone: host.timezone,
        slug: booking.eventType.slug,
        reason: updated.cancellationReason ?? undefined,
      })
    );

    res.json({
      message: "Meeting cancelled successfully",
      booking: updated,
    });
  } catch (error: unknown) {
    console.error("Error cancelling meeting:", error);
    res.status(500).json({ error: "Failed to cancel meeting" });
  }
};

// PATCH /api/meetings/:id/reschedule
export const rescheduleMeeting = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const bookingId = parseInt(id);

    if (isNaN(bookingId)) {
      res.status(400).json({ error: "Invalid meeting ID" });
      return;
    }

    const validation = rescheduleBookingSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: validation.error.issues[0]?.message ?? "Invalid input",
      });
      return;
    }

    const { startTime, endTime } = validation.data;
    const startUtc = new Date(startTime);
    const endUtc = new Date(endTime);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        eventType: { include: { user: true } },
      },
    });

    if (!booking) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }

    if (booking.status !== "BOOKED") {
      res.status(400).json({ error: "Only active meetings can be rescheduled" });
      return;
    }

    if (new Date(booking.startTime) < new Date()) {
      res.status(400).json({ error: "Cannot reschedule a meeting in the past" });
      return;
    }

    const durationError = validateBookingDuration(startUtc, endUtc, booking.eventType.duration);
    if (durationError) {
      res.status(400).json({ error: durationError });
      return;
    }

    const previousStartTime = booking.startTime.toISOString();

    const hasConflict = await findHostBookingConflict(booking.eventType.user.id, startUtc, endUtc, booking.eventType.bufferMinutes, bookingId);

    if (hasConflict) {
      res.status(400).json({
        error: "The selected time conflicts with another meeting.",
      });
      return;
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        startTime: startUtc,
        endTime: endUtc,
      },
      include: {
        eventType: {
          select: { name: true, duration: true, slug: true },
        },
      },
    });

    const host = booking.eventType.user;
    sendEmailSafe(
      sendRescheduleEmails({
        inviteeName: booking.inviteeName,
        inviteeEmail: booking.inviteeEmail,
        hostName: host.name ?? "Host",
        hostEmail: host.email,
        eventName: booking.eventType.name,
        startTime: startUtc.toISOString(),
        endTime: endUtc.toISOString(),
        duration: booking.eventType.duration,
        hostTimezone: host.timezone,
        slug: booking.eventType.slug,
        previousStartTime,
      })
    );

    res.json({
      message: "Meeting rescheduled successfully",
      booking: updated,
    });
  } catch (error: unknown) {
    console.error("Error rescheduling meeting:", error);
    const prismaError = error as { code?: string };
    if (prismaError.code === "P2002") {
      res.status(400).json({
        error: "This time slot is no longer available.",
      });
    } else {
      res.status(500).json({ error: "Failed to reschedule meeting" });
    }
  }
};
