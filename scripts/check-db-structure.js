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

  try {
    console.log('\n=== DATABASE STRUCTURE ===\n')

    // Get all tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    console.log(`Found ${tables.length} tables:\n`)
    
    for (const table of tables) {
      console.log(`\n📋 Table: ${table.table_name}`)
      console.log('─'.repeat(50))
      
      // Get columns for this table
      const columns = await sql`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = ${table.table_name}
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `
      
      if (columns.length === 0) {
        console.log('  (No columns found)')
      } else {
        columns.forEach(col => {
          const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'
          const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : ''
          console.log(`  • ${col.column_name}: ${col.data_type} ${nullable}${defaultVal}`)
        })
      }
      
      // Get row count
      try {
        const [count] = await sql`SELECT COUNT(*) as count FROM ${sql.unsafe(table.table_name)}`
        console.log(`  📊 Rows: ${count.count}`)
      } catch (err) {
        console.log(`  📊 Rows: (unable to count)`)
      }
    }

    console.log('\n=== END OF DATABASE STRUCTURE ===\n')
    
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
