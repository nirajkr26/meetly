# Meetly

**Meetly** is a full-stack scheduling app inspired by [Calendly](https://calendly.com). Hosts configure event types and weekly availability; invitees book via a public link with timezone-aware slots and conflict-safe bookings.

---

## Features

- **Event types** — CRUD meeting templates with custom slugs and shareable `/book/[slug]` links
- **Weekly availability** — Per-day hours and host timezone
- **Public booking** — Calendly-style layout: event details, calendar, time slots, invitee form, confirmation page
- **Meetings dashboard** — Upcoming vs past/cancelled tabs, cancel with reason, **reschedule** with slot picker
- **Double-booking protection** — Overlap checks in the API plus a unique `(eventTypeId, startTime)` constraint in PostgreSQL
- **Buffer time** — Per event type; pads slots before/after existing meetings
- **Custom invitee questions** — Configurable on event types; answers stored on bookings
- **Email notifications** — Resend emails on book, cancel, and reschedule (invitee + host)
- **Responsive UI** — Mobile-friendly admin shell (sheet nav) and stacked booking flow on small screens

---

## Tech stack

| Layer | Stack |
|-------|--------|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4, [shadcn/ui](https://ui.shadcn.com) (radix-nova), Lucide icons, Axios |
| **Backend** | Bun, Express 5, TypeScript, Zod, `date-fns` / `@date-fns/tz` |
| **Database** | PostgreSQL (e.g. [Neon](https://neon.tech)) via Prisma ORM v7 (`@prisma/adapter-pg`) |

---

## Repository structure

```
meetly/
├── client/                 # Next.js frontend
│   ├── src/app/            # Routes (landing, dashboard, public booking)
│   ├── src/components/     # MeetlyLogo, DashboardShell, BookingCalendar, ui/*
│   ├── src/services/       # API client (axios)
│   └── README.md           # Frontend-specific docs
├── server/                 # Express API
│   ├── src/controllers/
│   ├── src/routes/
│   ├── prisma/             # Schema, migrations, seed
│   └── README.md           # API reference & server setup
└── Readme.md               # This file
```

---

## Database schema

```mermaid
erDiagram
    User ||--o{ EventType : creates
    User ||--o{ Availability : defines
    EventType ||--o{ Booking : scheduled_for

    User {
        Int id PK
        String email UK
        String name?
        String timezone
        DateTime createdAt
    }

    EventType {
        Int id PK
        Int userId FK
        String name
        String slug UK
        Int duration
        String? description
        Int bufferMinutes
        Json customQuestions
        DateTime createdAt
    }

    Availability {
        Int id PK
        Int userId FK
        Int dayOfWeek
        String startTime
        String endTime
    }

    Booking {
        Int id PK
        Int eventTypeId FK
        String inviteeName
        String inviteeEmail
        Json? inviteeAnswers
        DateTime startTime
        DateTime endTime
        String status
        String? cancellationReason
        DateTime createdAt
    }
```

**Double-booking prevention**

1. **Application** — Before insert, the booking controller rejects ranges that overlap an existing `BOOKED` slot: `slotStart < bookingEnd && slotEnd > bookingStart`.
2. **Database** — `@@unique([eventTypeId, startTime])` on `Booking` guards against race conditions.

---

## Getting started

Run the **server** and **client** in separate terminals.

### Backend (`server/`)

1. Create `server/.env`:

   ```env
   DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require"
   PORT=5001
   FRONTEND_URL="http://localhost:3000"
   RESEND_API_KEY="re_xxxxxxxx"
   RESEND_FROM_EMAIL="Meetly <onboarding@resend.dev>"
   ```

2. Install, migrate, seed, and start:

   ```bash
   cd server
   bun install
   bun run db:push
   bun run db:generate
   bun run db:seed
   bun run dev
   ```

   API base: `http://localhost:5001/api`

See [server/README.md](./server/README.md) for the full REST API reference.

### Frontend (`client/`)

1. Optional `client/.env.local`:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5001/api
   ```

   Defaults to `http://localhost:5001/api` if unset.

2. Install and start:

   ```bash
   cd client
   bun install
   bun run dev
   ```

   App: `http://localhost:3000`

See [client/README.md](./client/README.md) for routes and frontend conventions.

---

## Routes (frontend)

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/dashboard/event-types` | Manage event types (copy link, preview, CRUD dialog) |
| `/dashboard/availability` | Weekly hours + timezone |
| `/dashboard/meetings` | Upcoming / past meetings |
| `/book/[slug]` | Public booking flow |
| `/book/[slug]/confirmation` | Booking success summary |

---

## Assumptions

1. **No admin auth** — Per assignment scope, the dashboard acts as a single default user (seeded as Niraj Kumar). All admin APIs use that user.
2. **Availability** — `dayOfWeek` is 0 (Sunday) through 6 (Saturday); times are `HH:MM` strings. Seed data is typically Mon–Fri; weekends appear unavailable on the public calendar.
3. **Timezones** — Slots are stored in UTC; the booking UI lets invitees pick a display timezone. Slot labels come from the API in that zone.
4. **Network** — Local dev needs reachability to your PostgreSQL host (some networks block DB ports; use VPN/hotspot if Neon connection fails).

---

## Scripts

| Location | Command | Purpose |
|----------|---------|---------|
| `server/` | `bun run dev` | API with hot reload |
| `server/` | `bun run db:seed` | Seed user, availability, event types, sample bookings |
| `client/` | `bun run dev` | Next.js dev server |
| `client/` | `bun run build` | Production build |
| `client/` | `bun run lint` | ESLint |

---

## UI notes

The frontend uses **shadcn/ui** with the project theme in `client/src/app/globals.css` (primary blue, zinc base, CSS variables). Shared pieces include `DashboardShell` (desktop sidebar + mobile sheet), `BookingCalendar`, and primitives under `client/src/components/ui/`.

To add more shadcn components from the `client/` directory:

```bash
bunx shadcn@latest add <component>
```

---

## License

SDE intern assignment submission — use and modify as needed for evaluation.
