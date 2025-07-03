import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  Users,
  AlertCircle,
  CheckCircle,
  X,
  Eye,
  Bell
} from 'lucide-react';
import { User as UserType, Holiday, Class, Subject } from '../../types';
import { getStorageData } from '../../utils/mockData';

interface TimetableWithHolidaysProps {
  user: UserType;
}

interface TimetableSlot {
  time: string;
  periods: {
    subject?: string;
    class?: string;
    isHoliday?: boolean;
    holidayTitle?: string;
    holidayType?: string;
  }[];
}

export const TimetableWithHolidays: React.FC<TimetableWithHolidaysProps> = ({ user }) => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  
  const timetableSlots: TimetableSlot[] = [
    {
      time: '9:00 - 10:00',
      periods: [
        { subject: 'Mathematics', class: 'Grade 10A' },
        { subject: 'Free Period', class: '' },
        { subject: 'Physics', class: 'Grade 11A' },
        { subject: 'Chemistry', class: 'Grade 12A' },
        { subject: 'Mathematics', class: 'Grade 10B' }
      ]
    },
    {
      time: '10:00 - 11:00',
      periods: [
        { subject: 'Free Period', class: '' },
        { subject: 'Mathematics', class: 'Grade 10A' },
        { subject: 'Free Period', class: '' },
        { subject: 'Physics', class: 'Grade 11A' },
        { subject: 'Chemistry', class: 'Grade 12A' }
      ]
    },
    {
      time: '11:00 - 12:00',
      periods: [
        { subject: 'Physics', class: 'Grade 11A' },
        { subject: 'Chemistry', class: 'Grade 12A' },
        { subject: 'Mathematics', class: 'Grade 10B' },
        { subject: 'Free Period', class: '' },
        { subject: 'Mathematics', class: 'Grade 10A' }
      ]
    },
    {
      time: '2:00 - 3:00',
      periods: [
        { subject: 'Chemistry', class: 'Grade 12A' },
        { subject: 'Mathematics', class: 'Grade 10B' },
        { subject: 'Physics', class: 'Grade 11A' },
        { subject: 'Mathematics', class: 'Grade 10A' },
        { subject: 'Free Period', class: '' }
      ]
    },
    {
      time: '3:00 - 4:00',
      periods: [
        { subject: 'Mathematics', class: 'Grade 10B' },
        { subject: 'Physics', class: 'Grade 11A' },
        { subject: 'Chemistry', class: 'Grade 12A' },
        { subject: 'Free Period', class: '' },
        { subject: 'Mathematics', class: 'Grade 10A' }
      ]
    }
  ];

  useEffect(() => {
    loadData();
  }, [user.schoolId]);

  const loadData = () => {
    if (!user.schoolId) return;

    const allHolidays = getStorageData<Holiday>('edusphere_holidays');
    const schoolHolidays = allHolidays.filter(h => h.schoolId === user.schoolId);
    setHolidays(schoolHolidays);

    const allClasses = getStorageData<Class>('edusphere_classes');
    const teacherClasses = allClasses.filter(c => c.schoolId === user.schoolId && c.classTeacherId === user.id);
    setClasses(teacherClasses);

    const allSubjects = getStorageData<Subject>('edusphere_subjects');
    const teacherSubjects = allSubjects.filter(s => s.schoolId === user.schoolId && s.teacherId === user.id);
    setSubjects(teacherSubjects);
  };

  const isHoliday = (date: string) => {
    return holidays.find(h => h.date === date);
  };

  const getTodayHoliday = () => {
    const today = new Date().toISOString().split('T')[0];
    return holidays.find(h => h.date === today);
  };

  const getSelectedDateHoliday = () => {
    return holidays.find(h => h.date === selectedDate);
  };

  const getHolidayTypeColor = (type: string) => {
    switch (type) {
      case 'national':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'religious':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'school':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'emergency':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewHoliday = (holiday: Holiday) => {
    setSelectedHoliday(holiday);
    setShowHolidayModal(true);
  };

  const todayHoliday = getTodayHoliday();
  const selectedDateHoliday = getSelectedDateHoliday();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Calendar className="w-6 h-6 text-blue-600" />
          My Timetable
        </h2>
        <p className="text-gray-600 mt-1">Your teaching schedule with holiday indicators</p>
      </div>

      {/* Today's Holiday Alert */}
      {todayHoliday && (
        <div className={`rounded-xl p-6 border-2 ${getHolidayTypeColor(todayHoliday.type)}`}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-bold text-gray-900">🎉 Holiday Today!</h3>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                  {todayHoliday.type.toUpperCase()}
                </span>
              </div>
              <p className="text-lg font-semibold text-gray-800 mb-2">{todayHoliday.title}</p>
              <p className="text-gray-700 mb-3">{todayHoliday.description}</p>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleViewHoliday(todayHoliday)}
                  className="flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium border border-gray-300"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Bell className="w-4 h-4" />
                  <span>No classes scheduled today</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Date Selector */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Select Date</h3>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Selected Date Holiday Alert */}
        {selectedDateHoliday && (
          <div className={`rounded-lg p-4 border ${getHolidayTypeColor(selectedDateHoliday.type)}`}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="font-semibold">Holiday: {selectedDateHoliday.title}</span>
                  <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">
                    {selectedDateHoliday.type.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm">{selectedDateHoliday.description}</p>
              </div>
              <button
                onClick={() => handleViewHoliday(selectedDateHoliday)}
                className="p-2 hover:bg-white rounded-lg transition-colors"
                title="View Holiday Details"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Timetable */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Weekly Timetable - {new Date(selectedDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Time</th>
                {weekDays.map((day) => (
                  <th key={day} className="text-left py-4 px-6 font-semibold text-gray-700">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timetableSlots.map((slot, slotIndex) => (
                <tr key={slotIndex} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6 font-semibold text-gray-900 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      {slot.time}
                    </div>
                  </td>
                  {slot.periods.map((period, periodIndex) => {
                    const dayDate = new Date(selectedDate);
                    dayDate.setDate(dayDate.getDate() + periodIndex - dayDate.getDay() + 1);
                    const dayHoliday = isHoliday(dayDate.toISOString().split('T')[0]);
                    
                    return (
                      <td key={periodIndex} className="py-4 px-6">
                        {dayHoliday ? (
                          <div className={`p-3 rounded-lg border-2 ${getHolidayTypeColor(dayHoliday.type)}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <Calendar className="w-4 h-4" />
                              <span className="font-semibold text-sm">Holiday</span>
                            </div>
                            <p className="text-xs font-medium">{dayHoliday.title}</p>
                            <button
                              onClick={() => handleViewHoliday(dayHoliday)}
                              className="mt-2 text-xs underline hover:no-underline"
                            >
                              View Details
                            </button>
                          </div>
                        ) : period.subject === 'Free Period' ? (
                          <div className="text-center py-3">
                            <span className="text-gray-400 text-sm italic">Free</span>
                          </div>
                        ) : (
                          <div className="bg-green-50 border border-green-200 p-3 rounded-lg hover:bg-green-100 transition-colors">
                            <div className="flex items-center gap-2 mb-1">
                              <BookOpen className="w-4 h-4 text-green-600" />
                              <span className="font-semibold text-green-900 text-sm">
                                {period.subject}
                              </span>
                            </div>
                            {period.class && (
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3 text-green-600" />
                                <span className="text-xs text-green-700">{period.class}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Holidays */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Holidays</h3>
        
        {holidays.filter(h => new Date(h.date) > new Date()).slice(0, 5).length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No upcoming holidays scheduled</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {holidays
              .filter(h => new Date(h.date) > new Date())
              .slice(0, 6)
              .map((holiday) => (
                <div
                  key={holiday.id}
                  className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-all ${getHolidayTypeColor(holiday.type)}`}
                  onClick={() => handleViewHoliday(holiday)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{holiday.title}</span>
                    <span className="text-xs px-2 py-1 rounded bg-white bg-opacity-50">
                      {holiday.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{holiday.description}</p>
                  <div className="flex items-center gap-1 text-xs">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(holiday.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Holiday Details Modal */}
      {showHolidayModal && selectedHoliday && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Calendar className="w-6 h-6 text-red-600" />
                Holiday Details
              </h3>
              <button
                onClick={() => setShowHolidayModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Title</label>
                <p className="text-xl font-bold text-gray-900 mt-1">{selectedHoliday.title}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-900 mt-1">{selectedHoliday.description || 'No description provided'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Date</label>
                  <p className="text-gray-900 font-semibold mt-1">
                    {new Date(selectedHoliday.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Type</label>
                  <div className="mt-1">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getHolidayTypeColor(selectedHoliday.type)}`}>
                      {selectedHoliday.type.charAt(0).toUpperCase() + selectedHoliday.type.slice(1)} Holiday
                    </span>
                  </div>
                </div>
              </div>

              {selectedHoliday.isRecurring && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-purple-800">Recurring Annual Holiday</span>
                  </div>
                  <p className="text-sm text-purple-700 mt-1">
                    This holiday repeats every year on the same date.
                  </p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">Schedule Impact</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  All classes are cancelled on this day. No teaching activities are scheduled.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};