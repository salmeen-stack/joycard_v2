const { sql } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🔄 Running migration: add_verified_column.sql');
    
    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/add_verified_column.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Migration SQL loaded');
    
    // Execute migration step by step
    console.log('🔧 Adding verified column to users table...');
    await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE`;
    
    console.log('🔧 Creating index for verified column...');
    await sql`CREATE INDEX IF NOT EXISTS idx_users_verified ON users(verified)`;
    
    console.log('🔧 Setting existing admin users as verified...');
    await sql`UPDATE users SET verified = TRUE WHERE role = 'admin'`;
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the column was added
    const result = await sql`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'verified'
    `;
    
    console.log('🔍 Verification result:', result);
    
    if (result.length > 0) {
      console.log('✅ Verified column exists in database!');
      console.log('📊 Column details:', result[0]);
    } else {
      console.log('❌ Column was not added properly');
    }
    
    // Check user verification status
    const userCount = await sql`
      SELECT role, verified, COUNT(*) as count
      FROM users 
      GROUP BY role, verified
      ORDER BY role, verified
    `;
    
    console.log('👥 User verification status:', userCount);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();
