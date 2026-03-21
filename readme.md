# joycard — Invitation Management System

> A complete digital invitation platform. Elegant card delivery, WhatsApp & Email sending, and secure QR check-in — all in one system.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [User Roles](#user-roles)
- [Screenshots & Pages](#screenshots--pages)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the App](#running-the-app)
- [Default Credentials](#default-credentials)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Authentication Architecture](#authentication-architecture)
- [How the Guest Invitation Flow Works](#how-the-guest-invitation-flow-works)
- [Design System](#design-system)
- [Security Notes](#security-notes)
- [Troubleshooting](#troubleshooting)

---

## Overview

joycard is a full-stack invitation management system built with Next.js 14 (App Router). It manages three distinct roles — Admin, Organizer, and Staff — each with their own dashboard, responsibilities, and access controls.

Guests receive a personalised digital invitation via Email or WhatsApp. The invitation contains a link to a beautiful 3D flip card that reveals a secure, one-time QR code. On the day of the event, staff scan the QR code at the entrance for instant check-in.

---

## Features

### Admin
- Create, edit, and delete events
- Create and manage organizer and staff accounts
- Assign organizers to events with a configurable guest limit
- Assign staff to events for check-in duties
- Monitor all guests across all events
- Full analytics dashboard with invitation funnel and per-event breakdown

### Organizer
- View assigned events and remaining guest slots
- Add guests with name, contact, channel (Email or WhatsApp), card type, and dress code
- Upload a pre-designed invitation card image for each guest
- Send invitations — Email is sent via Gmail SMTP, WhatsApp opens a pre-filled message link
- Track delivery status and check-in status per guest

### Staff
- View assigned events grouped by Today, Upcoming, and Past
- Open the live QR code scanner directly from the event card
- Scan guest QR codes at the entrance
- See instant check-in result — valid, already scanned, or unrecognised
- View a real-time log of recent check-ins for the current session

### Guest Experience
- Receives a personalised WhatsApp message or styled HTML email with an invitation link
- Opens the link to see their invitation card with a smooth 3D flip animation
- Back of the card shows: unique QR code, guest name, card type, dress code, and event date
- After check-in, the card displays a confirmation timestamp

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Neon Serverless |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| Email | Nodemailer + Gmail SMTP |
| WhatsApp | Direct wa.me link (no API needed) |
| QR Generation | qrcode (server + client) |
| QR Scanning | html5-qrcode (camera-based, client-side) |
| File Upload | Native Next.js formData to local filesystem |
| Fonts | Cormorant Garamond (display) + Jost (body) |
| Notifications | react-hot-toast |
| Date Handling | date-fns v3 |

---

## User Roles

### Admin
The system owner. Has access to every feature. Uses a **dedicated admin login page** at `/admin/login` that is completely separate from the organizer and staff login.

### Organizer
Responsible for inviting guests. Is assigned to specific events by the admin, with a cap on how many guests they can add. Uses the **team login page** at `/login` and selects "Organizer" as their role.

### Staff
Operates the entrance check-in on event day. Is assigned to specific events by the admin and can only scan QR codes for those events. Uses the **team login page** at `/login` and selects "Staff" as their role.

---

## Screenshots & Pages

| URL | Description |
|---|---|
| `/` | Landing page |
| `/login` | Team login (Organizer + Staff with role selector) |
| `/admin/login` | Admin-only login portal |
| `/admin` | Admin dashboard with counters and event table |
| `/admin/events` | Create, edit, delete events |
| `/admin/users` | Create organizer and staff accounts |
| `/admin/assignments` | Assign organizers and staff to events |
| `/admin/guests` | View all guests across all events |
| `/admin/analytics` | Charts, funnel, and per-event breakdown |
| `/organizer` | Organizer dashboard with assigned events |
| `/organizer/guests` | Add and manage guests per event |
| `/organizer/send` | Upload card, send via Email or WhatsApp |
| `/staff` | Staff event list (Today / Upcoming / Past) |
| `/staff/scan` | Live camera QR scanner |
| `/invite/[token]` | Public guest invitation card with 3D flip |

---

## Getting Started

### Prerequisites

- Node.js 18 or higher
- A free [Neon](https://neon.tech) account (PostgreSQL)
- A Gmail account with an App Password (for email sending)

### Installation

```bash
# 1. Extract the zip and enter the project folder
cd joycard

# 2. Install dependencies
npm install
```

### Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

Open `.env.local` and set the following:

```env
# Neon PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# JWT secret — must be a long random string (min 32 characters)
# Generate one: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your-64-character-random-string

# The base URL of your app (no trailing slash)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Gmail SMTP credentials
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx
```

#### How to get DATABASE_URL

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Click **Connect** and copy the connection string
4. Paste it as `DATABASE_URL` in your `.env.local`

#### How to get GMAIL_APP_PASSWORD

1. Go to your Google Account → **Security**
2. Enable **2-Step Verification** if not already on
3. Search for **App Passwords**
4. Select **Mail** and generate a new password
5. Copy the 16-character password (spaces are optional) into `GMAIL_APP_PASSWORD`

> Email sending is optional. If you skip Gmail setup, WhatsApp sending still works fully. Email sends will silently fail and log an error in the console.

### Database Setup

Push the full schema to your Neon database. This creates all tables and inserts the default admin account:

```bash
npm run db:push
```

You will see output like:

```
Connecting to Neon...
Schema pushed successfully!
Admin: admin@joycard.com / Admin@1234
Change this password after first login!
```

> Running `npm run db:push` again will **drop and recreate all tables**. Do not run it on a database with real data unless you intend to reset everything.

### Running the App

```bash
# Always clear the Next.js build cache before first run
# This prevents stale compiled code from being served
rm -rf .next

npm run dev
```

The app is now running at [http://localhost:3000](http://localhost:3000).

---

## Default Credentials

| Role | Login Page | Email | Password |
|---|---|---|---|
| Admin | `/admin/login` | admin@joycard.com | Admin@1234 |

> **Change the admin password immediately after your first login.** Go to Admin → Users, delete the default admin, and create a new one with a strong password.

Staff and organizer accounts are created by the admin through the Users page.

---

## Project Structure

```
joycard/
├── scripts/
│   └── push-schema.js          # Database schema setup script
├── public/
│   └── uploads/                # Uploaded invitation card images
├── src/
│   ├── middleware.ts            # Edge middleware — route protection for all pages
│   ├── types/
│   │   └── index.ts             # Shared TypeScript interfaces
│   ├── lib/
│   │   ├── constants.ts         # AUTH_COOKIE_NAME and other shared constants
│   │   ├── auth.ts              # JWT signing/verification + password hashing
│   │   ├── apiAuth.ts           # Route Handler auth guards (requireRole, requireAuth)
│   │   ├── db.ts                # Neon database connection
│   │   ├── email.ts             # Gmail SMTP email sender
│   │   └── qr.ts                # QR token generation + WhatsApp link builder
│   ├── components/
│   │   └── shared/
│   │       └── Sidebar.tsx      # Collapsible sidebar (fetches own user data client-side)
│   └── app/
│       ├── globals.css          # Global styles, design tokens, utility classes
│       ├── layout.tsx           # Root layout with fonts and Toaster
│       ├── page.tsx             # Landing page
│       ├── login/
│       │   └── page.tsx         # Team login (Organizer + Staff, with role toggle)
│       ├── invite/[token]/
│       │   └── page.tsx         # Public guest invitation card with 3D flip + QR
│       ├── admin/
│       │   ├── login/page.tsx   # Admin-only login portal
│       │   ├── layout.tsx       # Admin shell layout
│       │   ├── page.tsx         # Admin dashboard
│       │   ├── events/          # Event management
│       │   ├── users/           # User management
│       │   ├── assignments/     # Assign organizers and staff to events
│       │   ├── guests/          # View all guests
│       │   └── analytics/       # Charts and funnel
│       ├── organizer/
│       │   ├── layout.tsx
│       │   ├── page.tsx         # Organizer dashboard
│       │   ├── guests/          # Add and manage guests
│       │   └── send/            # Send invitations
│       ├── staff/
│       │   ├── layout.tsx
│       │   ├── page.tsx         # Staff event list
│       │   └── scan/            # QR scanner
│       └── api/
│           ├── auth/
│           │   ├── login/       # POST — team login (organizer/staff)
│           │   ├── admin-login/ # POST — admin login
│           │   ├── logout/      # POST — clear auth cookie
│           │   └── me/          # GET  — return current user from cookie
│           ├── events/          # GET all, POST create, PUT/DELETE by id
│           ├── guests/          # GET, POST, DELETE — with role-based scoping
│           ├── invitations/     # GET, PUT — send and update invitations
│           │   ├── upload/      # POST — upload card image
│           │   └── verify/[token]/ # GET (public) + POST (staff scan)
│           ├── admin/
│           │   ├── users/       # GET, POST, PUT, DELETE
│           │   ├── analytics/   # GET — dashboard stats
│           │   └── assignments/ # GET, POST, DELETE — organizer assignments
│           └── staff/
│               └── events/      # GET, POST, DELETE — staff assignments
```

---

## Database Schema

```sql
users
  id, name, email, password, role (admin|organizer|staff), created_at

events
  id, title, date, location, description, created_at

guests
  id, event_id → events, name, contact, channel (email|whatsapp), created_at

invitations
  id, guest_id → guests, card_url, card_type (single|double),
  dress_code, qr_token (unique), scanned_at, sent_via_email,
  sent_via_whatsapp, created_at

organizer_assignments
  id, organizer_id → users, event_id → events, guest_limit
  UNIQUE (organizer_id, event_id)

staff_events
  id, staff_id → users, event_id → events
  UNIQUE (staff_id, event_id)
```

Every guest automatically gets an invitation record with a unique UUID QR token when they are added. The token is generated server-side and never reused.

---

## API Reference

All authenticated endpoints read the auth cookie from the incoming request. Unauthenticated requests to page routes are redirected to the appropriate login page by middleware. Unauthenticated requests to API routes receive a `401 Unauthorized` JSON response.

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Organizer or staff login (requires `role` field) |
| POST | `/api/auth/admin-login` | Public | Admin login |
| POST | `/api/auth/logout` | Public | Clear auth cookie |
| GET | `/api/auth/me` | Cookie | Return current user payload |

### Events

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/events` | Any role | List all events with guest counts |
| POST | `/api/events` | Admin | Create event |
| PUT | `/api/events/[id]` | Admin | Update event |
| DELETE | `/api/events/[id]` | Admin | Delete event and all guests |

### Guests

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/guests?event_id=` | Any role | List guests (scoped by role) |
| POST | `/api/guests` | Admin, Organizer | Add guest + create invitation |
| DELETE | `/api/guests/[id]` | Admin, Organizer | Delete guest |

### Invitations

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/invitations?token=` | Public | Get invitation by QR token |
| GET | `/api/invitations?guest_id=` | Admin, Organizer | Get invitation for guest |
| PUT | `/api/invitations` | Admin, Organizer | Update card, send email/WhatsApp |
| POST | `/api/invitations/upload` | Admin, Organizer | Upload card image |
| GET | `/api/invitations/verify/[token]` | Public | Guest card page data |
| POST | `/api/invitations/verify/[token]` | Admin, Staff | Scan and check-in |

### Admin

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/users` | Admin | List users (filter by `?role=`) |
| POST | `/api/admin/users` | Admin | Create user |
| PUT | `/api/admin/users/[id]` | Admin | Update user |
| DELETE | `/api/admin/users/[id]` | Admin | Delete user |
| GET | `/api/admin/analytics` | Admin | Dashboard stats and event breakdown |
| GET | `/api/admin/assignments` | Admin, Organizer | List organizer assignments |
| POST | `/api/admin/assignments` | Admin | Create assignment |
| DELETE | `/api/admin/assignments` | Admin | Remove assignment |
| GET | `/api/staff/events` | Admin, Staff | List staff event assignments |
| POST | `/api/staff/events` | Admin | Assign staff to event |
| DELETE | `/api/staff/events` | Admin | Remove staff from event |

---

## Authentication Architecture

This section explains the design decisions that prevent the login redirect loop that plagued earlier versions.

### The Cookie Problem in Next.js 14

In Next.js 14 Route Handlers, `cookies().set()` from `next/headers` **silently fails** — it does not throw, it does not warn, the cookie simply never reaches the browser. This is the single most common cause of "login works but redirects back" bugs in Next.js 14 applications.

**The fix:** All cookie writes use `response.cookies.set()` directly on the `NextResponse` object before it is returned.

```ts
// WRONG — silently fails in Route Handlers
cookies().set('token', value)

// CORRECT — guaranteed to reach the browser
const response = NextResponse.json({ user })
response.cookies.set('token', value, { httpOnly: true, ... })
return response
```

### Why Layouts Have No Auth Logic

All three dashboard layouts (`admin/layout.tsx`, `organizer/layout.tsx`, `staff/layout.tsx`) contain **zero authentication code**. No `getCurrentUser()`, no `redirect()`. This is intentional.

Next.js Server Component layouts can be partially cached. If a layout calls `cookies()` and the cookie is not yet visible in the cache at render time, it returns `null`, triggers `redirect('/login')`, and the user bounces back before the page ever loads.

The middleware (`src/middleware.ts`) handles all protection instead. It runs on the Edge runtime at the request level, reads cookies directly from raw request headers, and is always reliable — no caching, no race conditions.

### The Single Source of Truth

The auth cookie name `'joycard_token'` is defined once in `src/lib/constants.ts` and imported everywhere. If it were hardcoded as a string literal in multiple files, a single typo would cause the cookie to be written under one name and read under another — completely silent, with no error anywhere.

### Module-Level Throws

`src/lib/auth.ts` never throws at module-load scope. The `JWT_SECRET` check is inside a `getSecret()` function that is called only when a token is actually signed or verified. This matters because `src/middleware.ts` imports from `src/lib/auth.ts`. If auth.ts threw at the top level when `JWT_SECRET` was missing, the middleware module would fail to load, crashing every single request — including the login page itself — in an infinite redirect loop.

---

## How the Guest Invitation Flow Works

```
Admin creates event
        ↓
Admin assigns organizer to event (sets guest limit)
        ↓
Organizer adds guest (name, contact, email/WhatsApp, card type, dress code)
  → System auto-creates invitation record with unique UUID QR token
        ↓
Organizer optionally uploads a pre-designed card image
        ↓
Organizer sends the invitation:
  • Email → Nodemailer sends HTML email with invite link
  • WhatsApp → System builds wa.me link, organizer clicks to open WhatsApp
        ↓
Guest opens link: /invite/[token]
  → Sees their invitation card (uploaded image or default design)
  → Taps the card → 3D flip animation → QR code on the back
        ↓
Event day: Staff opens /staff/scan
  → Activates camera QR scanner
  → Scans guest QR code
  → System verifies token, checks event assignment, marks scanned_at
  → Shows: ✅ Valid / ⚠️ Already scanned / ❌ Invalid
```

---

## Design System

### Colour Palette

| Token | Hex | Use |
|---|---|---|
| Navy 900 | `#0F172A` | Page background |
| Navy 800 | `#1E293B` | Card / sidebar background |
| Gold | `#D4AF37` | Primary accent, buttons, headings |
| Gold Light | `#E8CC6A` | Button gradients, hover states |
| Teal | `#2DD4BF` | Secondary accent, check-in success |
| Cream | `#F8FAFC` | Primary text |

### Typography

- **Display font** — Cormorant Garamond (serif) — used for headings, event titles, guest names
- **Body font** — Jost (sans-serif) — used for all UI text, labels, tables

### CSS Utility Classes

These custom classes are defined in `globals.css` and used throughout:

| Class | Description |
|---|---|
| `.glass` | Glassmorphism card (white border) |
| `.glass-gold` | Glassmorphism card (gold border) |
| `.btn-gold` | Primary gold gradient button |
| `.btn-teal` | Secondary teal gradient button |
| `.btn-ghost` | Transparent outlined button |
| `.input` | Styled form input field |
| `.label` | Uppercase input label |
| `.badge-gold` | Gold pill badge |
| `.badge-teal` | Teal pill badge |
| `.badge-slate` | Muted grey pill badge |
| `.badge-rose` | Red pill badge |
| `.table` | Styled data table |
| `.stat-card` | Analytics stat card |
| `.nav-link` | Sidebar navigation link |
| `.divider` | Horizontal gold gradient divider |

---

## Security Notes

- Passwords are hashed with bcrypt at 12 rounds before storage
- JWT tokens expire after 7 days and are stored in `httpOnly` cookies (not accessible to JavaScript)
- Login uses constant-time password comparison to prevent timing attacks that reveal whether an email exists
- File uploads are validated by MIME type (not filename extension) — the file extension is derived from the MIME type
- Uploaded files are given random UUID-based names, never the original user-supplied filename
- QR tokens are UUID v4 — globally unique, cryptographically random, single-use
- Staff can only scan QR codes for events they are explicitly assigned to
- Organizers can only view and manage guests for their assigned events
- All API routes verify role independently of middleware (defence in depth)

---

## Troubleshooting

### Login redirects back to the login page immediately

This was the primary bug in earlier versions and has been eliminated by architecture in v2. If you still see it, the most likely cause is a stale Next.js build cache.

```bash
rm -rf .next
npm run dev
```

### `DATABASE_URL not set` error on startup

You have not created your `.env.local` file or it is missing the `DATABASE_URL` variable.

```bash
cp .env.example .env.local
# Then fill in your Neon connection string
```

### `JWT_SECRET is not set` error when logging in

Add `JWT_SECRET` to your `.env.local` file. Generate a secure value:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Email sends are failing

Check that:
1. `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set in `.env.local`
2. You are using a **Gmail App Password** (16 characters), not your regular Gmail password
3. 2-Step Verification is enabled on the Gmail account (App Passwords require it)

Email failures are logged to the server console but do not crash the app. WhatsApp sending is not affected.

### QR scanner camera does not start

The browser requires `https` to access the camera, except for `localhost`. If you are hosting the app on a custom domain during development, you must use a valid SSL certificate or a tunnel like [ngrok](https://ngrok.com).

### `npm run db:push` fails

Confirm that:
1. Your `DATABASE_URL` in `.env.local` points to a live Neon database
2. The Neon project is not paused (free tier projects auto-pause after inactivity — click **Resume** in the Neon dashboard)

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Build the app for production |
| `npm run start` | Start the production server (requires build first) |
| `npm run lint` | Run ESLint across the project |
| `npm run db:push` | Push the database schema to Neon (destructive — drops all tables first) |

---

## License

Private project. All rights reserved.
