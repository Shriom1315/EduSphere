-- EduSphere Admin Data
-- Default super admin user for new installations

-- Insert default super admin user
INSERT INTO users (id, name, email, role, is_first_login, created_at) 
VALUES (
  uuid_generate_v4(),
  'System Administrator',
  'admin@edusphere.com',
  'super_admin',
  false,
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Create a welcome notification for the admin
INSERT INTO notifications (id, user_id, title, message, type, read, created_at)
SELECT 
  uuid_generate_v4(),
  u.id,
  'Welcome to EduSphere!',
  'Welcome to EduSphere! You have administrative access to manage all schools and users. Start by creating your first school.',
  'success',
  false,
  NOW()
FROM users u 
WHERE u.email = 'admin@edusphere.com'
ON CONFLICT DO NOTHING;