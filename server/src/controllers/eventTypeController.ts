import { type Request, type Response } from "express";
import { prisma } from "../../lib/prisma";
import { createEventTypeSchema } from "../utils/validations";


// GET /api/event-types
export const getEventTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      res.status(404).json({ error: "Default user not found. Please seed the database." });
      return;
    }

    const eventTypes = await prisma.eventType.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    res.json(eventTypes);
  } catch (error: any) {
    console.error("Error fetching event types:", error);
    res.status(500).json({ error: "Failed to fetch event types" });
  }
};

// POST /api/event-types
export const createEventType = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      res.status(404).json({ error: "Default user not found. Please seed the database." });
      return;
    }

    const validation = createEventTypeSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.issues[0]?.message ?? "Invalid input" });
      return;
    }

    const { name, slug, description, duration } = validation.data;

    // Check slug uniqueness
    const existing = await prisma.eventType.findUnique({
      where: { slug },
    });

    if (existing) {
      res.status(400).json({ error: "An event type with this URL slug already exists" });
      return;
    }

    const eventType = await prisma.eventType.create({
      data: {
        userId: user.id,
        name,
        slug,
        description,
        duration,
      },
    });

    res.status(201).json(eventType);
  } catch (error: any) {
    console.error("Error creating event type:", error);
    res.status(500).json({ error: "Failed to create event type" });
  }
};

// PUT /api/event-types/:id
export const updateEventType = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const eventTypeId = parseInt(id);

    if (isNaN(eventTypeId)) {
      res.status(400).json({ error: "Invalid event type ID" });
      return;
    }

    const validation = createEventTypeSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.issues[0]?.message ?? "Invalid input" });
      return;
    }

    const { name, slug, description, duration } = validation.data;

    const updated = await prisma.eventType.update({
      where: { id: eventTypeId },
      data: { name, slug, description, duration },
    });

    res.json(updated);
  } catch (error: any) {
    // Prisma Unique Constraint Violation code
    if (error.code === "P2002" && error.meta?.target?.includes("slug")) {
      res.status(400).json({ error: "An event type with this URL slug already exists" });
      return;
    }

    // Prisma Record Not Found code
    if (error.code === "P2025") {
      res.status(404).json({ error: "Event type not found" });
      return;
    }

    console.error("Error updating event type:", error);
    res.status(500).json({ error: "Failed to update event type" });
  }
};

// DELETE /api/event-types/:id
export const deleteEventType = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const eventTypeId = parseInt(id);

    if (isNaN(eventTypeId)) {
      res.status(400).json({ error: "Invalid event type ID" });
      return;
    }

    await prisma.eventType.delete({
      where: { id: eventTypeId },
    });

    res.json({ message: "Event type deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting event type:", error);
    if (error.code === "P2025") {
      res.status(404).json({ error: "Event type not found" });
    } else {
      res.status(500).json({ error: "Failed to delete event type" });
    }
  }
};
