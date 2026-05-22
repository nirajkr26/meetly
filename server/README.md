# Meetly Backend Server 

This is the backend server for **Meetly**, built with **Node.js, TypeScript, Express.js, and Prisma ORM**, using **PostgreSQL (Neon)** as the database engine.

---

## Tech Stack & Core Libraries

* **Runtime**: [Bun](https://bun.sh) (fast JavaScript/TypeScript all-in-one runtime)
* **Framework**: Express.js (TypeScript-first)
* **ORM**: Prisma ORM v7 (configured with the PostgreSQL native adapter `@prisma/adapter-pg`)
* **Validation**: Zod (for request body and parameter validation)
* **Date Utilities**: `date-fns` (for slot generation and date computations)

---

## Setup & Local Installation

### 1. Configure Environment Variables
Create a `.env` file in the root of the `server/` directory:
```env
DATABASE_URL="postgresql://<username>:<password>@<host>/neondb?sslmode=require"
PORT=5001
FRONTEND_URL="http://localhost:3000"
```

### 2. Install Dependencies
```bash
bun install
```

### 3. Generate Prisma Client & Run Migrations
Run the following commands to create the database schema in your Neon instance and generate the client:
```bash
# Push schema to database
bunx prisma db push

# Generate Prisma Client
bunx prisma generate
```

### 4. Seed the Database
We provide a seed script to instantly populate your database with a default user, default weekly availability schedules, event types, and dummy bookings:
```bash
bun prisma/seed.ts
```

### 5. Run the Server
Start the development server:
```bash
# Run in development mode
bun --hot src/index.ts
```

---

## REST API Reference

### Event Types Management
* **`GET /api/event-types`**: List all active event types.
* **`POST /api/event-types`**: Create a new event type (e.g. 15min, 30min).
* **`PUT /api/event-types/:id`**: Update event details (name, duration, description, slug).
* **`DELETE /api/event-types/:id`**: Delete an event type.

### Availability Management
* **`GET /api/availability`**: Fetch the current user's weekly availability schedules and timezone.
* **`PUT /api/availability`**: Update weekly schedule (days of week, start/end times) and active timezone.

### Public Booking Flow (Unauthenticated)
* **`GET /api/book/:slug`**: Fetch the event type metadata by its unique slug.
* **`GET /api/book/:slug/slots?date=YYYY-MM-DD&timezone=UTC`**: Fetch all available, non-conflicting time slots for a specific date, calculated in the invitee's timezone.
* **`POST /api/book/:slug`**: Book a meeting (collects invitee name, email, start/end time, and enforces double-booking prevention).

### Meetings Dashboard (Admin)
* **`GET /api/meetings`**: Retrieve a list of all meetings (split into Upcoming and Past).
* **`PATCH /api/meetings/:id/cancel`**: Cancel an existing meeting and release the time slot.
