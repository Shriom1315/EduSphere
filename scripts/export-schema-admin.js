import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key needed
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function exportSchemaAndAdminData() {
  try {
    console.log('🚀 Starting export...');

    // 1. Export admin users
    const { data: adminUsers, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'super_admin');

    if (adminError) throw adminError;

    // 2. Export schools (if any admin users exist)
    const { data: schools, error: schoolsError } = await supabase
      .from('schools')
      .select('*')
      .limit(0); // Get structure only, no data

    if (schoolsError) throw schoolsError;

    // 3. Create export package
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        description: 'EduSphere schema with admin data only'
      },
      schema: {
        // Database schema (copy from migration file)
        sql: `
-- EduSphere Database Schema
-- Generated: ${new Date().toISOString()}

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'principal', 'teacher', 'student')),
  school_id UUID,
  phone TEXT,
  qualification TEXT,
  class_id UUID,
  roll_number TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  is_first_login BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Schools table
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  principal_id UUID,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  logo TEXT,
  total_students INTEGER DEFAULT 0,
  total_teachers INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add other tables as needed...
-- (Copy complete schema from migration file)

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Super admins can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );
        `
      },
      data: {
        admin_users: adminUsers,
        default_schools: [] // Empty array for clean start
      },
      instructions: {
        setup: [
          "1. Create new Supabase project",
          "2. Run the schema SQL in SQL Editor",
          "3. Insert admin users data",
          "4. Configure environment variables",
          "5. Deploy application"
        ],
        environment_variables: [
          "VITE_SUPABASE_URL=your-new-project-url",
          "VITE_SUPABASE_ANON_KEY=your-new-anon-key"
        ]
      }
    };

    // 4. Save to file
    const filename = `edusphere-schema-admin-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(exportData, null, 2));

    console.log('✅ Export completed!');
    console.log(`📁 File saved: ${filename}`);
    console.log(`👥 Admin users exported: ${adminUsers.length}`);

    // 5. Also create SQL file for easy import
    const sqlContent = `
-- EduSphere Admin Data Import
-- Generated: ${new Date().toISOString()}

-- Insert admin users
${adminUsers.map(user => `
INSERT INTO users (id, name, email, role, is_first_login, created_at) 
VALUES (
  '${user.id}',
  '${user.name}',
  '${user.email}',
  '${user.role}',
  ${user.is_first_login},
  '${user.created_at}'
) ON CONFLICT (email) DO NOTHING;
`).join('')}

-- Create default super admin if none exist
INSERT INTO users (id, name, email, role, is_first_login, created_at) 
VALUES (
  uuid_generate_v4(),
  'System Administrator',
  'admin@edusphere.com',
  'super_admin',
  false,
  NOW()
) ON CONFLICT (email) DO NOTHING;
    `;

    fs.writeFileSync(`edusphere-admin-data-${new Date().toISOString().split('T')[0]}.sql`, sqlContent);
    console.log('📄 SQL file also created for easy import');

  } catch (error) {
    console.error('❌ Export failed:', error);
  }
}

// Run export
exportSchemaAndAdminData();