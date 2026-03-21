#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' })
const { neon } = require('@neondatabase/serverless')

async function main() {
  if (!process.env.DATABASE_URL) { 
    console.error('DATABASE_URL not set'); 
    process.exit(1) 
  }
  
  const sql = neon(process.env.DATABASE_URL)
  console.log('🔧 Fixing user verification issues...\n')

  try {
    // 1. Ensure verified column exists
    console.log('1. Ensuring verified column exists...')
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE
    `
    console.log('✅ Verified column ensured')

    // 2. Create index for faster verification lookups
    console.log('2. Creating index for verification...')
    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_verified ON users(verified)
    `
    console.log('✅ Index created')

    // 3. Fix auto-verification - only admins should be verified
    console.log('3. Fixing user verification status...')
    
    // Get all users
    const users = await sql`
      SELECT id, name, email, role, verified 
      FROM users 
      ORDER BY role, name
    `
    
    console.log(`Found ${users.length} users`)

    // Unverify all non-admin users
    const nonAdminUsers = users.filter(u => u.role !== 'admin' && u.verified)
    if (nonAdminUsers.length > 0) {
      console.log(`\n⚠️  Unverifying ${nonAdminUsers.length} non-admin users:`)
      
      for (const user of nonAdminUsers) {
        await sql`
          UPDATE users 
          SET verified = FALSE 
          WHERE id = ${user.id}
        `
        console.log(`  - ${user.name} (${user.email}) - ${user.role}: UNVERIFIED`)
      }
    }

    // Verify all admin users
    const adminUsers = users.filter(u => u.role === 'admin' && !u.verified)
    if (adminUsers.length > 0) {
      console.log(`\n🔐 Verifying ${adminUsers.length} admin users:`)
      
      for (const user of adminUsers) {
        await sql`
          UPDATE users 
          SET verified = TRUE 
          WHERE id = ${user.id}
        `
        console.log(`  - ${user.name} (${user.email}) - ${user.role}: VERIFIED`)
      }
    }

    // 4. Show final status
    console.log('\n📊 Final verification status:')
    const finalUsers = await sql`
      SELECT id, name, email, role, verified 
      FROM users 
      ORDER BY role, name
    `
    
    finalUsers.forEach(user => {
      const status = user.verified ? '✅ Verified' : '❌ Not Verified'
      const roleIcon = user.role === 'admin' ? '👑' : user.role === 'organizer' ? '📋' : '👷'
      console.log(`  ${roleIcon} ${user.name} (${user.email}) - ${user.role} - ${status}`)
    })

    console.log('\n✅ User verification fix completed!')
    console.log('\n📝 Rules applied:')
    console.log('  - Admin users: Auto-verified ✅')
    console.log('  - Organizer users: Require manual verification ❌')
    console.log('  - Staff users: Require manual verification ❌')

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

main().catch(e => { 
  console.error('Script failed:', e); 
  process.exit(1) 
})
