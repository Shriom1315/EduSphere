import { User, School, Class, Subject, Attendance, Grade, Notice, CertificateRequest, Fee, Holiday } from '../types';
import { NotificationService } from './notificationService';

export const initializeMockData = () => {
  // Check if data already exists
  if (localStorage.getItem('edusphere_users')) {
    return;
  }

  // Mock Users
  const mockUsers: User[] = [
    {
      id: '1',
      name: 'Super Administrator',
      email: 'admin@edusphere.com',
      role: 'super_admin',
      createdAt: '2024-01-01T00:00:00Z',
      lastLogin: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      name: 'Dr. Sarah Johnson',
      email: 'principal@greenwood.edu',
      role: 'principal',
      schoolId: 'school1',
      createdAt: '2024-01-02T00:00:00Z',
      lastLogin: '2024-01-15T09:15:00Z'
    },
    {
      id: '3',
      name: 'Prof. Michael Chen',
      email: 'principal@riverside.edu',
      role: 'principal',
      schoolId: 'school2',
      createdAt: '2024-01-02T00:00:00Z',
      lastLogin: '2024-01-15T08:45:00Z'
    },
    {
      id: '4',
      name: 'Emma Wilson',
      email: 'emma.wilson@greenwood.edu',
      role: 'teacher',
      schoolId: 'school1',
      createdAt: '2024-01-03T00:00:00Z',
      lastLogin: '2024-01-15T07:30:00Z'
    },
    {
      id: '5',
      name: 'David Rodriguez',
      email: 'david.rodriguez@greenwood.edu',
      role: 'teacher',
      schoolId: 'school1',
      createdAt: '2024-01-03T00:00:00Z',
      lastLogin: '2024-01-15T07:15:00Z'
    },
    {
      id: '6',
      name: 'Alex Thompson',
      email: 'alex.thompson@student.greenwood.edu',
      role: 'student',
      schoolId: 'school1',
      createdAt: '2024-01-04T00:00:00Z',
      lastLogin: '2024-01-15T06:45:00Z'
    },
    {
      id: '7',
      name: 'Sophie Martinez',
      email: 'sophie.martinez@student.greenwood.edu',
      role: 'student',
      schoolId: 'school1',
      createdAt: '2024-01-04T00:00:00Z',
      lastLogin: '2024-01-15T06:30:00Z'
    }
  ];

  // Mock Schools
  const mockSchools: School[] = [
    {
      id: 'school1',
      name: 'Greenwood High School',
      principalId: '2',
      address: '123 Education Street, Learning City',
      phone: '+1-555-0123',
      email: 'info@greenwood.edu',
      createdAt: '2024-01-01T00:00:00Z',
      totalStudents: 450,
      totalTeachers: 25
    },
    {
      id: 'school2',
      name: 'Riverside Academy',
      principalId: '3',
      address: '456 Knowledge Avenue, Study Town',
      phone: '+1-555-0456',
      email: 'info@riverside.edu',
      createdAt: '2024-01-01T00:00:00Z',
      totalStudents: 320,
      totalTeachers: 18
    }
  ];

  // Mock Classes
  const mockClasses: Class[] = [
    {
      id: 'class1',
      name: 'Grade 10A',
      grade: '10',
      schoolId: 'school1',
      classTeacherId: '4',
      students: ['6', '7']
    },
    {
      id: 'class2',
      name: 'Grade 10B',
      grade: '10',
      schoolId: 'school1',
      classTeacherId: '5',
      students: []
    }
  ];

  // Mock Subjects
  const mockSubjects: Subject[] = [
    {
      id: 'sub1',
      name: 'Mathematics',
      code: 'MATH10',
      teacherId: '4',
      classId: 'class1',
      schoolId: 'school1'
    },
    {
      id: 'sub2',
      name: 'English Literature',
      code: 'ENG10',
      teacherId: '5',
      classId: 'class1',
      schoolId: 'school1'
    }
  ];

  // Mock Notices
  const mockNotices: Notice[] = [
    {
      id: 'notice1',
      title: 'Welcome to New Academic Year',
      content: 'We welcome all students and faculty to the new academic year 2024-25. Classes will commence from January 15th.',
      schoolId: 'school1',
      createdBy: '2',
      createdAt: '2024-01-10T00:00:00Z',
      priority: 'high'
    },
    {
      id: 'notice2',
      title: 'Parent-Teacher Meeting',
      content: 'Parent-teacher meetings are scheduled for the last week of January. Please check your class schedules.',
      schoolId: 'school1',
      createdBy: '2',
      createdAt: '2024-01-12T00:00:00Z',
      priority: 'medium'
    }
  ];

  // Mock Certificate Requests
  const mockCertificateRequests: CertificateRequest[] = [
    {
      id: 'cert_req_1',
      studentId: '6',
      schoolId: 'school1',
      certificateType: 'bonafide',
      purpose: 'Required for bank account opening',
      status: 'pending',
      requestedAt: '2024-01-14T00:00:00Z'
    },
    {
      id: 'cert_req_2',
      studentId: '7',
      schoolId: 'school1',
      certificateType: 'character',
      purpose: 'Required for scholarship application',
      status: 'generated',
      requestedAt: '2024-01-10T00:00:00Z',
      reviewedAt: '2024-01-12T00:00:00Z',
      reviewedBy: '2',
      certificateNumber: 'GRE/2024/123456',
      validUntil: '2025-01-12T00:00:00Z',
      certificateUrl: 'mock-certificate-url'
    }
  ];

  // Mock Fee Records
  const mockFees: Fee[] = [
    {
      id: 'fee_1',
      studentId: '6',
      amount: 12000.00,
      dueDate: '2024-02-15',
      status: 'pending',
      description: 'Tuition Fee - February 2024',
      schoolId: 'school1',
      createdAt: '2024-01-15T00:00:00Z'
    },
    {
      id: 'fee_2',
      studentId: '6',
      amount: 12000.00,
      dueDate: '2024-01-15',
      paidDate: '2024-01-10',
      status: 'paid',
      description: 'Tuition Fee - January 2024',
      schoolId: 'school1',
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'fee_3',
      studentId: '7',
      amount: 12000.00,
      dueDate: '2024-02-15',
      status: 'pending',
      description: 'Tuition Fee - February 2024',
      schoolId: 'school1',
      createdAt: '2024-01-15T00:00:00Z'
    },
    {
      id: 'fee_4',
      studentId: '7',
      amount: 5000.00,
      dueDate: '2024-01-01',
      status: 'overdue',
      description: 'Library Fee - Annual',
      schoolId: 'school1',
      createdAt: '2023-12-01T00:00:00Z'
    }
  ];

  // Mock Holidays
  const mockHolidays: Holiday[] = [
    {
      id: 'holiday_1',
      title: 'Republic Day',
      description: 'National holiday celebrating the adoption of the Constitution of India',
      date: '2024-01-26',
      schoolId: 'school1',
      createdBy: '2',
      createdAt: '2024-01-01T00:00:00Z',
      type: 'national',
      isRecurring: true,
      notificationSent: true
    },
    {
      id: 'holiday_2',
      title: 'Holi Festival',
      description: 'Festival of colors - Religious holiday',
      date: '2024-03-13',
      schoolId: 'school1',
      createdBy: '2',
      createdAt: '2024-01-05T00:00:00Z',
      type: 'religious',
      isRecurring: true,
      notificationSent: true
    },
    {
      id: 'holiday_3',
      title: 'School Foundation Day',
      description: 'Annual celebration of our school establishment',
      date: '2024-02-20',
      schoolId: 'school1',
      createdBy: '2',
      createdAt: '2024-01-08T00:00:00Z',
      type: 'school',
      isRecurring: true,
      notificationSent: false
    },
    {
      id: 'holiday_4',
      title: 'Independence Day',
      description: 'National holiday celebrating India\'s independence',
      date: '2024-08-15',
      schoolId: 'school1',
      createdBy: '2',
      createdAt: '2024-01-01T00:00:00Z',
      type: 'national',
      isRecurring: true,
      notificationSent: false
    }
  ];

  // Save to localStorage
  localStorage.setItem('edusphere_users', JSON.stringify(mockUsers));
  localStorage.setItem('edusphere_schools', JSON.stringify(mockSchools));
  localStorage.setItem('edusphere_classes', JSON.stringify(mockClasses));
  localStorage.setItem('edusphere_subjects', JSON.stringify(mockSubjects));
  localStorage.setItem('edusphere_notices', JSON.stringify(mockNotices));
  localStorage.setItem('edusphere_certificate_requests', JSON.stringify(mockCertificateRequests));
  localStorage.setItem('edusphere_fees', JSON.stringify(mockFees));
  localStorage.setItem('edusphere_holidays', JSON.stringify(mockHolidays));
  localStorage.setItem('edusphere_attendance', JSON.stringify([]));
  localStorage.setItem('edusphere_grades', JSON.stringify([]));
  localStorage.setItem('edusphere_timetables', JSON.stringify([]));
  localStorage.setItem('edusphere_exams', JSON.stringify([]));
  localStorage.setItem('edusphere_assignments', JSON.stringify([]));
  localStorage.setItem('edusphere_notifications', JSON.stringify([]));

  // Create welcome notifications for all users
  mockUsers.forEach(user => {
    NotificationService.createWelcomeNotification(user.id, user.name, user.role);
  });

  // Create sample notifications for demonstration
  NotificationService.createNoticeNotification(
    ['6', '7'], // Student IDs
    'Welcome to New Academic Year',
    'high',
    'notice1'
  );

  NotificationService.createAssignmentNotification(
    ['6', '7'], // Student IDs
    'Mathematics Assignment 1',
    'Mathematics',
    'Grade 10A',
    '2024-01-25T23:59:59Z',
    'assignment_sample_1'
  );

  NotificationService.createGradeNotification(
    '6', // Student ID
    'Mathematics',
    'Quiz 1',
    85,
    100,
    'grade_sample_1'
  );

  // Create fee notifications
  NotificationService.createSystemNotification(
    ['6', '7'],
    'Fee Payment Due',
    'Your tuition fee for February 2024 is due on February 15th. Please make the payment on time to avoid late fees.',
    'warning'
  );

  // Create holiday notifications
  NotificationService.createSystemNotification(
    ['4', '5', '6', '7'], // Teachers and Students
    '🎉 Holiday Announced: Republic Day',
    'National holiday on January 26th, 2024. All classes are cancelled. Enjoy the celebration!',
    'info'
  );
};

export const getStorageData = <T>(key: string): T[] => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
};

export const setStorageData = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};