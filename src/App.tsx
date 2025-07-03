import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';
import { PrincipalDashboard } from './components/principal/PrincipalDashboard';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { StudentDashboard } from './components/student/StudentDashboard';
import { getCurrentUser, logout } from './utils/auth';
import { User } from './types';
import { initializeMockData } from './utils/mockData';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize mock data on first load
    initializeMockData();
    
    // Check for existing user session
    const currentUser = getCurrentUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
  };

  const renderDashboard = () => {
    if (!user) return null;

    switch (user.role) {
      case 'super_admin':
        return <SuperAdminDashboard />;
      case 'principal':
        return <PrincipalDashboard user={user} />;
      case 'teacher':
        return <TeacherDashboard user={user} />;
      case 'student':
        return <StudentDashboard user={user} />;
      default:
        return <div>Invalid user role</div>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading EduSphere...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Login onLogin={handleLogin} />
        <Toaster position="top-right" />
      </>
    );
  }

  return (
    <>
      <Layout user={user} onLogout={handleLogout}>
        {renderDashboard()}
      </Layout>
      <Toaster position="top-right" />
    </>
  );
}

export default App;