import { addMinutes, isBefore, isAfter } from "date-fns";

export type CustomQuestion = {
  id: string;
  label: string;
  required: boolean;
};

export function parseCustomQuestions(value: unknown): CustomQuestion[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (q): q is CustomQuestion =>
      typeof q === "object" &&
      q !== null &&
      typeof (q as CustomQuestion).id === "string" &&
      typeof (q as CustomQuestion).label === "string"
  );
}

export function validateInviteeAnswers(
  questions: CustomQuestion[],
  answers: Record<string, string> | undefined
): string | null {
  const data = answers ?? {};
  for (const q of questions) {
    const answer = data[q.id]?.trim() ?? "";
    if (q.required && !answer) {
      return `Answer required: ${q.label}`;
    }
  }
  return null;
}

export function validateBookingDuration(
  start: Date,
  end: Date,
  durationMinutes: number
): string | null {
  if (isBefore(end, start) || start.getTime() === end.getTime()) {
    return "End time must be after start time";
  }
  const expectedMs = durationMinutes * 60 * 1000;
  if (end.getTime() - start.getTime() !== expectedMs) {
    return `Meeting duration must be exactly ${durationMinutes} minutes`;
  }
  return null;
}

/** Expand booking interval by buffer for conflict detection */
export function getBlockedInterval(
  start: Date,
  end: Date,
  bufferMinutes: number
): { start: Date; end: Date } {
  return {
    start: addMinutes(start, -bufferMinutes),
    end: addMinutes(end, bufferMinutes),
  };
}

export function intervalsOverlap(
  slotStart: Date,
  slotEnd: Date,
  blockStart: Date,
  blockEnd: Date
): boolean {
  return isBefore(slotStart, blockEnd) && isAfter(slotEnd, blockStart);
}

export function formatDateTimeForEmail(iso: string, timeZone = "UTC"): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone,
  });
}
