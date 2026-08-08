#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

// Load .env file manually
const envPath = path.join(__dirname, '../.env')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const [, key, value] = match
      process.env[key.trim()] = value.trim()
    }
  })
}

const { neon } = require('@neondatabase/serverless')

async function main() {
  if (!process.env.DATABASE_URL) { console.error('DATABASE_URL not set'); process.exit(1) }
  const sql = neon(process.env.DATABASE_URL)
  console.log('Adding message_templates table...')

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS message_templates (
        id          SERIAL PRIMARY KEY,
        name        TEXT NOT NULL,
        channel     TEXT NOT NULL CHECK (channel IN ('sms','whatsapp')),
        content     TEXT NOT NULL,
        is_default  BOOLEAN NOT NULL DEFAULT FALSE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    console.log('✓ Created message_templates table')

    await sql`CREATE INDEX IF NOT EXISTS idx_templates_channel ON message_templates(channel)`
    console.log('✓ Created index on channel')

    // Seed default templates
    await sql`
      INSERT INTO message_templates (name, channel, content, is_default)
      VALUES 
        ('Default SMS', 'sms', 'Hi {guest_name}! You''re invited to {event_title}. View your invitation: {invite_url}', true),
        ('Formal SMS', 'sms', 'Dear {guest_name}, You are cordially invited to attend {event_title}. Please view your invitation at: {invite_url}', false),
        ('Default WhatsApp', 'whatsapp', '🎉 *You''re Invited!*\n\nDear *{guest_name}*,\n\n✨ *{event_title}*\n📅 {event_date}\n📍 {event_location}\n🎟️ {card_type}\n👔 Dress Code: {dress_code}\n\n👇 *View your invitation & QR code:*\n{invite_url}\n\n_Personal & non-transferable._', true)
      ON CONFLICT DO NOTHING
    `
    console.log('✓ Seeded default templates')

    console.log('Message templates table added successfully!')
  } catch (error) {
    console.error('Error adding table:', error)
    process.exit(1)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
