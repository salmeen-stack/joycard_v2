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
  console.log('Adding SMS delivery tracking columns...')

  try {
    await sql`
      ALTER TABLE invitations 
      ADD COLUMN IF NOT EXISTS sms_delivery_status TEXT CHECK (sms_delivery_status IN ('pending','delivered','failed'))
    `
    console.log('✓ Added sms_delivery_status column')

    await sql`
      ALTER TABLE invitations 
      ADD COLUMN IF NOT EXISTS sms_delivery_message TEXT
    `
    console.log('✓ Added sms_delivery_message column')

    await sql`
      ALTER TABLE invitations 
      ADD COLUMN IF NOT EXISTS sms_sent_at TIMESTAMPTZ
    `
    console.log('✓ Added sms_sent_at column')

    await sql`
      ALTER TABLE invitations 
      ADD COLUMN IF NOT EXISTS sms_delivered_at TIMESTAMPTZ
    `
    console.log('✓ Added sms_delivered_at column')

    console.log('SMS delivery tracking columns added successfully!')
  } catch (error) {
    console.error('Error adding columns:', error)
    process.exit(1)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
