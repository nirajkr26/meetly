import { z } from "zod";

const timeStringRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

const customQuestionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1, "Question label is required"),
  required: z.boolean().default(true),
});

const availabilityItemSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(timeStringRegex, "Start time must be in HH:MM format"),
  endTime: z.string().regex(timeStringRegex, "End time must be in HH:MM format"),
});

const updateAvailabilitySchema = z.object({
  timezone: z.string().min(1, "Timezone is required"),
  schedule: z.array(availabilityItemSchema),
});

const createBookingSchema = z.object({
  inviteeName: z.string().min(1, "Name is required"),
  inviteeEmail: z.string().email("Invalid email address"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  inviteeAnswers: z.record(z.string(), z.string()).optional(),
});

const createEventTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional(),
  duration: z.number().int().positive("Duration must be a positive integer"),
  bufferMinutes: z.number().int().min(0).max(120).optional().default(0),
  customQuestions: z.array(customQuestionSchema).max(10).optional().default([]),
});

const cancelBookingSchema = z.object({
  cancellationReason: z.string().max(500).optional(),
});

const rescheduleBookingSchema = z.object({
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

export {
  availabilityItemSchema,
  updateAvailabilitySchema,
  createBookingSchema,
  createEventTypeSchema,
  cancelBookingSchema,
  rescheduleBookingSchema,
  customQuestionSchema,
};
