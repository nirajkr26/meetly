import { type Request, type Response } from "express";
import { prisma } from "../../lib/prisma";
import { cancelBookingSchema } from "../utils/validations";


// GET /api/meetings
export const getMeetings = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      res.status(404).json({ error: "Default user not found. Please seed the database." });
      return;
    }

    const now = new Date();

    // Fetch all bookings for all event types created by this default user
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
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    // Segment into upcoming and past
    const upcoming = bookings.filter(
      (b) => new Date(b.startTime) >= now && b.status === "BOOKED"
    );
    const past = bookings.filter(
      (b) => new Date(b.startTime) < now || b.status === "CANCELLED"
    );

    // Sort past bookings in reverse chronological order (newest first)
    past.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

    res.json({
      upcoming,
      past,
    });
  } catch (error: any) {
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
      res.status(400).json({ error: validation.error.issues[0]?.message ?? "Invalid input" });
      return;
    }

    const { cancellationReason } = validation.data;

    // Check if booking exists
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }

    if (booking.status === "CANCELLED") {
      res.status(400).json({ error: "Meeting is already cancelled" });
      return;
    }

    // Update meeting status to CANCELLED
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancellationReason: cancellationReason || "Cancelled by admin",
      },
    });

    res.json({
      message: "Meeting cancelled successfully",
      booking: updated,
    });
  } catch (error: any) {
    console.error("Error cancelling meeting:", error);
    res.status(500).json({ error: "Failed to cancel meeting" });
  }
};
