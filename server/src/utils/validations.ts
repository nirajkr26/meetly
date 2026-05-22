import {z} from "zod";

const timeStringRegex = /^([01]\d|2[0-3]):[0-5]\d$/; // "HH:MM"

const availabilityItemSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0 - Sunday, 6 - Saturday
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
});


const createEventTypeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional(),
  duration: z.number().int().positive("Duration must be a positive integer"),
});


const cancelBookingSchema = z.object({
  cancellationReason: z.string().max(500).optional(),
});

export {
    availabilityItemSchema,
    updateAvailabilitySchema,
    createBookingSchema,
    createEventTypeSchema,
    cancelBookingSchema
}