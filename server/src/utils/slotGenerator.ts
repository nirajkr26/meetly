import { format, addMinutes, isBefore, isAfter } from "date-fns";
import { TZDate } from "@date-fns/tz";

interface TimeSlot {
  startTime: string; // ISO String UTC
  endTime: string;   // ISO String UTC
  localTime: string; // HH:MM in requested timezone
}

/**
 * Generates available time slots for a given date, event duration, admin availability, and booked meetings.
 * Handles admin timezone offsets and checks against existing bookings.
 * 
 * @param dateStr "YYYY-MM-DD"
 * @param durationInMinutes Duration of the meeting (e.g. 15, 30, 60)
 * @param adminTimezone Timezone of the admin (e.g. "Asia/Kolkata")
 * @param availability Day availability e.g. { startTime: "09:00", endTime: "17:00" }
 * @param bookedMeetings Array of already booked meetings with startTime and endTime in UTC
 * @param inviteeTimezone Timezone requested by the booking page (e.g. "UTC" or "America/New_York")
 */

export function generateAvailableSlots(
  dateStr: string,
  durationInMinutes: number,
  adminTimezone: string,
  availability: { startTime: string; endTime: string } | null,
  bookedMeetings: Array<{ startTime: Date; endTime: Date }>,
  inviteeTimezone: string = "UTC"
): TimeSlot[] {
  if (!availability) return [];

  const slots: TimeSlot[] = [];

  // Construct start date/time in admin's timezone using TZDate
  const workStart = new TZDate(
    `${dateStr}T${availability.startTime}:00`,
    adminTimezone
  );
  
  const workEnd = new TZDate(
    `${dateStr}T${availability.endTime}:00`,
    adminTimezone
  );
 
  const now = new Date();

  // Generate slots
  let currentSlotStart = workStart;
  while (isBefore(currentSlotStart, workEnd)) {
    const currentSlotEnd = addMinutes(currentSlotStart, durationInMinutes);

    // Ensure slot does not exceed work hours
    if (isAfter(currentSlotEnd, workEnd)) {
      break;
    }

    const slotStartUTC = currentSlotStart;
    const slotEndUTC = currentSlotEnd;

    // 1. Skip if slot is in the past
    if (isBefore(slotStartUTC, now)) {
      currentSlotStart = currentSlotEnd as TZDate;
      continue;
    }

    // 2. Check overlap with booked meetings
    const isBooked = bookedMeetings.some((booking) => {
      // Overlap formula: SlotStart < BookingEnd AND SlotEnd > BookingStart
      return (
        isBefore(slotStartUTC, booking.endTime) &&
        isAfter(slotEndUTC, booking.startTime)
      );
    });

    if (!isBooked) {
      // Format slot localTime in invitee timezone for client display using TZDate
      const dateInInviteeTz = new TZDate(slotStartUTC, inviteeTimezone);
      const inviteeTimeSlotStr = format(dateInInviteeTz, "HH:mm");

      slots.push({
        startTime: slotStartUTC.toISOString(),
        endTime: slotEndUTC.toISOString(),
        localTime: inviteeTimeSlotStr,
      });
    }

    // Move to next slot
    currentSlotStart = currentSlotEnd as TZDate;
  }

  return slots;
}
