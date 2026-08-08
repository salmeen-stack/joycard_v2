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
  console.log('Database URL:', dbUrl.replace(/:[^:]*@/, ':***@'))
  
  const sql = neon(dbUrl)
  console.log('Fixing invitations table columns...')

  try {
    // Rename sent_via_email to sent_via_sms
    await sql`
      ALTER TABLE invitations 
      RENAME COLUMN sent_via_email TO sent_via_sms
    `
    console.log('✓ Renamed sent_via_email to sent_via_sms')
    
    console.log('Invitations table columns fixed successfully!')
  } catch (error) {
    console.error('Error fixing columns:', error)
    process.exit(1)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
