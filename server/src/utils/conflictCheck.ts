import { prisma } from "../../lib/prisma";
import { getBlockedInterval, intervalsOverlap } from "./bookingHelpers";

/**
 * Find a BOOKED meeting for the same host that overlaps the requested window,
 * optionally excluding one booking (for reschedule).
 */
export async function findHostBookingConflict(
  hostUserId: number,
  startUtc: Date,
  endUtc: Date,
  bufferMinutes: number,
  excludeBookingId?: number
): Promise<boolean> {
  const bookings = await prisma.booking.findMany({
    where: {
      status: "BOOKED",
      eventType: { userId: hostUserId },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      startTime: { lt: endUtc },
      endTime: { gt: startUtc },
    },
    include: {
      eventType: { select: { bufferMinutes: true } },
    },
  });

  for (const booking of bookings) {
    const bookingBuffer = Math.max(bufferMinutes, booking.eventType.bufferMinutes);
    const blocked = getBlockedInterval(booking.startTime, booking.endTime, bookingBuffer);
    const requestBlocked = getBlockedInterval(startUtc, endUtc, bufferMinutes);

    if (intervalsOverlap(requestBlocked.start,requestBlocked.end,blocked.start,blocked.end)) {
      return true;
    }
  }

  return false;
}
