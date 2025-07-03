# EduSphere Distribution Package

## 📦 What's Included

This package contains:
- Complete database schema
- Admin user data only
- Setup instructions
- Environment configuration template

## 🚀 Quick Setup Guide

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note down your project URL and API keys

### 2. Run Database Schema
1. Open Supabase SQL Editor
2. Copy and paste the content from `schema.sql`
3. Execute the SQL

### 3. Import Admin Data
1. In Supabase SQL Editor
2. Copy and paste the content from `admin-data.sql`
3. Execute the SQL

### 4. Configure Application
1. Create `.env` file in your project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Deploy Application
```bash
npm install
npm run build
# Deploy dist folder to your hosting platform
```

## 🔐 Default Admin Access

**Email:** admin@edusphere.com  
**Password:** password123

⚠️ **Important:** Change the default password immediately after first login!

## 📊 What You Get

- ✅ Complete database structure
- ✅ Admin user account
- ✅ All necessary tables and relationships
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ❌ No student/teacher data (clean start)
- ❌ No school-specific data

## 🏫 Adding Your School

1. Login as admin
2. Go to Schools section
3. Add your school details
4. Create principal account
5. Principal can then add teachers and students

## 🆘 Support

For setup assistance, contact your system administrator.