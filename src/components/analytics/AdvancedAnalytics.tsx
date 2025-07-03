import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts';
import {
  TrendingUp,
  Users,
  BookOpen,
  Award,
  Calendar,
  Download,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import jsPDF from 'jspdf';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface AnalyticsData {
  attendanceData: any[];
  gradeData: any[];
  enrollmentData: any[];
  performanceData: any[];
  subjectPerformance: any[];
}

export const AdvancedAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<AnalyticsData>({
    attendanceData: [],
    gradeData: [],
    enrollmentData: [],
    performanceData: [],
    subjectPerformance: [],
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    if (user?.schoolId) {
      fetchAnalyticsData();
    }
  }, [user?.schoolId, dateRange]);

  const fetchAnalyticsData = async () => {
    if (!user?.schoolId) return;

    setLoading(true);
    try {
      // Fetch attendance data
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select(`
          date,
          status,
          students:student_id(school_id)
        `)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end);

      // Fetch grades data
      const { data: gradesData } = await supabase
        .from('grades')
        .select(`
          marks,
          max_marks,
          date,
          subject:subject_id(name, school_id),
          student:student_id(school_id)
        `)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end);

      // Process data for charts
      const processedData = processAnalyticsData(attendanceData || [], gradesData || []);
      setData(processedData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (attendance: any[], grades: any[]): AnalyticsData => {
    // Process attendance data by date
    const attendanceByDate = attendance.reduce((acc, record) => {
      const date = record.date;
      if (!acc[date]) {
        acc[date] = { date, present: 0, absent: 0, late: 0, total: 0 };
      }
      acc[date][record.status]++;
      acc[date].total++;
      return acc;
    }, {});

    const attendanceData = Object.values(attendanceByDate).map((day: any) => ({
      ...day,
      percentage: Math.round((day.present / day.total) * 100) || 0,
    }));

    // Process grade data by subject
    const gradesBySubject = grades.reduce((acc, grade) => {
      const subject = grade.subject?.name || 'Unknown';
      if (!acc[subject]) {
        acc[subject] = { subject, totalMarks: 0, maxMarks: 0, count: 0 };
      }
      acc[subject].totalMarks += grade.marks;
      acc[subject].maxMarks += grade.max_marks;
      acc[subject].count++;
      return acc;
    }, {});

    const subjectPerformance = Object.values(gradesBySubject).map((subject: any) => ({
      ...subject,
      percentage: Math.round((subject.totalMarks / subject.maxMarks) * 100) || 0,
    }));

    // Mock enrollment data (in real app, this would come from user registrations)
    const enrollmentData = Array.from({ length: 12 }, (_, i) => ({
      month: format(subDays(new Date(), (11 - i) * 30), 'MMM'),
      students: Math.floor(Math.random() * 50) + 200,
      teachers: Math.floor(Math.random() * 10) + 20,
    }));

    // Performance trends
    const performanceData = Array.from({ length: 7 }, (_, i) => ({
      day: format(subDays(new Date(), 6 - i), 'EEE'),
      attendance: Math.floor(Math.random() * 20) + 80,
      performance: Math.floor(Math.random() * 15) + 75,
    }));

    return {
      attendanceData,
      gradeData: subjectPerformance,
      enrollmentData,
      performanceData,
      subjectPerformance,
    };
  };

  const generateReport = () => {
    const pdf = new jsPDF();
    
    // Add title
    pdf.setFontSize(20);
    pdf.text('School Analytics Report', 20, 30);
    
    // Add date range
    pdf.setFontSize(12);
    pdf.text(`Report Period: ${dateRange.start} to ${dateRange.end}`, 20, 50);
    
    // Add summary statistics
    pdf.setFontSize(14);
    pdf.text('Summary Statistics', 20, 70);
    
    const avgAttendance = data.attendanceData.reduce((sum, day) => sum + day.percentage, 0) / data.attendanceData.length || 0;
    const avgPerformance = data.subjectPerformance.reduce((sum, subject) => sum + subject.percentage, 0) / data.subjectPerformance.length || 0;
    
    pdf.setFontSize(10);
    pdf.text(`Average Attendance: ${avgAttendance.toFixed(1)}%`, 20, 90);
    pdf.text(`Average Performance: ${avgPerformance.toFixed(1)}%`, 20, 105);
    pdf.text(`Total Subjects Analyzed: ${data.subjectPerformance.length}`, 20, 120);
    
    // Add subject performance
    pdf.setFontSize(14);
    pdf.text('Subject Performance', 20, 140);
    
    let yPos = 155;
    data.subjectPerformance.forEach((subject, index) => {
      if (yPos > 250) {
        pdf.addPage();
        yPos = 30;
      }
      pdf.setFontSize(10);
      pdf.text(`${subject.subject}: ${subject.percentage}%`, 20, yPos);
      yPos += 15;
    });
    
    pdf.save(`school-analytics-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
          <p className="text-gray-600 mt-1">Comprehensive insights and performance metrics</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          
          <button
            onClick={fetchAnalyticsData}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          
          <button
            onClick={generateReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {(data.attendanceData.reduce((sum, day) => sum + day.percentage, 0) / data.attendanceData.length || 0).toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Performance</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {(data.subjectPerformance.reduce((sum, subject) => sum + subject.percentage, 0) / data.subjectPerformance.length || 0).toFixed(1)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Award className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Subjects</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{data.subjectPerformance.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Report Days</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{data.attendanceData.length}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Attendance Trends */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="attendance" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Subject Performance */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.subjectPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="subject" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Bar dataKey="percentage" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.subjectPerformance}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="percentage"
                label={({ subject, percentage }) => `${subject}: ${percentage}%`}
              >
                {data.subjectPerformance.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Enrollment Trends */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.enrollmentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }} 
              />
              <Line 
                type="monotone" 
                dataKey="students" 
                stroke="#F59E0B" 
                strokeWidth={3}
                dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="teachers" 
                stroke="#8B5CF6" 
                strokeWidth={3}
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Detailed Subject Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Assessments
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average Score
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.subjectPerformance.map((subject, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {subject.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {subject.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(subject.totalMarks / subject.count).toFixed(1)} / {(subject.maxMarks / subject.count).toFixed(1)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                        <div
                          className={`h-2 rounded-full ${
                            subject.percentage >= 80 ? 'bg-green-500' :
                            subject.percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${subject.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {subject.percentage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <TrendingUp className={`w-4 h-4 ${
                      subject.percentage >= 75 ? 'text-green-500' : 'text-red-500'
                    }`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};