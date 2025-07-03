import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Bell, 
  TrendingUp, 
  Calendar,
  Award,
  FileText,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  X,
  School,
  UserPlus,
  ClipboardList,
  DollarSign
} from 'lucide-react';
import { doc, deleteDoc } from 'firebase/firestore';
import { User as UserType } from '../../types';
import { CertificateManagement } from './CertificateManagement';
import { FeeManagement } from './FeeManagement';
import { HolidayManagement } from './HolidayManagement';
import { useRealtime } from '../../hooks/useRealtime';

interface PrincipalDashboardProps {
  // Assuming 'db' is imported from your firebase initialization file, e.g., '../../lib/firebase'
  user: UserType;
}

interface Class {
  id: string;
  name: string;
  grade: string;
  section: string;
  capacity: number;
  currentStudents: number;
  classTeacher: string;
  schoolId: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  qualification: string;
  subjects: string[];
  classes: string[];
  schoolId: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  class: string;
  parentName: string;
  parentPhone: string;
  schoolId: string;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  targetRole?: string;
  createdAt: string;
  schoolId: string;
}

export const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'teachers' | 'students' | 'notices' | 'certificates' | 'fees' | 'holidays'>('overview');
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Use useRealtime hook to fetch data from Firestore
  const { data: realtimeClasses, loading: loadingClasses } = useRealtime('classes', user.schoolId);
  const { data: realtimeUsers, loading: loadingUsers } = useRealtime('users', user.schoolId);
  const { data: realtimeNotices, loading: loadingNotices } = useRealtime('notices', user.schoolId);

  useEffect(() => {
    if (!user.schoolId) return;

    // Filter teachers and students from realtimeUsers
    const schoolTeachers = realtimeUsers.filter(u => u.role === 'teacher');
    const schoolStudents = realtimeUsers.filter(u => u.role === 'student');

    // Transform data to match interface (assuming realtime data structure is similar)
    const transformedClasses: Class[] = realtimeClasses.map((c: any) => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      section: c.section || 'A', // Provide default if missing
      capacity: c.capacity || 40, // Provide default if missing
      currentStudents: c.students ? c.students.length : 0, // Assuming students array in class document
      classTeacher: schoolTeachers.find(t => t.id === c.classTeacherId)?.name || 'Not Assigned', // Assuming classTeacherId in class document
      schoolId: c.schoolId
    }));

    const transformedTeachers: Teacher[] = schoolTeachers.map((t: any) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone || 'Not provided',
      qualification: t.qualification || 'Not specified',
      subjects: t.subjects || [], // Assuming subjects array in user document
      classes: t.classes || [], // Assuming classes array in user document
      schoolId: t.schoolId!
    }));

    const transformedStudents: Student[] = schoolStudents.map((s: any) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      rollNumber: s.rollNumber || 'Not assigned', // Assuming rollNumber in user document
      class: transformedClasses.find(c => c.id === s.classId)?.name || 'Not assigned', // Assuming classId in user document
      parentName: s.parentName || 'Not provided', // Assuming parentName in user document
      parentPhone: s.parentPhone || 'Not provided', // Assuming parentPhone in user document
      schoolId: s.schoolId!
    }));

    const transformedNotices: Notice[] = realtimeNotices.map((n: any) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      priority: n.priority,
      targetRole: n.targetRole,
      createdAt: n.createdAt,
      schoolId: n.schoolId,
    }));

    setClasses(transformedClasses);
    setTeachers(transformedTeachers);
    setStudents(transformedStudents);
    setNotices(transformedNotices);

  }, [user.schoolId, realtimeClasses, realtimeUsers, realtimeNotices]); // Added realtime data as dependencies

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" />, color: 'bg-blue-500' },
    { id: 'classes', label: 'Classes', icon: <School className="w-4 h-4" />, color: 'bg-green-500' },
    { id: 'teachers', label: 'Teachers', icon: <Users className="w-4 h-4" />, color: 'bg-purple-500' },
    { id: 'students', label: 'Students', icon: <GraduationCap className="w-4 h-4" />, color: 'bg-orange-500' },
    { id: 'notices', label: 'Notices', icon: <Bell className="w-4 h-4" />, color: 'bg-red-500' },
    { id: 'certificates', label: 'Certificates', icon: <FileText className="w-4 h-4" />, color: 'bg-indigo-500' },
    { id: 'fees', label: 'Fees', icon: <DollarSign className="w-4 h-4" />, color: 'bg-emerald-500' },
    { id: 'holidays', label: 'Holidays', icon: <Calendar className="w-4 h-4" />, color: 'bg-red-500' }
  ];

  const handleAdd = () => {
    setSelectedItem(null);
    setShowAddModal(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setShowEditModal(true);
  };

  const handleView = (item: any) => {
    setSelectedItem(item);
    setShowViewModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      let collectionName = '';
      switch (activeTab) {
        case 'classes':
          collectionName = 'classes';
          break;
        case 'teachers':
          collectionName = 'users'; // Teachers are stored in the 'users' collection
          break;
        case 'students':
          collectionName = 'users'; // Students are also stored in the 'users' collection
          break;
        case 'notices':
          collectionName = 'notices';
          break;
      }

      if (collectionName) {
        try {
          await deleteDoc(doc(db, collectionName, id)); // Assuming 'db' is your Firestore instance
        } catch (error) {
          console.error(`Error deleting document from ${collectionName}:`, error);
        }
      }
    }
  };

  const filteredData = () => {
    const term = searchTerm.toLowerCase();
    switch (activeTab) {
      case 'classes':
        return classes.filter(c => 
          c.name.toLowerCase().includes(term) || 
          c.grade.toLowerCase().includes(term) ||
          c.classTeacher.toLowerCase().includes(term)
        );
      case 'teachers':
        return teachers.filter(t => 
          t.name.toLowerCase().includes(term) || 
          t.email.toLowerCase().includes(term) ||
          t.qualification.toLowerCase().includes(term)
        );
      case 'students':
        return students.filter(s => 
          s.name.toLowerCase().includes(term) || 
          s.email.toLowerCase().includes(term) ||
          s.rollNumber.toLowerCase().includes(term) ||
          s.class.toLowerCase().includes(term)
        );
      case 'notices':
        return notices.filter(n => 
          n.title.toLowerCase().includes(term) || 
          n.content.toLowerCase().includes(term)
        );
      default:
        return [];
    }
  };

  const getAddButtonText = () => {
    switch (activeTab) {
      case 'classes': return 'Add Class';
      case 'teachers': return 'Add Teacher';
      case 'students': return 'Add Student';
      case 'notices': return 'Create Notice';
      case 'holidays': return 'Add Holiday';
      default: return 'Add';
    }
  };

  const getAddButtonIcon = () => {
    switch (activeTab) {
      case 'teachers': return <UserPlus className="w-4 h-4" />;
      case 'students': return <UserPlus className="w-4 h-4" />;
      case 'holidays': return <Calendar className="w-4 h-4" />;
      default: return <Plus className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <School className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Principal Dashboard</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Welcome back, {user.name}</p>
            </div>
          </div>
        </div>
        {activeTab !== 'overview' && activeTab !== 'certificates' && activeTab !== 'fees' && (
          <button
            onClick={handleAdd}
            className="hidden lg:flex bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-indigo-700 items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
          >
            {getAddButtonIcon()}
            {getAddButtonText()}
          </button>
        )}
      </div>

      {/* Quick Tab Selector */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl font-semibold transition-all duration-200 text-sm ${
              activeTab === tab.id
                ? `${tab.color} text-white shadow-lg`
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Students</p>
                  <p className="text-xl sm:text-3xl font-bold text-orange-600">{students.length}</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-orange-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Teachers</p>
                  <p className="text-xl sm:text-3xl font-bold text-purple-600">{teachers.length}</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <Users className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Classes</p>
                  <p className="text-xl sm:text-3xl font-bold text-green-600">{classes.length}</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <School className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Active Notices</p>
                  <p className="text-xl sm:text-3xl font-bold text-red-600">{notices.length}</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-red-100 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <Bell className="w-4 h-4 sm:w-6 sm:h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Recent Classes */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <School className="w-5 h-5 text-green-600" />
                Class Overview
              </h3>
              <div className="space-y-3">
                {classes.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <School className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-sm sm:text-base">No classes created yet</p>
                    <p className="text-xs sm:text-sm text-gray-500">Start by adding your first class</p>
                  </div>
                ) : (
                  classes.slice(0, 3).map((cls) => (
                    <div key={cls.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{cls.name}</p>
                        <p className="text-xs sm:text-sm text-gray-600 truncate">Teacher: {cls.classTeacher}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-green-600 text-sm sm:text-base">{cls.currentStudents}/{cls.capacity}</p>
                        <p className="text-xs sm:text-sm text-gray-600">Students</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Notices */}
            <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                <Bell className="w-5 h-5 text-red-600" />
                Recent Notices
              </h3>
              <div className="space-y-3">
                {notices.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <Bell className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-sm sm:text-base">No notices published yet</p>
                    <p className="text-xs sm:text-sm text-gray-500">Create your first notice to communicate with staff and students</p>
                  </div>
                ) : (
                  notices.slice(0, 3).map((notice) => (
                    <div key={notice.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-gray-900 text-sm sm:text-base truncate flex-1">{notice.title}</p>
                        <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                          notice.priority === 'high' ? 'bg-red-100 text-red-800' :
                          notice.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {notice.priority.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{notice.content}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(notice.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Other Tabs Content */}
      {activeTab !== 'overview' && activeTab !== 'certificates' && activeTab !== 'fees' && activeTab !== 'holidays' && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-3">
                {tabs.find(tab => tab.id === activeTab)?.icon}
                {tabs.find(tab => tab.id === activeTab)?.label} Management
              </h2>
              <button
                onClick={handleAdd}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg font-semibold flex items-center gap-2"
              >
                {getAddButtonIcon()}
                {getAddButtonText()}
              </button>
            </div>
            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full text-sm sm:text-base"
                />
              </div>
            </div>
          </div>
          
          <div className="p-4 sm:p-6">
            {filteredData().length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                {tabs.find(tab => tab.id === activeTab)?.icon && (
                  <div className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4">
                    {React.cloneElement(tabs.find(tab => tab.id === activeTab)!.icon, { 
                      className: "w-full h-full" 
                    })}
                  </div>
                )}
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Found</h4>
                <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  {searchTerm ? `No ${activeTab} match your search criteria.` : `Start by creating your first ${activeTab.slice(0, -1)}.`}
                </p>
                {!searchTerm && (
                  <button
                    onClick={handleAdd}
                    className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm sm:text-base"
                  >
                    Create First {activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {filteredData().map((item: any) => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl hover:bg-gray-100 transition-colors space-y-3 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      {activeTab === 'classes' && (
                        <>
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{item.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600">Grade {item.grade} - Section {item.section}</p>
                          <p className="text-xs sm:text-sm text-gray-600">Class Teacher: {item.classTeacher}</p>
                        </>
                      )}
                      {activeTab === 'teachers' && (
                        <>
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{item.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{item.email}</p>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{item.qualification}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">Subjects:</span>
                            {item.subjects.length > 0 ? item.subjects.map((subject: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                {subject}
                              </span>
                            )) : (
                              <span className="text-xs text-gray-400">No subjects assigned</span>
                            )}
                          </div>
                        </>
                      )}
                      {activeTab === 'students' && (
                        <>
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{item.name}</h3>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{item.email}</p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                            <span className="text-xs sm:text-sm text-gray-600">Roll: {item.rollNumber}</span>
                            <span className="text-xs sm:text-sm text-gray-600">Class: {item.class}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">Parent: {item.parentName} ({item.parentPhone})</p>
                        </>
                      )}
                      {activeTab === 'notices' && (
                        <>
                          <div className="flex items-center gap-2 sm:gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900 text-sm sm:text-base flex-1 truncate">{item.title}</h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium flex-shrink-0 ${
                              item.priority === 'high' ? 'bg-red-100 text-red-800' :
                              item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {item.priority.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{item.content}</p>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                            <span className="text-xs text-gray-500">
                              Created: {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                            {item.targetRole && (
                              <span className="text-xs text-gray-500">
                                Target: {item.targetRole}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      {activeTab === 'classes' && (
                        <div className="text-right flex-shrink-0 sm:mr-4">
                          <p className="font-bold text-green-600 text-sm sm:text-base">{item.currentStudents}/{item.capacity}</p>
                          <p className="text-xs sm:text-sm text-gray-600">Students</p>
                        </div>
                      )}
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => handleView(item)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Certificates Tab */}
      {activeTab === 'certificates' && (
        <CertificateManagement user={user} />
      )}

      {/* Fees Tab */}
      {activeTab === 'fees' && (
        <FeeManagement user={user} />
      )}

      {/* Holidays Tab */}
      {activeTab === 'holidays' && (
        <HolidayManagement user={user} />
      )}
    </div>
  );
};