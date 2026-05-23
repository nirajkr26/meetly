# Meetly — Frontend Client

The frontend for **Meetly**, a scheduling platform built as an SDE Intern Fullstack Assignment.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | JavaScript (React 19) |
| Styling | Tailwind CSS v4 + shadcn/ui primitives |
| API Layer | Native `fetch` wrapper (`src/services/api.js`) |
| Fonts | Geist Sans & Geist Mono (via `next/font/google`) |

---

## Project Structure

```
client/
├── src/
│   ├── app/
│   │   ├── layout.js              # Root layout (fonts, global CSS)
│   │   ├── page.js                # Landing / portal page
│   │   ├── globals.css            # Tailwind config + CSS variables
│   │   ├── dashboard/
│   │   │   ├── layout.js          # Sidebar nav + admin shell
│   │   │   ├── event-types/
│   │   │   │   └── page.js        # CRUD event type cards + modal forms
│   │   │   ├── availability/
│   │   │   │   └── page.js        # Weekly schedule editor + timezone picker
│   │   │   └── meetings/
│   │   │       └── page.js        # Upcoming / past tabs + cancel modal
│   │   └── book/
│   │       └── [slug]/
│   │           ├── page.js        # Public booking calendar + slot picker
│   │           └── confirmation/
│   │               └── page.js    # Booking success confirmation
│   ├── services/
│   │   └── api.js                 # Centralized API client (fetch wrapper)
│   ├── components/
│   │   └── ui/                    # shadcn/ui component primitives
│   └── lib/
│       └── utils.js               # cn() utility (clsx + tailwind-merge)
├── public/                        # Static assets
├── jsconfig.json                  # Path aliases (@/*)
├── next.config.mjs                # Next.js configuration
├── tailwind.config.js             # Tailwind CSS configuration
└── package.json
```

---

## Pages & Routes

| Route | Type | Description |
|-------|------|-------------|
| `/` | Public | Landing portal with project overview and quick links |
| `/dashboard/event-types` | Admin | Create, edit, delete meeting templates with copy-link utility |
| `/dashboard/availability` | Admin | Configure weekly working hours and default timezone |
| `/dashboard/meetings` | Admin | View upcoming bookings and past/cancelled meetings with cancel action |
| `/book/[slug]` | Public | Invitee-facing calendar with timezone-aware slot selection and booking form |
| `/book/[slug]/confirmation` | Public | Post-booking success page with meeting summary |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) or Node.js 18+
- Backend server running on `http://localhost:5001` (see `../server/README.md`)

### Install & Run

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

The client launches at **http://localhost:3000**.

### Environment Variables

Create a `.env.local` file (optional — defaults work for local dev):

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
```

---

## Key Design Decisions

1. **No Auth**: The admin dashboard assumes a default seeded user (Niraj Kumar). No login/signup flow — per assignment requirements.
2. **Custom Calendar**: The public booking page uses a hand-built calendar grid (no external calendar library) to demonstrate DOM manipulation and date math.
3. **Timezone Handling**: Invitees select their display timezone on the booking page; the API returns slots converted to that timezone. All storage is in UTC.
4. **API Service Layer**: A single `api.js` file wraps all backend calls with consistent error handling, keeping components clean.
5. **Responsive Layout**: The dashboard uses a sidebar on desktop that collapses to a top nav on mobile. The booking page stacks vertically on small screens.

---



Set the `NEXT_PUBLIC_API_URL` environment variable in Vercel project settings to point to your deployed backend URL.
