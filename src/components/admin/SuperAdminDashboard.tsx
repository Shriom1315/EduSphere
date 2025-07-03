import React, { useState, useEffect } from 'react';
import {
  School,
  Users,
  TrendingUp,
  Activity,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  PieChart,
  Calendar,
  GraduationCap,
  BookOpen,
  Award,
  Globe,
  Zap,
  Target,
  X,
  Save,
  Search,
  Filter
} from 'lucide-react';
import { School as SchoolType, User, DashboardStats } from '../../types';
import { getStorageData, setStorageData } from '../../utils/mockData';
import { getAllUsers, saveAllUsers } from '../../utils/auth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell } from 'recharts';

export const SuperAdminDashboard: React.FC = () => {
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<DashboardStats>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'schools' | 'users' | 'analytics'>('overview');
  const [showAddSchool, setShowAddSchool] = useState(false);
  const [showEditSchool, setShowEditSchool] = useState(false);
  const [showViewSchool, setShowViewSchool] = useState(false);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showViewUser, setShowViewUser] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolType | null>(null);
  const [viewingSchool, setViewingSchool] = useState<SchoolType | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [newSchool, setNewSchool] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    principalName: '',
    principalEmail: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const schoolsData = getStorageData<SchoolType>('edusphere_schools');
    const usersData = getAllUsers();
    
    setSchools(schoolsData);
    setUsers(usersData);
    
    // Calculate stats
    const totalUsers = usersData.length;
    const activeUsers = usersData.filter(u => u.lastLogin).length;
    const totalStudents = usersData.filter(u => u.role === 'student').length;
    const totalTeachers = usersData.filter(u => u.role === 'teacher').length;
    
    setStats({
      totalSchools: schoolsData.length,
      totalUsers,
      activeUsers,
      totalStudents,
      totalTeachers,
      attendanceRate: 85,
      averageGrade: 78
    });
  };

  const handleAddSchool = () => {
    if (!newSchool.name || !newSchool.principalEmail) return;

    const schoolId = `school_${Date.now()}`;
    const principalId = `principal_${Date.now()}`;

    // Create new school
    const school: SchoolType = {
      id: schoolId,
      name: newSchool.name,
      principalId,
      address: newSchool.address,
      phone: newSchool.phone,
      email: newSchool.email,
      createdAt: new Date().toISOString(),
      totalStudents: 0,
      totalTeachers: 0
    };

    // Create principal user
    const principal: User = {
      id: principalId,
      name: newSchool.principalName,
      email: newSchool.principalEmail,
      role: 'principal',
      schoolId,
      isFirstLogin: true,
      createdAt: new Date().toISOString()
    };

    // Update storage
    const updatedSchools = [...schools, school];
    const updatedUsers = [...users, principal];
    
    setStorageData('edusphere_schools', updatedSchools);
    saveAllUsers(updatedUsers);
    
    setSchools(updatedSchools);
    setUsers(updatedUsers);
    
    // Reset form
    setNewSchool({
      name: '',
      address: '',
      phone: '',
      email: '',
      principalName: '',
      principalEmail: ''
    });
    setShowAddSchool(false);
    loadData();
  };

  const handleEditSchool = (school: SchoolType) => {
    setEditingSchool(school);
    setShowEditSchool(true);
  };

  const handleSaveSchool = () => {
    if (!editingSchool) return;

    const updatedSchools = schools.map(s => 
      s.id === editingSchool.id ? editingSchool : s
    );
    
    setStorageData('edusphere_schools', updatedSchools);
    setSchools(updatedSchools);
    setShowEditSchool(false);
    setEditingSchool(null);
    loadData();
  };

  const handleViewSchool = (school: SchoolType) => {
    setViewingSchool(school);
    setShowViewSchool(true);
  };

  const handleDeleteSchool = (schoolId: string) => {
    if (!confirm('Are you sure you want to delete this school? This action cannot be undone.')) return;

    const updatedSchools = schools.filter(s => s.id !== schoolId);
    const updatedUsers = users.filter(u => u.schoolId !== schoolId);
    
    setStorageData('edusphere_schools', updatedSchools);
    saveAllUsers(updatedUsers);
    
    loadData();
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditUser(true);
  };

  const handleSaveUser = () => {
    if (!editingUser) return;

    const updatedUsers = users.map(u => 
      u.id === editingUser.id ? editingUser : u
    );
    
    saveAllUsers(updatedUsers);
    setUsers(updatedUsers);
    setShowEditUser(false);
    setEditingUser(null);
    loadData();
  };

  const handleViewUser = (user: User) => {
    setViewingUser(user);
    setShowViewUser(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

    const updatedUsers = users.filter(u => u.id !== userId);
    saveAllUsers(updatedUsers);
    loadData();
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const chartData = [
    { name: 'Schools', value: stats.totalSchools || 0, color: '#8B5CF6' },
    { name: 'Teachers', value: stats.totalTeachers || 0, color: '#10B981' },
    { name: 'Students', value: stats.totalStudents || 0, color: '#F59E0B' }
  ];

  const attendanceData = [
    { month: 'Jan', attendance: 88, performance: 85 },
    { month: 'Feb', attendance: 92, performance: 88 },
    { month: 'Mar', attendance: 85, performance: 82 },
    { month: 'Apr', attendance: 90, performance: 87 },
    { month: 'May', attendance: 94, performance: 91 },
    { month: 'Jun', attendance: 87, performance: 84 }
  ];

  const COLORS = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

  const StatCard: React.FC<{ 
    title: string; 
    value: string | number; 
    icon: React.ReactNode; 
    gradient: string;
    trend?: string;
    trendUp?: boolean;
  }> = ({ title, value, icon, gradient, trend, trendUp }) => (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className={`w-4 h-4 ${trendUp ? '' : 'rotate-180'}`} />
              {trend}
            </div>
          )}
        </div>
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <div className="text-white">
            {icon}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-gray-600 mt-1 text-lg">Manage schools, users, and system overview</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowAddSchool(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
        >
          <Plus className="w-5 h-5" />
          Add New School
        </button>
      </div>

      {/* Quick Tab Selector */}
      <div className="flex flex-wrap gap-3">
        {[
          { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" />, color: 'bg-blue-500' },
          { id: 'schools', label: 'Schools', icon: <School className="w-4 h-4" />, color: 'bg-green-500' },
          { id: 'users', label: 'Users', icon: <Users className="w-4 h-4" />, color: 'bg-purple-500' },
          { id: 'analytics', label: 'Analytics', icon: <PieChart className="w-4 h-4" />, color: 'bg-orange-500' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? `${tab.color} text-white shadow-lg`
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Total Schools"
              value={stats.totalSchools || 0}
              icon={<School className="w-8 h-8" />}
              gradient="from-blue-500 to-blue-600"
              trend="+12% this month"
              trendUp={true}
            />
            <StatCard
              title="Total Users"
              value={stats.totalUsers || 0}
              icon={<Users className="w-8 h-8" />}
              gradient="from-green-500 to-green-600"
              trend="+8% this month"
              trendUp={true}
            />
            <StatCard
              title="Active Today"
              value={stats.activeUsers || 0}
              icon={<Activity className="w-8 h-8" />}
              gradient="from-orange-500 to-orange-600"
              trend="85% engagement"
              trendUp={true}
            />
            <StatCard
              title="System Health"
              value="99.9%"
              icon={<Zap className="w-8 h-8" />}
              gradient="from-purple-500 to-purple-600"
              trend="Excellent"
              trendUp={true}
            />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Monthly Performance</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }} 
                  />
                  <Bar dataKey="attendance" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="performance" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">User Distribution</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <RechartsPieChart
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </RechartsPieChart>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '12px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }} 
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-8 border border-indigo-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Target className="w-6 h-6 text-indigo-600" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button 
                onClick={() => setShowAddSchool(true)}
                className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-gray-100"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-4">
                  <School className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Add School</h4>
                <p className="text-gray-600 text-sm">Register a new educational institution</p>
              </button>
              
              <button 
                onClick={() => setActiveTab('users')}
                className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-gray-100"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">Manage Users</h4>
                <p className="text-gray-600 text-sm">View and edit user accounts</p>
              </button>
              
              <button 
                onClick={() => setActiveTab('analytics')}
                className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-gray-100"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">View Reports</h4>
                <p className="text-gray-600 text-sm">Generate system analytics</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schools Tab */}
      {activeTab === 'schools' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <School className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">School Management</h3>
              </div>
              <button
                onClick={() => setShowAddSchool(true)}
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 flex items-center gap-2 transition-all duration-200 shadow-lg font-semibold"
              >
                <Plus className="w-4 h-4" />
                Add School
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {schools.map((school) => {
                const principal = users.find(u => u.id === school.principalId);
                return (
                  <div key={school.id} className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-2xl border border-gray-200 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <School className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleViewSchool(school)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditSchool(school)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit School"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSchool(school.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete School"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h4 className="text-xl font-bold text-gray-900 mb-2">{school.name}</h4>
                    <p className="text-gray-600 text-sm mb-4">{school.address}</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">Principal</span>
                        <span className="font-semibold text-gray-900">{principal?.name || 'Not Assigned'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">Students</span>
                        <span className="font-semibold text-blue-600">{school.totalStudents}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 text-sm">Teachers</span>
                        <span className="font-semibold text-green-600">{school.totalTeachers}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">User Management</h3>
              </div>
              
              {/* Search and Filter */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="all">All Roles</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="principal">Principal</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 font-bold text-gray-700">User</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Role</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">School</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Last Login</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Status</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const school = schools.find(s => s.id === user.schoolId);
                    const roleConfig = {
                      super_admin: { color: 'bg-purple-100 text-purple-800', icon: <Award className="w-3 h-3" /> },
                      principal: { color: 'bg-blue-100 text-blue-800', icon: <GraduationCap className="w-3 h-3" /> },
                      teacher: { color: 'bg-green-100 text-green-800', icon: <BookOpen className="w-3 h-3" /> },
                      student: { color: 'bg-orange-100 text-orange-800', icon: <Users className="w-3 h-3" /> }
                    }[user.role];

                    return (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-xl flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-600">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${roleConfig?.color}`}>
                            {roleConfig?.icon}
                            {user.role.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-600 font-medium">{school?.name || 'N/A'}</td>
                        <td className="py-4 px-4 text-gray-600">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            user.lastLogin ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {user.lastLogin ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleViewUser(user)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEditUser(user)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">System Performance</h3>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
                <span className="text-gray-700 font-medium">Overall Health</span>
                <span className="text-green-600 font-bold text-lg">Excellent</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
                <span className="text-gray-700 font-medium">Uptime</span>
                <span className="text-blue-600 font-bold text-lg">99.9%</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl">
                <span className="text-gray-700 font-medium">Response Time</span>
                <span className="text-purple-600 font-bold text-lg">0.2s</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Recent Activity</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">New school registered</p>
                  <p className="text-sm text-gray-600">Riverside Academy joined the platform</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Principal logged in</p>
                  <p className="text-sm text-gray-600">Dr. Sarah Johnson accessed dashboard</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-xl">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Attendance updated</p>
                  <p className="text-sm text-gray-600">Grade 10A attendance recorded</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add School Modal */}
      {showAddSchool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <School className="w-6 h-6 text-blue-600" />
              Add New School
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">School Name</label>
                <input
                  type="text"
                  value={newSchool.name}
                  onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter school name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={newSchool.address}
                  onChange={(e) => setNewSchool({ ...newSchool, address: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Enter address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={newSchool.phone}
                    onChange={(e) => setNewSchool({ ...newSchool, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={newSchool.email}
                    onChange={(e) => setNewSchool({ ...newSchool, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="School email"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Principal Name</label>
                <input
                  type="text"
                  value={newSchool.principalName}
                  onChange={(e) => setNewSchool({ ...newSchool, principalName: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Principal's full name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Principal Email</label>
                <input
                  type="email"
                  value={newSchool.principalEmail}
                  onChange={(e) => setNewSchool({ ...newSchool, principalEmail: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Principal's email address"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowAddSchool(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSchool}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg"
              >
                Add School
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit School Modal */}
      {showEditSchool && editingSchool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Edit className="w-6 h-6 text-green-600" />
              Edit School
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">School Name</label>
                <input
                  type="text"
                  value={editingSchool.name}
                  onChange={(e) => setEditingSchool({ ...editingSchool, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={editingSchool.address}
                  onChange={(e) => setEditingSchool({ ...editingSchool, address: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={editingSchool.phone}
                    onChange={(e) => setEditingSchool({ ...editingSchool, phone: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editingSchool.email}
                    onChange={(e) => setEditingSchool({ ...editingSchool, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowEditSchool(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchool}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View School Modal */}
      {showViewSchool && viewingSchool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Eye className="w-6 h-6 text-blue-600" />
                School Details
              </h3>
              <button
                onClick={() => setShowViewSchool(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <School className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-gray-900">{viewingSchool.name}</h4>
                <p className="text-gray-600 mt-1">{viewingSchool.address}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <p className="text-sm text-blue-600 font-medium">Students</p>
                  <p className="text-2xl font-bold text-blue-700">{viewingSchool.totalStudents}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <p className="text-sm text-green-600 font-medium">Teachers</p>
                  <p className="text-2xl font-bold text-green-700">{viewingSchool.totalTeachers}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <p className="text-gray-900 font-semibold">{viewingSchool.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <p className="text-gray-900 font-semibold">{viewingSchool.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Principal</label>
                  <p className="text-gray-900 font-semibold">
                    {users.find(u => u.id === viewingSchool.principalId)?.name || 'Not Assigned'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <p className="text-gray-900 font-semibold">
                    {new Date(viewingSchool.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUser && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Edit className="w-6 h-6 text-green-600" />
              Edit User
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                >
                  <option value="super_admin">Super Admin</option>
                  <option value="principal">Principal</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">School</label>
                <select
                  value={editingUser.schoolId || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, schoolId: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                >
                  <option value="">No School</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowEditUser(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {showViewUser && viewingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Eye className="w-6 h-6 text-blue-600" />
                User Details
              </h3>
              <button
                onClick={() => setShowViewUser(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-xl">
                    {viewingUser.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <h4 className="text-2xl font-bold text-gray-900">{viewingUser.name}</h4>
                <p className="text-gray-600 mt-1">{viewingUser.email}</p>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-2 ${
                  viewingUser.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                  viewingUser.role === 'principal' ? 'bg-blue-100 text-blue-800' :
                  viewingUser.role === 'teacher' ? 'bg-green-100 text-green-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {viewingUser.role.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">School</label>
                  <p className="text-gray-900 font-semibold">
                    {schools.find(s => s.id === viewingUser.schoolId)?.name || 'No School Assigned'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className={`font-semibold ${viewingUser.lastLogin ? 'text-green-600' : 'text-gray-600'}`}>
                    {viewingUser.lastLogin ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Login</label>
                  <p className="text-gray-900 font-semibold">
                    {viewingUser.lastLogin ? new Date(viewingUser.lastLogin).toLocaleString() : 'Never'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <p className="text-gray-900 font-semibold">
                    {new Date(viewingUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {viewingUser.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-900 font-semibold">{viewingUser.phone}</p>
                  </div>
                )}
                {viewingUser.qualification && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Qualification</label>
                    <p className="text-gray-900 font-semibold">{viewingUser.qualification}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};