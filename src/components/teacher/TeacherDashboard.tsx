import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Users,
  CheckCircle,
  Award,
  Calendar,
  Clock,
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
  GraduationCap
} from 'lucide-react';
import { User, Class, Subject, Attendance, Grade, Assignment } from '../../types';
import { getStorageData, setStorageData } from '../../utils/mockData';
import { getAllUsers } from '../../utils/auth';
import { TimetableWithHolidays } from './TimetableWithHolidays';

interface TeacherDashboardProps {
  user: User;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ user }) => {
  const [myClasses, setMyClasses] = useState<Class[]>([]);
  const [mySubjects, setMySubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'grades' | 'assignments' | 'timetable'>('overview');
  
  // Modal states
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showEditAssignment, setShowEditAssignment] = useState(false);
  const [showViewAssignment, setShowViewAssignment] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showViewGrade, setShowViewGrade] = useState(false);
  
  // Editing states
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [viewingAssignment, setViewingAssignment] = useState<Assignment | null>(null);
  const [gradingStudent, setGradingStudent] = useState<User | null>(null);
  const [viewingGrade, setViewingGrade] = useState<Grade | null>(null);
  
  // Attendance states
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState<{ [key: string]: 'present' | 'absent' | 'late' }>({});
  
  // Form states
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    subjectId: '',
    classId: '',
    dueDate: '',
    maxMarks: ''
  });
  
  const [newGrade, setNewGrade] = useState({
    subjectId: '',
    examType: '',
    marks: '',
    maxMarks: '',
    date: new Date().toISOString().split('T')[0],
    comments: ''
  });

  useEffect(() => {
    loadData();
  }, [user.schoolId]);

  const loadData = () => {
    if (!user.schoolId) return;

    const classesData = getStorageData<Class>('edusphere_classes');
    const subjectsData = getStorageData<Subject>('edusphere_subjects');
    const assignmentsData = getStorageData<Assignment>('edusphere_assignments');
    const gradesData = getStorageData<Grade>('edusphere_grades');
    const allUsers = getAllUsers();

    // Get classes where this teacher is assigned - only from their school
    const teacherClasses = classesData.filter(c => 
      c.schoolId === user.schoolId && c.classTeacherId === user.id
    );
    
    // Get subjects taught by this teacher - only from their school
    const teacherSubjects = subjectsData.filter(s => 
      s.schoolId === user.schoolId && s.teacherId === user.id
    );

    // Get assignments created by this teacher
    const teacherAssignments = assignmentsData.filter(a => a.teacherId === user.id);

    // Get grades given by this teacher
    const teacherGrades = gradesData.filter(g => g.teacherId === user.id);

    // Get students from teacher's classes - only from their school
    const classStudentIds = teacherClasses.flatMap(c => c.students || []);
    const classStudents = allUsers.filter(u => 
      u.schoolId === user.schoolId && classStudentIds.includes(u.id)
    );

    setMyClasses(teacherClasses);
    setMySubjects(teacherSubjects);
    setStudents(classStudents);
    setAssignments(teacherAssignments);
    setGrades(teacherGrades);
    
    if (teacherClasses.length > 0) {
      setSelectedClass(teacherClasses[0].id);
      // Initialize attendance records
      const records: { [key: string]: 'present' | 'absent' | 'late' } = {};
      classStudents.forEach(student => {
        records[student.id] = 'present';
      });
      setAttendanceRecords(records);
    }
  };

  const handleAttendanceSubmit = () => {
    if (!selectedClass) return;

    const attendanceEntries: Attendance[] = Object.entries(attendanceRecords).map(([studentId, status]) => ({
      id: `att_${Date.now()}_${studentId}`,
      studentId,
      classId: selectedClass,
      date: attendanceDate,
      status,
      teacherId: user.id
    }));

    const existingAttendance = getStorageData<Attendance>('edusphere_attendance');
    const updatedAttendance = [...existingAttendance, ...attendanceEntries];
    setStorageData('edusphere_attendance', updatedAttendance);

    alert('Attendance recorded successfully!');
  };

  // Assignment management functions
  const handleAddAssignment = () => {
    if (!newAssignment.title || !newAssignment.subjectId || !newAssignment.classId) return;

    const assignmentData: Assignment = {
      id: `assignment_${Date.now()}`,
      title: newAssignment.title,
      description: newAssignment.description,
      subjectId: newAssignment.subjectId,
      classId: newAssignment.classId,
      teacherId: user.id,
      dueDate: newAssignment.dueDate,
      maxMarks: parseInt(newAssignment.maxMarks),
      createdAt: new Date().toISOString()
    };

    const allAssignments = getStorageData<Assignment>('edusphere_assignments');
    const updatedAssignments = [...allAssignments, assignmentData];
    setStorageData('edusphere_assignments', updatedAssignments);
    
    setNewAssignment({
      title: '',
      description: '',
      subjectId: '',
      classId: '',
      dueDate: '',
      maxMarks: ''
    });
    setShowAddAssignment(false);
    loadData();
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setShowEditAssignment(true);
  };

  const handleSaveAssignment = () => {
    if (!editingAssignment) return;

    const allAssignments = getStorageData<Assignment>('edusphere_assignments');
    const updatedAssignments = allAssignments.map(a => 
      a.id === editingAssignment.id ? editingAssignment : a
    );
    
    setStorageData('edusphere_assignments', updatedAssignments);
    setShowEditAssignment(false);
    setEditingAssignment(null);
    loadData();
  };

  const handleViewAssignment = (assignment: Assignment) => {
    setViewingAssignment(assignment);
    setShowViewAssignment(true);
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) return;

    const allAssignments = getStorageData<Assignment>('edusphere_assignments');
    const updatedAssignments = allAssignments.filter(a => a.id !== assignmentId);
    setStorageData('edusphere_assignments', updatedAssignments);
    loadData();
  };

  // Grade management functions
  const handleGradeStudent = (student: User) => {
    setGradingStudent(student);
    setShowGradeModal(true);
  };

  const handleAddGrade = () => {
    if (!gradingStudent || !newGrade.subjectId || !newGrade.marks) return;

    const gradeData: Grade = {
      id: `grade_${Date.now()}`,
      studentId: gradingStudent.id,
      subjectId: newGrade.subjectId,
      examType: newGrade.examType,
      marks: parseFloat(newGrade.marks),
      maxMarks: parseFloat(newGrade.maxMarks),
      date: newGrade.date,
      teacherId: user.id,
      comments: newGrade.comments
    };

    const allGrades = getStorageData<Grade>('edusphere_grades');
    const updatedGrades = [...allGrades, gradeData];
    setStorageData('edusphere_grades', updatedGrades);
    
    setNewGrade({
      subjectId: '',
      examType: '',
      marks: '',
      maxMarks: '',
      date: new Date().toISOString().split('T')[0],
      comments: ''
    });
    setShowGradeModal(false);
    setGradingStudent(null);
    loadData();
  };

  const handleViewGrade = (grade: Grade) => {
    setViewingGrade(grade);
    setShowViewGrade(true);
  };

  const handleDeleteGrade = (gradeId: string) => {
    if (!confirm('Are you sure you want to delete this grade? This action cannot be undone.')) return;

    const allGrades = getStorageData<Grade>('edusphere_grades');
    const updatedGrades = allGrades.filter(g => g.id !== gradeId);
    setStorageData('edusphere_grades', updatedGrades);
    loadData();
  };

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
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Welcome back, {user.name}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowAddAssignment(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
        >
          <Plus className="w-5 h-5" />
          Add Assignment
        </button>
      </div>

      {/* Quick Tab Selector */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {[
          { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" />, color: 'bg-blue-500' },
          { id: 'attendance', label: 'Attendance', icon: <CheckCircle className="w-4 h-4" />, color: 'bg-green-500' },
          { id: 'grades', label: 'Grades', icon: <Award className="w-4 h-4" />, color: 'bg-purple-500' },
          { id: 'assignments', label: 'Assignments', icon: <FileText className="w-4 h-4" />, color: 'bg-orange-500' },
          { id: 'timetable', label: 'Timetable', icon: <Calendar className="w-4 h-4" />, color: 'bg-red-500' }
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
              title="My Classes"
              value={myClasses.length}
              icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
              color="bg-blue-500"
            />
            <StatCard
              title="My Subjects"
              value={mySubjects.length}
              icon={<BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
              color="bg-green-500"
            />
            <StatCard
              title="Total Students"
              value={students.length}
              icon={<GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
              color="bg-purple-500"
            />
            <StatCard
              title="Assignments"
              value={assignments.length}
              icon={<FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
              color="bg-orange-500"
            />
          </div>

          {/* Classes and Subjects Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Classes</h3>
              <div className="space-y-3">
                {myClasses.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No classes assigned yet</p>
                    <p className="text-sm text-gray-500">Contact your principal for class assignments</p>
                  </div>
                ) : (
                  myClasses.map((cls) => (
                    <div key={cls.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{cls.name}</p>
                        <p className="text-sm text-gray-600">{cls.students?.length || 0} students</p>
                      </div>
                      <div className="text-blue-600 flex-shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">My Subjects</h3>
              <div className="space-y-3">
                {mySubjects.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No subjects assigned yet</p>
                    <p className="text-sm text-gray-500">Contact your principal for subject assignments</p>
                  </div>
                ) : (
                  mySubjects.map((subject) => (
                    <div key={subject.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{subject.name}</p>
                        <p className="text-sm text-gray-600">Code: {subject.code}</p>
                      </div>
                      <div className="text-green-600 flex-shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                    </div>
                  ))
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
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Mathematics - Grade 10A</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">11:00 - 12:00 PM</p>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Physics - Grade 11A</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 sm:p-4 border border-gray-200 rounded-lg">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base">2:00 - 3:00 PM</p>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">Chemistry - Grade 12A</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Take Attendance</h3>
            
            {myClasses.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Classes Assigned</h4>
                <p className="text-gray-600">You need to be assigned to classes before you can take attendance.</p>
              </div>
            ) : (
              <>
                {/* Attendance Controls */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base"
                    >
                      {myClasses.map((cls) => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Student List */}
                {selectedClass && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Mark Attendance</h4>
                    {students.filter(student => {
                      const selectedClassData = myClasses.find(c => c.id === selectedClass);
                      return selectedClassData?.students?.includes(student.id);
                    }).length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No students enrolled in this class</p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {students.filter(student => {
                            const selectedClassData = myClasses.find(c => c.id === selectedClass);
                            return selectedClassData?.students?.includes(student.id);
                          }).map((student) => (
                            <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border border-gray-200 rounded-lg space-y-3 sm:space-y-0">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                  <span className="text-blue-600 font-medium text-xs sm:text-sm">
                                    {student.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{student.name}</p>
                                  <p className="text-xs sm:text-sm text-gray-600 truncate">{student.email}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 justify-center sm:justify-end">
                                {['present', 'absent', 'late'].map((status) => (
                                  <button
                                    key={status}
                                    onClick={() => setAttendanceRecords({
                                      ...attendanceRecords,
                                      [student.id]: status as 'present' | 'absent' | 'late'
                                    })}
                                    className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                                      attendanceRecords[student.id] === status
                                        ? status === 'present' 
                                          ? 'bg-green-100 text-green-800' 
                                          : status === 'absent'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                  >
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={handleAttendanceSubmit}
                          className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm sm:text-base"
                        >
                          Submit Attendance
                        </button>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Grades Tab */}
      {activeTab === 'grades' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Grade Management</h3>
            </div>
            
            <div className="space-y-6">
              {/* Students List for Grading */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Students</h4>
                {students.length === 0 ? (
                  <div className="text-center py-12">
                    <GraduationCap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h4>
                    <p className="text-gray-600">You need to be assigned to classes with enrolled students to grade them.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {students.map((student) => (
                      <div key={student.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-purple-600 font-medium text-sm">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">{student.name}</p>
                            <p className="text-sm text-gray-600 truncate">{student.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleGradeStudent(student)}
                          className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                        >
                          Add Grade
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Grades */}
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Recent Grades</h4>
                {grades.length === 0 ? (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No grades recorded yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Student</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Subject</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Exam Type</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Marks</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grades.map((grade) => {
                          const student = students.find(s => s.id === grade.studentId);
                          const subject = mySubjects.find(s => s.id === grade.subjectId);
                          return (
                            <tr key={grade.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4 text-gray-900">{student?.name}</td>
                              <td className="py-3 px-4 text-gray-600">{subject?.name}</td>
                              <td className="py-3 px-4 text-gray-600">{grade.examType}</td>
                              <td className="py-3 px-4">
                                <span className={`font-medium ${
                                  (grade.marks / grade.maxMarks) * 100 >= 80 ? 'text-green-600' :
                                  (grade.marks / grade.maxMarks) * 100 >= 60 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {grade.marks}/{grade.maxMarks}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-gray-600">{new Date(grade.date).toLocaleDateString()}</td>
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => handleViewGrade(grade)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                    title="View Grade"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteGrade(grade.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                    title="Delete Grade"
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
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Assignment Management</h3>
              <button
                onClick={() => setShowAddAssignment(true)}
                className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-3 rounded-xl hover:from-orange-700 hover:to-orange-800 flex items-center gap-2 transition-all duration-200 shadow-lg font-semibold"
              >
                <Plus className="w-4 h-4" />
                Add Assignment
              </button>
            </div>
            
            {assignments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Assignments Created</h4>
                <p className="text-gray-600 mb-6">Start by creating your first assignment for your students.</p>
                <button
                  onClick={() => setShowAddAssignment(true)}
                  className="bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700 transition-colors font-semibold"
                >
                  Create First Assignment
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map((assignment) => {
                  const subject = mySubjects.find(s => s.id === assignment.subjectId);
                  const cls = myClasses.find(c => c.id === assignment.classId);
                  return (
                    <div key={assignment.id} className="p-6 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">{assignment.title}</h4>
                          <p className="text-gray-700 mb-3">{assignment.description}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              {subject?.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {cls?.name}
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
                        <div className="flex items-center gap-2 ml-4">
                          <button 
                            onClick={() => handleViewAssignment(assignment)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View Assignment"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditAssignment(assignment)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Edit Assignment"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAssignment(assignment.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Assignment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timetable Tab */}
      {activeTab === 'timetable' && (
        <TimetableWithHolidays user={user} />
      )}

      {/* Add Assignment Modal */}
      {showAddAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <FileText className="w-6 h-6 text-orange-600" />
              Add New Assignment
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="Assignment title"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  placeholder="Assignment description..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                  <select
                    value={newAssignment.subjectId}
                    onChange={(e) => setNewAssignment({ ...newAssignment, subjectId: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  >
                    <option value="">Select Subject</option>
                    {mySubjects.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Class</label>
                  <select
                    value={newAssignment.classId}
                    onChange={(e) => setNewAssignment({ ...newAssignment, classId: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  >
                    <option value="">Select Class</option>
                    {myClasses.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date</label>
                  <input
                    type="date"
                    value={newAssignment.dueDate}
                    onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Max Marks</label>
                  <input
                    type="number"
                    value={newAssignment.maxMarks}
                    onChange={(e) => setNewAssignment({ ...newAssignment, maxMarks: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                    placeholder="100"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowAddAssignment(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAssignment}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all font-semibold shadow-lg"
              >
                Add Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grade Student Modal */}
      {showGradeModal && gradingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Award className="w-6 h-6 text-purple-600" />
              Grade Student
            </h3>
            <div className="mb-4 p-4 bg-purple-50 rounded-xl">
              <p className="font-semibold text-gray-900">{gradingStudent.name}</p>
              <p className="text-sm text-gray-600">{gradingStudent.email}</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <select
                  value={newGrade.subjectId}
                  onChange={(e) => setNewGrade({ ...newGrade, subjectId: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                >
                  <option value="">Select Subject</option>
                  {mySubjects.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Exam Type</label>
                <input
                  type="text"
                  value={newGrade.examType}
                  onChange={(e) => setNewGrade({ ...newGrade, examType: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="e.g., Mid-term, Final, Quiz"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Marks Obtained</label>
                  <input
                    type="number"
                    value={newGrade.marks}
                    onChange={(e) => setNewGrade({ ...newGrade, marks: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="85"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Max Marks</label>
                  <input
                    type="number"
                    value={newGrade.maxMarks}
                    onChange={(e) => setNewGrade({ ...newGrade, maxMarks: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    placeholder="100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                <input
                  type="date"
                  value={newGrade.date}
                  onChange={(e) => setNewGrade({ ...newGrade, date: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Comments (Optional)</label>
                <textarea
                  value={newGrade.comments}
                  onChange={(e) => setNewGrade({ ...newGrade, comments: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                  placeholder="Additional comments..."
                />
              </div>
            </div>
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowGradeModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGrade}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all font-semibold shadow-lg"
              >
                Add Grade
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Additional modals for edit/view functionality would go here */}
    </div>
  );
};