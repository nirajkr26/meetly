import { prisma } from "../lib/prisma";

async function main() {
  console.log("Seeding database");

  // Clean existing data
  console.log("Cleaning existing data");
  await prisma.booking.deleteMany();
  await prisma.availability.deleteMany();
  await prisma.eventType.deleteMany();
  await prisma.user.deleteMany();

  // Create Default Admin User
  console.log("Creating default admin user");
  const defaultUser = await prisma.user.create({
    data: {
      name: "Niraj Kumar",
      email: "nirajkumargupta2642006@gmail.com",
      timezone: "Asia/Kolkata",
    },
  });

  console.log(`Default user created: ${defaultUser.name} (${defaultUser.email})`);

  // Create Default Availability (Monday - Friday, 9:00 AM - 5:00 PM)
  console.log("Creating availability schedule");
  const availabilities = [];
  // 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday
  for (let day = 1; day <= 5; day++) {
    availabilities.push({
      userId: defaultUser.id,
      dayOfWeek: day,
      startTime: "09:00",
      endTime: "17:00",
    });
  }

  await prisma.availability.createMany({
    data: availabilities,
  });
  console.log("Weekly availability seeded.");

  // Create Event Types
  console.log("Creating event types");
  const event1 = await prisma.eventType.create({
    data: {
      userId: defaultUser.id,
      name: "15 Minute Coffee Chat",
      slug: "15-min-coffee",
      description: "A quick informal coffee chat to connect and catch up.",
      duration: 15,
    },
  });

  const event2 = await prisma.eventType.create({
    data: {
      userId: defaultUser.id,
      name: "30 Minute Project Sync",
      slug: "30-min-sync",
      description: "Weekly project review, sync on progress, and clear blockers.",
      duration: 30,
    },
  });

  const event3 = await prisma.eventType.create({
    data: {
      userId: defaultUser.id,
      name: "60 Minute SDE Interview",
      slug: "60-min-interview",
      description: "Deep dive technical screening and architectural discussion.",
      duration: 60,
    },
  });

  console.log("Event types seeded successfully.");

  // Create Sample Bookings (Future dates)
  console.log("Creating sample bookings");
  const nextMonday = new Date();
  nextMonday.setDate(nextMonday.getDate() + ((1 + 7 - nextMonday.getDay()) % 7 || 7));
  nextMonday.setUTCHours(4, 30, 0, 0); // 10:00 AM IST (4:30 AM UTC)

  const nextTuesday = new Date();
  nextTuesday.setDate(nextTuesday.getDate() + ((2 + 7 - nextTuesday.getDay()) % 7 || 7));
  nextTuesday.setUTCHours(8, 30, 0, 0); // 2:00 PM IST (8:30 AM UTC)

  await prisma.booking.createMany({
    data: [
      {
        eventTypeId: event2.id,
        inviteeName: "Niraj Kr",
        inviteeEmail: "niraj.kumar232@lpu.in",
        startTime: nextMonday,
        endTime: new Date(nextMonday.getTime() + 30 * 60 * 1000), // +30 mins
        status: "BOOKED",
      },
      {
        eventTypeId: event3.id,
        inviteeName: "Ashutosh Shrimal",
        inviteeEmail: "pshrimal000@gmail.com",
        startTime: nextTuesday,
        endTime: new Date(nextTuesday.getTime() + 60 * 60 * 1000), // +60 mins
        status: "BOOKED",
      },
    ],
  });

  console.log("Sample bookings seeded.");
  console.log("Database seeding completed");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
