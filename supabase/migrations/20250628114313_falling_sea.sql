/*
  # EduSphere Database Schema - Distribution Version
  
  This is a clean schema with admin-only setup for new installations.
  
  Generated: 2025-01-27
  Version: 1.0.0
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schools table first (no dependencies)
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  principal_id UUID, -- Will add foreign key constraint later
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  logo TEXT,
  total_students INTEGER DEFAULT 0,
  total_teachers INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (depends on schools)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'principal', 'teacher', 'student')),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  phone TEXT,
  qualification TEXT,
  class_id UUID, -- Will add foreign key constraint later
  roll_number TEXT,
  parent_name TEXT,
  parent_phone TEXT,
  is_first_login BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create classes table (depends on schools and users)
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  section TEXT,
  capacity INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subjects table (depends on users, classes, and schools)
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create attendance table (depends on users and classes)
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, date)
);

-- Create grades table (depends on users and subjects)
CREATE TABLE IF NOT EXISTS grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL,
  marks DECIMAL NOT NULL,
  max_marks DECIMAL NOT NULL,
  date DATE NOT NULL,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comments TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notices table (depends on schools and users)
CREATE TABLE IF NOT EXISTS notices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  target_role TEXT CHECK (target_role IN ('principal', 'teacher', 'student')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create assignments table (depends on subjects, classes, and users)
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  max_marks DECIMAL NOT NULL,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fees table (depends on users and schools)
CREATE TABLE IF NOT EXISTS fees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  description TEXT NOT NULL,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table (depends on users)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create class_students junction table (depends on classes and users)
CREATE TABLE IF NOT EXISTS class_students (
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (class_id, student_id)
);

-- Now add the missing foreign key constraints
DO $$
BEGIN
  -- Add principal_id foreign key to schools table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'schools_principal_id_fkey'
  ) THEN
    ALTER TABLE schools ADD CONSTRAINT schools_principal_id_fkey 
    FOREIGN KEY (principal_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;

  -- Add class_id foreign key to users table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_class_id_fkey'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_class_id_fkey 
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Users policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Super admins can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Principals can manage school users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN schools s ON u.id = s.principal_id
      WHERE u.id = auth.uid() 
      AND users.school_id = s.id
    )
  );

-- Schools policies
CREATE POLICY "School members can read school data" ON schools
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.school_id = schools.id OR users.role = 'super_admin')
    )
  );

CREATE POLICY "Super admins can manage schools" ON schools
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

CREATE POLICY "Principals can update their school" ON schools
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.id = schools.principal_id
    )
  );

-- Classes policies
CREATE POLICY "School members can read classes" ON classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.school_id = classes.school_id OR users.role = 'super_admin')
    )
  );

CREATE POLICY "Principals can manage school classes" ON classes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN schools s ON u.id = s.principal_id
      WHERE u.id = auth.uid() 
      AND classes.school_id = s.id
    ) OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- Subjects policies
CREATE POLICY "School members can read subjects" ON subjects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.school_id = subjects.school_id OR users.role = 'super_admin')
    )
  );

CREATE POLICY "Teachers can manage their subjects" ON subjects
  FOR ALL USING (
    subjects.teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u
      JOIN schools s ON u.id = s.principal_id
      WHERE u.id = auth.uid() 
      AND subjects.school_id = s.id
    ) OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- Attendance policies
CREATE POLICY "Students can read own attendance" ON attendance
  FOR SELECT USING (
    attendance.student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('teacher', 'principal', 'super_admin')
      AND EXISTS (
        SELECT 1 FROM users s
        JOIN classes c ON s.class_id = c.id
        WHERE s.id = attendance.student_id
        AND (users.school_id = c.school_id OR users.role = 'super_admin')
      )
    )
  );

CREATE POLICY "Teachers can manage attendance" ON attendance
  FOR ALL USING (
    attendance.teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u
      JOIN schools s ON u.id = s.principal_id
      JOIN classes c ON c.school_id = s.id
      WHERE u.id = auth.uid() 
      AND attendance.class_id = c.id
    ) OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- Grades policies
CREATE POLICY "Students can read own grades" ON grades
  FOR SELECT USING (
    grades.student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('teacher', 'principal', 'super_admin')
      AND EXISTS (
        SELECT 1 FROM users s
        WHERE s.id = grades.student_id
        AND (users.school_id = s.school_id OR users.role = 'super_admin')
      )
    )
  );

CREATE POLICY "Teachers can manage grades" ON grades
  FOR ALL USING (
    grades.teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u
      JOIN schools s ON u.id = s.principal_id
      JOIN subjects sub ON sub.school_id = s.id
      WHERE u.id = auth.uid() 
      AND grades.subject_id = sub.id
    ) OR EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- Notices policies
CREATE POLICY "School members can read notices" ON notices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND (users.school_id = notices.school_id OR users.role = 'super_admin')
      AND (notices.target_role IS NULL OR notices.target_role = users.role OR users.role IN ('principal', 'super_admin'))
    )
  );

CREATE POLICY "Principals and teachers can create notices" ON notices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('principal', 'teacher', 'super_admin')
      AND (users.school_id = notices.school_id OR users.role = 'super_admin')
    )
  );

-- Notifications policies
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (notifications.user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (notifications.user_id = auth.uid());

-- Class students policies
CREATE POLICY "School members can read class students" ON class_students
  FOR SELECT USING (
    class_students.student_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users u
      JOIN classes c ON c.id = class_students.class_id
      WHERE u.id = auth.uid() 
      AND (u.school_id = c.school_id OR u.role = 'super_admin')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_school_id ON users(school_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_classes_school_id ON classes(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_school_id ON subjects(school_id);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher_id ON subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subjects_class_id ON subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON attendance(class_id, date);
CREATE INDEX IF NOT EXISTS idx_grades_student_subject ON grades(student_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_notices_school_id ON notices(school_id);
CREATE INDEX IF NOT EXISTS idx_notices_target_role ON notices(target_role);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_class_students_class_id ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student_id ON class_students(student_id);