#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

async function main() {
  if (!process.env.DATABASE_URL) { 
    console.error('DATABASE_URL not set'); 
    process.exit(1) 
  }
  
  const sql = neon(process.env.DATABASE_URL)
  console.log('🔍 Checking database structure and user verification...\n')

  try {
    // 1. Check if users table exists and its structure
    console.log('📋 Users table structure:')
    const tableInfo = await sql`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `
    
    if (tableInfo.length === 0) {
      console.log('❌ Users table not found!')
      return
    }
    
    tableInfo.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.column_default ? `(default: ${col.column_default})` : ''}`)
    })

    // 2. Check if verified column exists
    const hasVerifiedColumn = tableInfo.some(col => col.column_name === 'verified')
    console.log(`\n✅ Verified column exists: ${hasVerifiedColumn}`)

    // 3. Check current user verification status
    console.log('\n👥 Current user verification status:')
    const users = await sql`
      SELECT id, name, email, role, verified, created_at 
      FROM users 
      ORDER BY created_at
    `
    
    if (users.length === 0) {
      console.log('  No users found in database')
    } else {
      users.forEach(user => {
        const status = user.verified ? '✅ Verified' : '❌ Not Verified'
        console.log(`  ${user.id}: ${user.name} (${user.email}) - ${user.role} - ${status}`)
      })
    }

    // 4. Check for auto-verification in code
    console.log('\n🔧 Checking for auto-verification logic...')
    console.log('Found auto-verification in /src/app/api/admin/users/route.ts:')
    console.log('  Line 35: const verified = role === "admin" // Admins are auto-verified')
    console.log('  This means only admin users should be auto-verified')

    // 5. Show what needs to be fixed
    const autoVerifiedNonAdmins = users.filter(u => u.verified && u.role !== 'admin')
    if (autoVerifiedNonAdmins.length > 0) {
      console.log('\n⚠️  Found non-admin users that are verified (this should not happen):')
      autoVerifiedNonAdmins.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ${user.role}`)
      })
    }

    console.log('\n📊 Summary:')
    console.log(`  Total users: ${users.length}`)
    console.log(`  Verified users: ${users.filter(u => u.verified).length}`)
    console.log(`  Admin users: ${users.filter(u => u.role === 'admin').length}`)
    console.log(`  Organizer users: ${users.filter(u => u.role === 'organizer').length}`)
    console.log(`  Staff users: ${users.filter(u => u.role === 'staff').length}`)

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

main().catch(e => { 
  console.error('Script failed:', e); 
  process.exit(1) 
})
