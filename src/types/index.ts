export interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'principal' | 'teacher' | 'student';
  schoolId?: string;
  isFirstLogin?: boolean;
  createdAt: string;
  lastLogin?: string;
  phone?: string;
  qualification?: string;
  classId?: string;
  rollNumber?: string;
  parentName?: string;
  parentPhone?: string;
}

export interface School {
  id: string;
  name: string;
  principalId: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  createdAt: string;
  totalStudents: number;
  totalTeachers: number;
}

export interface Class {
  id: string;
  name: string;
  grade: string;
  schoolId: string;
  classTeacherId?: string;
  students: string[];
  section?: string;
  capacity?: number;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  teacherId?: string;
  classId: string;
  schoolId: string;
  description?: string;
}

export interface Attendance {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  teacherId: string;
}

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  examType: string;
  marks: number;
  maxMarks: number;
  date: string;
  teacherId: string;
  comments?: string;
}

export interface Timetable {
  id: string;
  classId: string;
  day: string;
  period: number;
  subjectId: string;
  teacherId: string;
  startTime: string;
  endTime: string;
}

export interface Holiday {
  id: string;
  title: string;
  description: string;
  date: string;
  schoolId: string;
  createdBy: string;
  createdAt: string;
  type: 'national' | 'religious' | 'school' | 'emergency';
  isRecurring?: boolean;
  notificationSent?: boolean;
}

export interface Exam {
  id: string;
  name: string;
  subjectId: string;
  classId: string;
  date: string;
  startTime: string;
  endTime: string;
  maxMarks: number;
  schoolId: string;
  description?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  schoolId: string;
  targetRole?: string;
  createdBy: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
  attachments?: string[];
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  teacherId: string;
  dueDate: string;
  maxMarks: number;
  attachments?: string[];
  createdAt: string;
}

export interface CertificateRequest {
  id: string;
  studentId: string;
  schoolId: string;
  certificateType: 'bonafide' | 'character' | 'transfer' | 'conduct' | 'study' | 'migration';
  purpose: string;
  additionalDetails?: string;
  status: 'pending' | 'approved' | 'rejected' | 'generated';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  certificateUrl?: string;
  certificateNumber?: string;
  validUntil?: string;
}

export interface Fee {
  id: string;
  studentId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'pending' | 'paid' | 'overdue';
  description: string;
  schoolId: string;
  createdAt: string;
}

export interface DashboardStats {
  totalSchools?: number;
  totalUsers?: number;
  activeUsers?: number;
  totalStudents?: number;
  totalTeachers?: number;
  totalClasses?: number;
  totalSubjects?: number;
  attendanceRate?: number;
  averageGrade?: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  schoolId: string;
  createdBy: string;
  attendees?: string[];
}