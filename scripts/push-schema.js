#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' })
const { neon }  = require('@neondatabase/serverless')
const bcrypt    = require('bcryptjs')

async function main() {
  if (!process.env.DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1) }
  const sql = neon(process.env.DATABASE_URL)
  console.log('Connecting to Neon...')

  await sql`DROP TABLE IF EXISTS organizer_assignments CASCADE`
  await sql`DROP TABLE IF EXISTS staff_events CASCADE`
  await sql`DROP TABLE IF EXISTS invitations CASCADE`
  await sql`DROP TABLE IF EXISTS guests CASCADE`
  await sql`DROP TABLE IF EXISTS events CASCADE`
  await sql`DROP TABLE IF EXISTS users CASCADE`

  await sql`CREATE TABLE users (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    password   TEXT NOT NULL,
    role       TEXT NOT NULL CHECK (role IN ('admin','organizer','staff')),
    verified   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`
  await sql`CREATE INDEX idx_users_email ON users(email)`

  await sql`CREATE TABLE events (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    date        TIMESTAMPTZ NOT NULL,
    location    TEXT NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`

  await sql`CREATE TABLE guests (
    id         SERIAL PRIMARY KEY,
    event_id   INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    contact    TEXT NOT NULL,
    channel    TEXT NOT NULL CHECK (channel IN ('email','whatsapp')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`
  await sql`CREATE INDEX idx_guests_event ON guests(event_id)`

  await sql`CREATE TABLE invitations (
    id                SERIAL PRIMARY KEY,
    guest_id          INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    card_url          TEXT,
    card_type         TEXT NOT NULL DEFAULT 'single' CHECK (card_type IN ('single','double')),
    dress_code        TEXT NOT NULL DEFAULT 'Smart Casual',
    qr_token          TEXT NOT NULL UNIQUE,
    scanned_at        TIMESTAMPTZ,
    sent_via_email    BOOLEAN NOT NULL DEFAULT FALSE,
    sent_via_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`
  await sql`CREATE INDEX idx_inv_guest   ON invitations(guest_id)`
  await sql`CREATE INDEX idx_inv_token   ON invitations(qr_token)`

  await sql`CREATE TABLE staff_events (
    id       SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE(staff_id, event_id)
  )`

  await sql`CREATE TABLE organizer_assignments (
    id           SERIAL PRIMARY KEY,
    organizer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id     INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    guest_limit  INTEGER NOT NULL DEFAULT 10,
    UNIQUE(organizer_id, event_id)
  )`

  // Seed admin
  const adminPw = await bcrypt.hash('Admin@1234', 12)
  await sql`
    INSERT INTO users (name, email, password, role, verified)
    VALUES ('System Admin', 'admin@joycard.com', ${adminPw}, 'admin', TRUE)
    ON CONFLICT (email) DO NOTHING
  `

  console.log('Schema pushed successfully!')
  console.log('Admin: admin@joycard.com / Admin@1234')
  console.log('Change this password after first login!')
}

main().catch(e => { console.error(e); process.exit(1) })
