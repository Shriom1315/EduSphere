import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  Clock,
  Award,
  CheckCircle,
  Bell,
  TrendingUp,
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  X,
  Save,
  UserCheck,
  GraduationCap,
  User,
  DollarSign
} from 'lucide-react';
import { User as UserType, Class, Subject, Attendance, Grade, Notice, Assignment } from '../../types';
import { getStorageData } from '../../utils/mockData';
import { getAllUsers } from '../../utils/auth';
import { CertificateRequestComponent } from './CertificateRequest';
import { FeeStatus } from './FeeStatus';

interface StudentDashboardProps {
  user: UserType;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
  const [myClass, setMyClass] = useState<Class | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'grades' | 'assignments' | 'notices' | 'certificates' | 'fees'>('overview');
  
  // Modal states
  const [showViewGrade, setShowViewGrade] = useState(false);
  const [showViewAssignment, setShowViewAssignment] = useState(false);
  const [showViewNotice, setShowViewNotice] = useState(false);
  
  // Viewing states
  const [viewingGrade, setViewingGrade] = useState<Grade | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [viewingNotice, setViewingNotice] = useState<Notice | null>(null);
  
  // Filter states
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [assignmentFilter, setAssignmentFilter] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, [user.schoolId]);

  const loadData = () => {
    if (!user.schoolId) return;

    const classesData = getStorageData<Class>('edusphere_classes');
    const subjectsData = getStorageData<Subject>('edusphere_subjects');
    const attendanceData = getStorageData<Attendance>('edusphere_attendance');
    const gradesData = getStorageData<Grade>('edusphere_grades');
    const noticesData = getStorageData<Notice>('edusphere_notices');
    const assignmentsData = getStorageData<Assignment>('edusphere_assignments');

    // Find student's class - only from their school
    const studentClass = classesData.find(c => 
      c.schoolId === user.schoolId && c.students && c.students.includes(user.id)
    );

    // Get subjects for student's class - only from their school
    const classSubjects = subjectsData.filter(s => 
      s.schoolId === user.schoolId && s.classId === studentClass?.id
    );

    // Get student's attendance - only their own
    const studentAttendance = attendanceData.filter(a => a.studentId === user.id);

    // Get student's grades - only their own
    const studentGrades = gradesData.filter(g => g.studentId === user.id);

    // Get school notices - only from their school
    const schoolNotices = noticesData.filter(n => 
      n.schoolId === user.schoolId && (!n.targetRole || n.targetRole === 'student')
    );

    // Get assignments for student's class - only from their school
    const classAssignments = assignmentsData.filter(a => 
      a.classId === studentClass?.id
    );

    setMyClass(studentClass || null);
    setSubjects(classSubjects);
    setAttendance(studentAttendance);
    setGrades(studentGrades);
    setNotices(schoolNotices);
    setAssignments(classAssignments);
  };

  const calculateAttendancePercentage = () => {
    if (attendance.length === 0) return 0;
    const presentDays = attendance.filter(a => a.status === 'present').length;
    return Math.round((presentDays / attendance.length) * 100);
  };

  const calculateAverageGrade = () => {
    if (grades.length === 0) return 0;
    const total = grades.reduce((sum, grade) => sum + (grade.marks / grade.maxMarks) * 100, 0);
    return Math.round(total / grades.length);
  };

  const getUpcomingAssignments = () => {
    const now = new Date();
    return assignments.filter(a => new Date(a.dueDate) > now).slice(0, 5);
  };

  const getOverdueAssignments = () => {
    const now = new Date();
    return assignments.filter(a => new Date(a.dueDate) < now);
  };

  const handleViewGrade = (grade: Grade) => {
    setViewingGrade(grade);
    setShowViewGrade(true);
  };

  const handleViewAssignment = (assignment: Assignment) => {
    setViewingAssignment(assignment);
    setShowViewAssignment(true);
  };

  const handleViewNotice = (notice: Notice) => {
    setViewingNotice(notice);
    setShowViewNotice(true);
  };

  const filteredGrades = grades.filter(grade => {
    if (gradeFilter === 'all') return true;
    return grade.subjectId === gradeFilter;
  });

  const filteredAssignments = assignments.filter(assignment => {
    if (assignmentFilter === 'all') return true;
    if (assignmentFilter === 'upcoming') return new Date(assignment.dueDate) > new Date();
    if (assignmentFilter === 'overdue') return new Date(assignment.dueDate) < new Date();
    return assignment.subjectId === assignmentFilter;
  });

  const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = 
    ({ title, value, icon, color }) => (
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1 sm:mt-2">{value}</p>
          </div>
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center ${color} flex-shrink-0`}>
            {icon}
          </div>
        </div>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Welcome back, {user.name}</p>
            {myClass && (
              <p className="text-xs sm:text-sm text-gray-500 mt-1">Class: {myClass.name}</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Tab Selector */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {[
          { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" />, color: 'bg-blue-500' },
          { id: 'attendance', label: 'Attendance', icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-500' },
          { id: 'grades', label: 'Grades', icon: <Award className="w-4 h-4" />, color: 'bg-purple-500' },
          { id: 'assignments', label: 'Assignments', icon: <FileText className="w-4 h-4" />, color: 'bg-orange-500' },
          { id: 'notices', label: 'Notices', icon: <Bell className="w-4 h-4" />, color: 'bg-red-500' },
          { id: 'certificates', label: 'Certificates', icon: <FileText className="w-4 h-4" />, color: 'bg-indigo-500' },
          { id: 'fees', label: 'Fees', icon: <DollarSign className="w-4 h-4" />, color: 'bg-emerald-500' }
        ].map((tab) => (
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
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            <StatCard
              title="My Subjects"
              value={subjects.length}
              icon={<BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
              color="bg-blue-500"
            />
            <StatCard
              title="Attendance"
              value={`${calculateAttendancePercentage()}%`}
              icon={<CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
              color="bg-green-500"
            />
            <StatCard
              title="Average Grade"
              value={`${calculateAverageGrade()}%`}
              icon={<Award className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
              color="bg-purple-500"
            />
            <StatCard
              title="Assignments"
              value={assignments.length}
              icon={<FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
              color="bg-orange-500"
            />
          </div>

          {/* Recent Activity and Upcoming Events */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Subjects</h3>
              <div className="space-y-3">
                {subjects.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No subjects assigned yet</p>
                    <p className="text-sm text-gray-500">Contact your class teacher for subject assignments</p>
                  </div>
                ) : (
                  subjects.map((subject) => (
                    <div key={subject.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{subject.name}</p>
                        <p className="text-sm text-gray-600">Code: {subject.code}</p>
                      </div>
                      <div className="text-blue-600 flex-shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Assignments</h3>
              <div className="space-y-3">
                {getUpcomingAssignments().length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No upcoming assignments</p>
                    <p className="text-sm text-gray-500">You're all caught up!</p>
                  </div>
                ) : (
                  getUpcomingAssignments().map((assignment) => {
                    const subject = subjects.find(s => s.id === assignment.subjectId);
                    const daysLeft = Math.ceil((new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                    return (
                      <div key={assignment.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{assignment.title}</p>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">{subject?.name}</p>
                          <p className={`text-xs font-medium ${
                            daysLeft <= 1 ? 'text-red-600' : daysLeft <= 3 ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            {daysLeft <= 0 ? 'Due today' : `${daysLeft} days left`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleViewAssignment(assignment)}
                          className="text-orange-600 flex-shrink-0 p-1 hover:bg-orange-100 rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Today's Schedule */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">9:00 - 10:00 AM</p>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Mathematics</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">10:00 - 11:00 AM</p>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">English Literature</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">11:00 - 12:00 PM</p>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Science</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Attendance Summary */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {attendance.filter(a => a.status === 'present').length}
                </p>
                <p className="text-xs sm:text-sm text-green-700">Present Days</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-xl sm:text-2xl font-bold text-red-600">
                  {attendance.filter(a => a.status === 'absent').length}
                </p>
                <p className="text-xs sm:text-sm text-red-700">Absent Days</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{calculateAttendancePercentage()}%</p>
                <p className="text-xs sm:text-sm text-blue-700">Overall Percentage</p>
              </div>
            </div>
          </div>

          {/* Recent Attendance */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Attendance</h3>
            
            {attendance.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Attendance Records</h4>
                <p className="text-gray-600">Your attendance records will appear here once your teacher starts taking attendance.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {attendance.slice(-10).reverse().map((record) => (
                  <div key={record.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-200 rounded-lg space-y-2 sm:space-y-0">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm sm:text-base">{new Date(record.date).toLocaleDateString()}</p>
                      <p className="text-xs sm:text-sm text-gray-600">Class attendance</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium w-fit ${
                      record.status === 'present' 
                        ? 'bg-green-100 text-green-800'
                        : record.status === 'absent'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Grades Tab */}
      {activeTab === 'grades' && (
        <div className="space-y-6">
          {/* Grade Summary */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{calculateAverageGrade()}%</p>
                <p className="text-xs sm:text-sm text-blue-700">Overall Average</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {grades.filter(g => (g.marks / g.maxMarks) * 100 >= 80).length}
                </p>
                <p className="text-xs sm:text-sm text-green-700">A+ Grades</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-xl sm:text-2xl font-bold text-purple-600">{grades.length}</p>
                <p className="text-xs sm:text-sm text-purple-700">Total Assessments</p>
              </div>
            </div>
          </div>

          {/* Grades Filter */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">My Grades</h3>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>
            
            {filteredGrades.length === 0 ? (
              <div className="text-center py-12">
                <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Grades Available</h4>
                <p className="text-gray-600">Your grades will appear here once your teachers start grading your work.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Subject</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Exam Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Marks</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Percentage</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGrades.map((grade) => {
                      const subject = subjects.find(s => s.id === grade.subjectId);
                      const percentage = Math.round((grade.marks / grade.maxMarks) * 100);
                      return (
                        <tr key={grade.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-gray-900">{subject?.name}</td>
                          <td className="py-3 px-4 text-gray-600">{grade.examType}</td>
                          <td className="py-3 px-4 text-gray-900">{grade.marks}/{grade.maxMarks}</td>
                          <td className="py-3 px-4">
                            <span className={`font-medium ${
                              percentage >= 90 ? 'text-green-600' :
                              percentage >= 80 ? 'text-blue-600' :
                              percentage >= 70 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {percentage}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{new Date(grade.date).toLocaleDateString()}</td>
                          <td className="py-3 px-4">
                            <button 
                              onClick={() => handleViewGrade(grade)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          {/* Assignment Filter */}
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">My Assignments</h3>
              <select
                value={assignmentFilter}
                onChange={(e) => setAssignmentFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Assignments</option>
                <option value="upcoming">Upcoming</option>
                <option value="overdue">Overdue</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>
            
            {filteredAssignments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Assignments Found</h4>
                <p className="text-gray-600">
                  {assignmentFilter === 'all' 
                    ? 'Your assignments will appear here once your teachers create them.'
                    : 'No assignments match your current filter.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAssignments.map((assignment) => {
                  const subject = subjects.find(s => s.id === assignment.subjectId);
                  const isOverdue = new Date(assignment.dueDate) < new Date();
                  const daysLeft = Math.ceil((new Date(assignment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={assignment.id} className={`p-6 rounded-xl border-l-4 ${
                      isOverdue ? 'border-red-500 bg-red-50' :
                      daysLeft <= 1 ? 'border-yellow-500 bg-yellow-50' :
                      'border-blue-500 bg-blue-50'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{assignment.title}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              isOverdue ? 'bg-red-100 text-red-800' :
                              daysLeft <= 1 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {isOverdue ? 'OVERDUE' : daysLeft <= 0 ? 'DUE TODAY' : `${daysLeft} DAYS LEFT`}
                            </span>
                          </div>
                          <p className="text-gray-700 mb-3">{assignment.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {subject?.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Award className="w-4 h-4" />
                              {assignment.maxMarks} marks
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleViewAssignment(assignment)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors ml-4"
                          title="View Assignment"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notices Tab */}
      {activeTab === 'notices' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-6">School Notices</h3>
            {notices.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Notices Available</h4>
                <p className="text-gray-600">School notices and announcements will appear here.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {notices.map((notice) => (
                  <div key={notice.id} className={`p-4 rounded-lg border-l-4 ${
                    notice.priority === 'high' ? 'border-red-500 bg-red-50' :
                    notice.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                    'border-blue-500 bg-blue-50'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-2 sm:space-y-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-medium text-gray-900 text-sm sm:text-base">{notice.title}</h4>
                          <span className={`px-2 py-1 rounded text-xs font-medium w-fit ${
                            notice.priority === 'high' ? 'bg-red-100 text-red-800' :
                            notice.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {notice.priority.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{notice.content.substring(0, 150)}...</p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {new Date(notice.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleViewNotice(notice)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex-shrink-0"
                        title="View Notice"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
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
        <CertificateRequestComponent user={user} />
      )}

      {/* Fees Tab */}
      {activeTab === 'fees' && (
        <FeeStatus user={user} />
      )}

      {/* View Grade Modal */}
      {showViewGrade && viewingGrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Award className="w-6 h-6 text-purple-600" />
                Grade Details
              </h3>
              <button
                onClick={() => setShowViewGrade(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Subject</label>
                <p className="text-gray-900 font-semibold">
                  {subjects.find(s => s.id === viewingGrade.subjectId)?.name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Exam Type</label>
                <p className="text-gray-900 font-semibold">{viewingGrade.examType}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Marks Obtained</label>
                  <p className="text-gray-900 font-semibold text-lg">{viewingGrade.marks}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Marks</label>
                  <p className="text-gray-900 font-semibold text-lg">{viewingGrade.maxMarks}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Percentage</label>
                <p className={`font-bold text-2xl ${
                  (viewingGrade.marks / viewingGrade.maxMarks) * 100 >= 90 ? 'text-green-600' :
                  (viewingGrade.marks / viewingGrade.maxMarks) * 100 >= 80 ? 'text-blue-600' :
                  (viewingGrade.marks / viewingGrade.maxMarks) * 100 >= 70 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {Math.round((viewingGrade.marks / viewingGrade.maxMarks) * 100)}%
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Date</label>
                <p className="text-gray-900 font-semibold">
                  {new Date(viewingGrade.date).toLocaleDateString()}
                </p>
              </div>
              {viewingGrade.comments && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Comments</label>
                  <p className="text-gray-900">{viewingGrade.comments}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* View Assignment Modal */}
      {showViewAssignment && viewingAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-6 h-6 text-orange-600" />
                Assignment Details
              </h3>
              <button
                onClick={() => setShowViewAssignment(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Title</label>
                <p className="text-gray-900 font-semibold text-lg">{viewingAssignment.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-900">{viewingAssignment.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Subject</label>
                <p className="text-gray-900 font-semibold">
                  {subjects.find(s => s.id === viewingAssignment.subjectId)?.name}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Due Date</label>
                  <p className="text-gray-900 font-semibold">
                    {new Date(viewingAssignment.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Max Marks</label>
                  <p className="text-gray-900 font-semibold">{viewingAssignment.maxMarks}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Created</label>
                <p className="text-gray-900 font-semibold">
                  {new Date(viewingAssignment.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Notice Modal */}
      {showViewNotice && viewingNotice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Bell className="w-6 h-6 text-red-600" />
                Notice Details
              </h3>
              <button
                onClick={() => setShowViewNotice(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-xl font-bold text-gray-900">{viewingNotice.title}</h4>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    viewingNotice.priority === 'high' ? 'bg-red-100 text-red-800' :
                    viewingNotice.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {viewingNotice.priority.toUpperCase()}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Content</label>
                <p className="text-gray-900 mt-1 leading-relaxed">{viewingNotice.content}</p>
              </div>
              {viewingNotice.targetRole && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Target Audience</label>
                  <p className="text-gray-900 font-semibold capitalize">{viewingNotice.targetRole}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-600">Published</label>
                <p className="text-gray-900 font-semibold">
                  {new Date(viewingNotice.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};