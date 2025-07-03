import React, { useState } from 'react';
import { 
  LogOut, 
  Menu, 
  X, 
  School, 
  Settings, 
  Bell,
  GraduationCap,
  ChevronDown
} from 'lucide-react';
import { User as UserType } from '../types';
import { logout } from '../utils/auth';
import { NotificationSystem } from './common/NotificationSystem';

interface LayoutProps {
  user: UserType;
  onLogout: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ user, onLogout, children }) => {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    onLogout();
  };

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'super_admin': 
        return { 
          color: 'from-purple-500 to-purple-600', 
          bgColor: 'bg-purple-100', 
          textColor: 'text-purple-800',
          display: 'Super Admin'
        };
      case 'principal': 
        return { 
          color: 'from-blue-500 to-blue-600', 
          bgColor: 'bg-blue-100', 
          textColor: 'text-blue-800',
          display: 'Principal'
        };
      case 'teacher': 
        return { 
          color: 'from-green-500 to-green-600', 
          bgColor: 'bg-green-100', 
          textColor: 'text-green-800',
          display: 'Teacher'
        };
      case 'student': 
        return { 
          color: 'from-orange-500 to-orange-600', 
          bgColor: 'bg-orange-100', 
          textColor: 'text-orange-800',
          display: 'Student'
        };
      default: 
        return { 
          color: 'from-gray-500 to-gray-600', 
          bgColor: 'bg-gray-100', 
          textColor: 'text-gray-800',
          display: role
        };
    }
  };

  const roleConfig = getRoleConfig(user.role);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Simplified Top Navigation Bar */}
      <nav className="bg-white/95 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                  <School className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-2 h-2 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  EduSphere
                </h1>
                <p className="text-xs text-gray-500 font-medium hidden sm:block">Education Portal</p>
              </div>
            </div>

            {/* Right Side - Notifications and Profile */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <NotificationSystem />

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div className={`w-8 h-8 bg-gradient-to-br ${roleConfig.color} rounded-lg flex items-center justify-center shadow-md`}>
                    <span className="text-white font-bold text-sm">
                      {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-900 truncate max-w-32">{user.name}</p>
                    <div className={`text-xs px-2 py-0.5 rounded-full ${roleConfig.bgColor} ${roleConfig.textColor} font-medium w-fit`}>
                      {roleConfig.display}
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500 hidden sm:block" />
                </button>

                {/* Profile Dropdown Menu */}
                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 bg-gradient-to-br ${roleConfig.color} rounded-xl flex items-center justify-center shadow-lg`}>
                          <span className="text-white font-bold text-sm">
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-600 truncate">{user.email}</p>
                          <div className={`text-xs px-2 py-1 rounded-full ${roleConfig.bgColor} ${roleConfig.textColor} font-medium w-fit mt-1`}>
                            {roleConfig.display}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors text-left">
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Click outside to close dropdown */}
      {profileDropdownOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setProfileDropdownOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <School className="w-4 h-4" />
              <span className="text-sm font-medium">© 2025 EduSphere - Empowering Education</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>Version 1.0</span>
              <span>•</span>
              <span>Made with ❤️ for Education</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};