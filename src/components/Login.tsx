import React, { useState } from 'react';
import { LogIn, School, Eye, EyeOff, GraduationCap, BookOpen, Users, Award } from 'lucide-react';
import { login } from '../utils/auth';
import { User } from '../types';
import toast from 'react-hot-toast';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = login(email, password);
      if (user) {
        toast.success('Login successful!');
        onLogin(user);
      } else {
        toast.error('Invalid email or password');
      }
    } catch (err) {
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Super Admin', email: 'admin@edusphere.com', icon: <Award className="w-5 h-5" />, color: 'bg-purple-500' },
    { role: 'Principal', email: 'principal@greenwood.edu', icon: <GraduationCap className="w-5 h-5" />, color: 'bg-blue-500' },
    { role: 'Teacher', email: 'emma.wilson@greenwood.edu', icon: <BookOpen className="w-5 h-5" />, color: 'bg-green-500' },
    { role: 'Student', email: 'alex.thompson@student.greenwood.edu', icon: <Users className="w-5 h-5" />, color: 'bg-orange-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-white rounded-full"></div>
        <div className="absolute bottom-32 left-1/4 w-16 h-16 bg-white rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-white rounded-full"></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left Side - Branding */}
          <div className="text-center lg:text-left text-white space-y-6">
            <div className="flex items-center justify-center lg:justify-start gap-4 mb-8">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl">
                  <School className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-3 h-3 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  EduSphere
                </h1>
                <p className="text-blue-200 text-lg font-medium">Education Management Portal</p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-bold leading-tight">
                Empowering Education Through 
                <span className="text-yellow-400"> Smart Management</span>
              </h2>
              <p className="text-xl text-blue-100 leading-relaxed">
                Connect schools, teachers, and students in one comprehensive platform designed for modern education.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-white">Multi-School</h3>
                <p className="text-sm text-blue-200">Manage multiple schools</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-semibold text-white">Smart Analytics</h3>
                <p className="text-sm text-blue-200">Real-time insights</p>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Welcome Back!</h3>
                <p className="text-gray-600 mt-2">Sign in to access your dashboard</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white pr-12"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Sign In to Dashboard
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Demo Accounts */}
            <div className="mt-6 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/50">
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">🎓 Try Demo Accounts</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {demoAccounts.map((account, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md border border-gray-200 hover:border-gray-300"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword('password123');
                    }}
                  >
                    <div className={`w-10 h-10 ${account.color} rounded-lg flex items-center justify-center text-white`}>
                      {account.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm">{account.role}</div>
                      <div className="text-xs text-gray-600 truncate">{account.email}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <span className="text-sm text-gray-600">Default password: </span>
                <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono text-sm">password123</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};