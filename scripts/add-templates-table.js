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
  
  // Remove channel_binding from connection string if present
  let dbUrl = process.env.DATABASE_URL
  dbUrl = dbUrl.replace(/channel_binding=require/g, '')
  dbUrl = dbUrl.replace(/&$/, '')
  
  console.log('Connecting to database...')
  const sql = neon(dbUrl)
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
    const defaultTemplates = [
      {
        name: 'Default SMS Invitation',
        channel: 'sms',
        content: 'Hi {guest_name}! You are invited to {event_title}. Your invitation token: {invite_token}',
        is_default: true
      },
      {
        name: 'Default WhatsApp Invitation',
        channel: 'whatsapp',
        content: 'Hi {guest_name}! You are invited to {event_title}. View your invitation: {invite_url}',
        is_default: true
      }
    ]

    for (const template of defaultTemplates) {
      await sql`
        INSERT INTO message_templates (name, channel, content, is_default)
        VALUES (${template.name}, ${template.channel}, ${template.content}, ${template.is_default})
        ON CONFLICT DO NOTHING
      `
    }
    console.log('✓ Seeded default templates')

    console.log('Message templates table added successfully!')
  } catch (error) {
    console.error('Error adding table:', error)
    process.exit(1)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
