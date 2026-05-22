import { type Request, type Response } from "express";
import { prisma } from "../../lib/prisma";
import {updateAvailabilitySchema} from "../utils/validations";

// GET /api/availability
export const getAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findFirst({
      include: {
        availabilities: {
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: "Default user not found. Please seed the database." });
      return;
    }

    res.json({
      timezone: user.timezone,
      schedule: user.availabilities,
    });
  } catch (error: any) {
    console.error("Error fetching availability:", error);
    res.status(500).json({ error: "Failed to fetch availability" });
  }
};


// PUT /api/availability
export const updateAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findFirst();
    if (!user) {
      res.status(404).json({ error: "Default user not found. Please seed the database." });
      return;
    }

    const validation = updateAvailabilitySchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({ error: validation.error.issues[0]?.message ?? "Invalid input" });
      return;
    }

    const { timezone, schedule } = validation.data;

    // startTime < endTime

    for (const item of schedule) {
      const startParts = item.startTime.split(":");
      const endParts = item.endTime.split(":");
      
      const startH = Number(startParts[0]) || 0;
      const startM = Number(startParts[1]) || 0;
      const endH = Number(endParts[0]) || 0;
      const endM = Number(endParts[1]) || 0;
      
      const startTotal = startH * 60 + startM;
      const endTotal = endH * 60 + endM;

      if (startTotal >= endTotal) {
        res.status(400).json({
          error: `Day ${item.dayOfWeek}: Start time (${item.startTime}) must be before end time (${item.endTime})`,
        });
        return;
      }
    }

    // Run transaction: update timezone and replace availability schedules
    const result = await prisma.$transaction(async (tx) => {
      // Update user timezone
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { timezone },
      });

      // Delete existing availabilities
      await tx.availability.deleteMany({
        where: { userId: user.id },
      });

      // Create new availabilities
      const createdAvailabilities = await (async () => {
        await tx.availability.createMany({
          data: schedule.map((item) => ({
            userId: user.id,
            dayOfWeek: item.dayOfWeek,
            startTime: item.startTime,
            endTime: item.endTime,
          })),
        });
        
        return tx.availability.findMany({
          where: { userId: user.id },
          orderBy: { dayOfWeek: "asc" },
        });
      })();

      return { updatedUser, createdAvailabilities };
    });

    res.json({
      message: "Availability updated successfully",
      timezone: result.updatedUser.timezone,
      schedule: result.createdAvailabilities,
    });
  } catch (error: any) {
    console.error("Error updating availability:", error);
    res.status(500).json({ error: "Failed to update availability" });
  }
};
