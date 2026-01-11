/**
 * Create Admin User Script
 * 
 * Creates an admin user in both Supabase Auth and AdminUser table.
 * 
 * Usage:
 *   cd apps/api
 *   npx tsx scripts/create-admin.ts
 * 
 * Or with custom credentials:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=securepass123 npx tsx scripts/create-admin.ts
 */

import { createClient } from '@supabase/supabase-js';
import { prisma } from '@salex/shared-types';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Default admin credentials (can be overridden via env vars)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@salex.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'M@nish7791@admin';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Super Admin';

async function createAdminUser() {
  console.log('\n🔐 Creating Admin User...\n');

  // Validate environment
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
  }

  // Initialize Supabase Admin client
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Step 1: Check if admin already exists in database
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: ADMIN_EMAIL },
    });

    if (existingAdmin) {
      console.log(`⚠️  Admin user already exists: ${ADMIN_EMAIL}`);
      console.log(`   ID: ${existingAdmin.id}`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log('\n📝 You can login with these credentials:');
      console.log(`   Email: ${ADMIN_EMAIL}`);
      console.log(`   Password: (use your existing password or reset it)\n`);
      return;
    }

    // Step 2: Create user in Supabase Auth
    console.log(`📧 Creating Supabase Auth user: ${ADMIN_EMAIL}`);
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      // Check if user already exists in auth but not in AdminUser table
      if (authError.message.includes('already been registered')) {
        console.log('⚠️  User exists in Supabase Auth, creating AdminUser record...');
      } else {
        throw authError;
      }
    } else {
      console.log(`✅ Supabase Auth user created: ${authData.user?.id}`);
    }

    // Step 3: Create AdminUser record in database
    console.log('📝 Creating AdminUser record in database...');
    
    const adminUser = await prisma.adminUser.create({
      data: {
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        role: 'SUPER_ADMIN',
        isActive: true,
      },
    });

    console.log(`✅ AdminUser created: ${adminUser.id}`);

    // Success output
    console.log('\n' + '='.repeat(50));
    console.log('🎉 Admin user created successfully!');
    console.log('='.repeat(50));
    console.log('\n📝 Login Credentials:');
    console.log(`   Email:    ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log('\n🌐 Admin Dashboard: http://localhost:5173');
    console.log('🔗 API Endpoint:    POST /v1/admin/auth/login\n');

  } catch (error: any) {
    console.error('\n❌ Error creating admin user:', error.message);
    
    if (error.code === 'P2002') {
      console.log('\n💡 Tip: Admin user with this email already exists.');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser();
