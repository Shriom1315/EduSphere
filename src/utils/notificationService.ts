import { getStorageData, setStorageData } from './mockData';

interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'assignment' | 'grade' | 'attendance' | 'notice';
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: {
    assignmentId?: string;
    gradeId?: string;
    noticeId?: string;
    className?: string;
    subjectName?: string;
  };
}

export class NotificationService {
  static createNotification(notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) {
    const newNotification: Notification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const allNotifications = getStorageData<Notification>('edusphere_notifications');
    const updatedNotifications = [newNotification, ...allNotifications];
    
    setStorageData('edusphere_notifications', updatedNotifications);
    
    return newNotification;
  }

  static createAssignmentNotification(
    studentIds: string[],
    assignmentTitle: string,
    subjectName: string,
    className: string,
    dueDate: string,
    assignmentId: string
  ) {
    studentIds.forEach(studentId => {
      this.createNotification({
        userId: studentId,
        title: 'New Assignment Posted',
        message: `${assignmentTitle} has been assigned for ${subjectName}. Due: ${new Date(dueDate).toLocaleDateString()}`,
        type: 'assignment',
        actionUrl: `/assignments/${assignmentId}`,
        metadata: {
          assignmentId,
          subjectName,
          className,
        },
      });
    });
  }

  static createGradeNotification(
    studentId: string,
    subjectName: string,
    examType: string,
    marks: number,
    maxMarks: number,
    gradeId: string
  ) {
    const percentage = Math.round((marks / maxMarks) * 100);
    const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B' : percentage >= 60 ? 'C' : 'D';
    
    this.createNotification({
      userId: studentId,
      title: 'New Grade Posted',
      message: `Your ${examType} grade for ${subjectName}: ${marks}/${maxMarks} (${percentage}% - ${grade})`,
      type: 'grade',
      actionUrl: `/grades/${gradeId}`,
      metadata: {
        gradeId,
        subjectName,
      },
    });
  }

  static createAttendanceNotification(
    studentId: string,
    date: string,
    status: 'present' | 'absent' | 'late',
    className: string
  ) {
    const statusMessages = {
      present: 'marked as present',
      absent: 'marked as absent',
      late: 'marked as late',
    };

    this.createNotification({
      userId: studentId,
      title: 'Attendance Updated',
      message: `Your attendance for ${new Date(date).toLocaleDateString()} has been ${statusMessages[status]} in ${className}`,
      type: 'attendance',
      metadata: {
        className,
      },
    });
  }

  static createNoticeNotification(
    userIds: string[],
    noticeTitle: string,
    priority: 'low' | 'medium' | 'high',
    noticeId: string
  ) {
    const priorityEmojis = {
      low: '📢',
      medium: '⚠️',
      high: '🚨',
    };

    userIds.forEach(userId => {
      this.createNotification({
        userId,
        title: `${priorityEmojis[priority]} New Notice: ${noticeTitle}`,
        message: `A new ${priority} priority notice has been posted. Click to read more.`,
        type: 'notice',
        actionUrl: `/notices/${noticeId}`,
        metadata: {
          noticeId,
        },
      });
    });
  }

  static createCertificateNotification(
    studentId: string,
    certificateType: string,
    status: 'approved' | 'rejected' | 'generated',
    certificateId: string,
    rejectionReason?: string
  ) {
    const statusMessages = {
      approved: 'Your certificate request has been approved and is being processed.',
      rejected: `Your certificate request has been rejected. ${rejectionReason ? `Reason: ${rejectionReason}` : ''}`,
      generated: 'Your certificate is ready for download!',
    };

    const types = {
      approved: 'info' as const,
      rejected: 'error' as const,
      generated: 'success' as const,
    };

    this.createNotification({
      userId: studentId,
      title: `Certificate ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: statusMessages[status],
      type: types[status],
      actionUrl: `/certificates/${certificateId}`,
    });
  }

  static createWelcomeNotification(userId: string, userName: string, role: string) {
    const roleMessages = {
      student: 'Welcome to EduSphere! You can now view your assignments, grades, and school notices.',
      teacher: 'Welcome to EduSphere! You can now manage your classes, create assignments, and track student progress.',
      principal: 'Welcome to EduSphere! You have full access to manage your school, teachers, students, and notices.',
      super_admin: 'Welcome to EduSphere! You have administrative access to manage all schools and users.',
    };

    this.createNotification({
      userId,
      title: `Welcome to EduSphere, ${userName}!`,
      message: roleMessages[role as keyof typeof roleMessages] || 'Welcome to EduSphere!',
      type: 'success',
    });
  }

  static createSystemNotification(
    userIds: string[],
    title: string,
    message: string,
    type: 'info' | 'warning' | 'error' = 'info'
  ) {
    userIds.forEach(userId => {
      this.createNotification({
        userId,
        title,
        message,
        type,
      });
    });
  }

  static getUnreadCount(userId: string): number {
    const allNotifications = getStorageData<Notification>('edusphere_notifications');
    return allNotifications.filter(n => n.userId === userId && !n.read).length;
  }

  static markAsRead(notificationId: string) {
    const allNotifications = getStorageData<Notification>('edusphere_notifications');
    const updatedNotifications = allNotifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    setStorageData('edusphere_notifications', updatedNotifications);
  }

  static markAllAsRead(userId: string) {
    const allNotifications = getStorageData<Notification>('edusphere_notifications');
    const updatedNotifications = allNotifications.map(n =>
      n.userId === userId ? { ...n, read: true } : n
    );
    setStorageData('edusphere_notifications', updatedNotifications);
  }

  static deleteNotification(notificationId: string) {
    const allNotifications = getStorageData<Notification>('edusphere_notifications');
    const updatedNotifications = allNotifications.filter(n => n.id !== notificationId);
    setStorageData('edusphere_notifications', updatedNotifications);
  }

  static cleanupOldNotifications(daysToKeep: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const allNotifications = getStorageData<Notification>('edusphere_notifications');
    const filteredNotifications = allNotifications.filter(
      n => new Date(n.createdAt) > cutoffDate
    );
    
    setStorageData('edusphere_notifications', filteredNotifications);
  }
}