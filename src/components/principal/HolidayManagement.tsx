import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Edit,
  Trash2,
  Eye,
  X,
  Save,
  Bell,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { User as UserType, Holiday } from '../../types';
import { getStorageData, setStorageData } from '../../utils/mockData';
import { getAllUsers } from '../../utils/auth';
import { NotificationService } from '../../utils/notificationService';
import toast from 'react-hot-toast';

interface HolidayManagementProps {
  user: UserType;
}

export const HolidayManagement: React.FC<HolidayManagementProps> = ({ user }) => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<Holiday | null>(null);
  const [viewingHoliday, setViewingHoliday] = useState<Holiday | null>(null);

  const [newHoliday, setNewHoliday] = useState({
    title: '',
    description: '',
    date: '',
    type: 'school' as Holiday['type'],
    isRecurring: false
  });

  const holidayTypes = [
    { value: 'national', label: 'National Holiday', color: 'bg-red-100 text-red-800' },
    { value: 'religious', label: 'Religious Holiday', color: 'bg-purple-100 text-purple-800' },
    { value: 'school', label: 'School Holiday', color: 'bg-blue-100 text-blue-800' },
    { value: 'emergency', label: 'Emergency Holiday', color: 'bg-orange-100 text-orange-800' }
  ];

  useEffect(() => {
    loadHolidays();
  }, [user.schoolId]);

  const loadHolidays = () => {
    if (!user.schoolId) return;

    const allHolidays = getStorageData<Holiday>('edusphere_holidays');
    const schoolHolidays = allHolidays.filter(h => h.schoolId === user.schoolId);
    setHolidays(schoolHolidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
  };

  const handleAddHoliday = async () => {
    if (!newHoliday.title || !newHoliday.date) {
      toast.error('Please fill in all required fields');
      return;
    }

    const holiday: Holiday = {
      id: `holiday_${Date.now()}`,
      title: newHoliday.title,
      description: newHoliday.description,
      date: newHoliday.date,
      schoolId: user.schoolId!,
      createdBy: user.id,
      createdAt: new Date().toISOString(),
      type: newHoliday.type,
      isRecurring: newHoliday.isRecurring,
      notificationSent: false
    };

    const allHolidays = getStorageData<Holiday>('edusphere_holidays');
    const updatedHolidays = [...allHolidays, holiday];
    setStorageData('edusphere_holidays', updatedHolidays);

    // Send notifications to all school members
    await sendHolidayNotifications(holiday);

    setNewHoliday({
      title: '',
      description: '',
      date: '',
      type: 'school',
      isRecurring: false
    });
    setShowAddModal(false);
    loadHolidays();
    toast.success('Holiday added and notifications sent successfully!');
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setEditingHoliday(holiday);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingHoliday) return;

    const allHolidays = getStorageData<Holiday>('edusphere_holidays');
    const updatedHolidays = allHolidays.map(h => 
      h.id === editingHoliday.id ? editingHoliday : h
    );
    
    setStorageData('edusphere_holidays', updatedHolidays);
    
    // Send update notifications if date or title changed
    const originalHoliday = allHolidays.find(h => h.id === editingHoliday.id);
    if (originalHoliday && (originalHoliday.date !== editingHoliday.date || originalHoliday.title !== editingHoliday.title)) {
      await sendHolidayUpdateNotifications(editingHoliday);
    }

    setShowEditModal(false);
    setEditingHoliday(null);
    loadHolidays();
    toast.success('Holiday updated successfully!');
  };

  const handleDeleteHoliday = async (holidayId: string) => {
    if (!confirm('Are you sure you want to delete this holiday? This will also send cancellation notifications.')) return;

    const allHolidays = getStorageData<Holiday>('edusphere_holidays');
    const holidayToDelete = allHolidays.find(h => h.id === holidayId);
    const updatedHolidays = allHolidays.filter(h => h.id !== holidayId);
    
    setStorageData('edusphere_holidays', updatedHolidays);

    // Send cancellation notifications
    if (holidayToDelete) {
      await sendHolidayCancellationNotifications(holidayToDelete);
    }

    loadHolidays();
    toast.success('Holiday deleted and cancellation notifications sent!');
  };

  const handleViewHoliday = (holiday: Holiday) => {
    setViewingHoliday(holiday);
    setShowViewModal(true);
  };

  const sendHolidayNotifications = async (holiday: Holiday) => {
    const allUsers = getAllUsers();
    const schoolUsers = allUsers.filter(u => u.schoolId === user.schoolId && u.role !== 'super_admin');
    
    const userIds = schoolUsers.map(u => u.id);
    const holidayType = holidayTypes.find(t => t.value === holiday.type);
    
    NotificationService.createSystemNotification(
      userIds,
      `🎉 Holiday Announced: ${holiday.title}`,
      `${holidayType?.label} on ${new Date(holiday.date).toLocaleDateString()}. ${holiday.description}`,
      'info'
    );

    // Mark notification as sent
    const allHolidays = getStorageData<Holiday>('edusphere_holidays');
    const updatedHolidays = allHolidays.map(h => 
      h.id === holiday.id ? { ...h, notificationSent: true } : h
    );
    setStorageData('edusphere_holidays', updatedHolidays);
  };

  const sendHolidayUpdateNotifications = async (holiday: Holiday) => {
    const allUsers = getAllUsers();
    const schoolUsers = allUsers.filter(u => u.schoolId === user.schoolId && u.role !== 'super_admin');
    
    const userIds = schoolUsers.map(u => u.id);
    
    NotificationService.createSystemNotification(
      userIds,
      `📅 Holiday Updated: ${holiday.title}`,
      `Holiday details have been updated. New date: ${new Date(holiday.date).toLocaleDateString()}. ${holiday.description}`,
      'warning'
    );
  };

  const sendHolidayCancellationNotifications = async (holiday: Holiday) => {
    const allUsers = getAllUsers();
    const schoolUsers = allUsers.filter(u => u.schoolId === user.schoolId && u.role !== 'super_admin');
    
    const userIds = schoolUsers.map(u => u.id);
    
    NotificationService.createSystemNotification(
      userIds,
      `❌ Holiday Cancelled: ${holiday.title}`,
      `The holiday scheduled for ${new Date(holiday.date).toLocaleDateString()} has been cancelled. Please check the updated schedule.`,
      'error'
    );
  };

  const isHolidayToday = (date: string) => {
    const today = new Date().toDateString();
    const holidayDate = new Date(date).toDateString();
    return today === holidayDate;
  };

  const isUpcomingHoliday = (date: string) => {
    const today = new Date();
    const holidayDate = new Date(date);
    const diffTime = holidayDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 7;
  };

  const getHolidayTypeColor = (type: string) => {
    const typeConfig = holidayTypes.find(t => t.value === type);
    return typeConfig?.color || 'bg-gray-100 text-gray-800';
  };

  const filteredHolidays = holidays.filter(holiday => {
    const matchesSearch = holiday.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         holiday.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || holiday.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const upcomingHolidays = holidays.filter(h => isUpcomingHoliday(h.date));
  const todayHolidays = holidays.filter(h => isHolidayToday(h.date));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="w-6 h-6 text-red-600" />
            Holiday Management
          </h2>
          <p className="text-gray-600 mt-1">Manage school holidays and notify students & teachers</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
        >
          <Plus className="w-5 h-5" />
          Add Holiday
        </button>
      </div>

      {/* Today's Holidays Alert */}
      {todayHolidays.length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">🎉 Today's Holidays</h3>
              {todayHolidays.map(holiday => (
                <div key={holiday.id} className="mb-2">
                  <p className="font-medium text-red-800">{holiday.title}</p>
                  <p className="text-sm text-red-700">{holiday.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Holidays */}
      {upcomingHolidays.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">📅 Upcoming Holidays (Next 7 Days)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {upcomingHolidays.map(holiday => (
                  <div key={holiday.id} className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-blue-900">{holiday.title}</p>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getHolidayTypeColor(holiday.type)}`}>
                        {holidayTypes.find(t => t.value === holiday.type)?.label}
                      </span>
                    </div>
                    <p className="text-sm text-blue-700 mb-1">{holiday.description}</p>
                    <p className="text-xs text-blue-600 font-medium">
                      {new Date(holiday.date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Holidays</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{holidays.length}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {holidays.filter(h => {
                  const holidayMonth = new Date(h.date).getMonth();
                  const currentMonth = new Date().getMonth();
                  return holidayMonth === currentMonth;
                }).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{upcomingHolidays.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Notifications Sent</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {holidays.filter(h => h.notificationSent).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search holidays..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
          </div>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          >
            <option value="all">All Types</option>
            {holidayTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Holidays List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">All Holidays</h3>
          
          {filteredHolidays.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Holidays Found</h4>
              <p className="text-gray-600 mb-6">
                {searchTerm || typeFilter !== 'all' 
                  ? 'No holidays match your current filters.'
                  : 'Start by adding your first holiday.'
                }
              </p>
              {!searchTerm && typeFilter === 'all' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-colors font-semibold"
                >
                  Add First Holiday
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHolidays.map((holiday) => (
                <div key={holiday.id} className={`border-l-4 rounded-xl p-6 transition-all hover:shadow-md ${
                  isHolidayToday(holiday.date) ? 'border-red-500 bg-red-50' :
                  isUpcomingHoliday(holiday.date) ? 'border-blue-500 bg-blue-50' :
                  'border-gray-300 bg-gray-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{holiday.title}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getHolidayTypeColor(holiday.type)}`}>
                          {holidayTypes.find(t => t.value === holiday.type)?.label}
                        </span>
                        {isHolidayToday(holiday.date) && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                            TODAY
                          </span>
                        )}
                        {isUpcomingHoliday(holiday.date) && !isHolidayToday(holiday.date) && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            UPCOMING
                          </span>
                        )}
                        {holiday.isRecurring && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
                            RECURRING
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-700 mb-3">{holiday.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1 font-semibold">
                          <Calendar className="w-4 h-4" />
                          {new Date(holiday.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Created: {new Date(holiday.createdAt).toLocaleDateString()}
                        </span>
                        {holiday.notificationSent && (
                          <span className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                            Notifications Sent
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleViewHoliday(holiday)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditHoliday(holiday)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Edit Holiday"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteHoliday(holiday.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Holiday"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      {!holiday.notificationSent && (
                        <button
                          onClick={() => sendHolidayNotifications(holiday)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Send Notifications"
                        >
                          <Bell className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Holiday Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Calendar className="w-6 h-6 text-red-600" />
                Add New Holiday
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Holiday Title *
                </label>
                <input
                  type="text"
                  value={newHoliday.title}
                  onChange={(e) => setNewHoliday({ ...newHoliday, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  placeholder="e.g., Independence Day"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newHoliday.description}
                  onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  placeholder="Brief description of the holiday..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={newHoliday.type}
                    onChange={(e) => setNewHoliday({ ...newHoliday, type: e.target.value as Holiday['type'] })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  >
                    {holidayTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={newHoliday.isRecurring}
                  onChange={(e) => setNewHoliday({ ...newHoliday, isRecurring: e.target.checked })}
                  className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                />
                <label htmlFor="isRecurring" className="text-sm font-medium text-gray-700">
                  This is a recurring annual holiday
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-800 mb-1">Automatic Notifications</h4>
                    <p className="text-sm text-blue-700">
                      All students and teachers in your school will be automatically notified about this holiday.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddHoliday}
                disabled={!newHoliday.title || !newHoliday.date}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Holiday & Notify
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Holiday Modal */}
      {showEditModal && editingHoliday && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Edit className="w-6 h-6 text-green-600" />
                Edit Holiday
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Holiday Title *
                </label>
                <input
                  type="text"
                  value={editingHoliday.title}
                  onChange={(e) => setEditingHoliday({ ...editingHoliday, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editingHoliday.description}
                  onChange={(e) => setEditingHoliday({ ...editingHoliday, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={editingHoliday.date}
                    onChange={(e) => setEditingHoliday({ ...editingHoliday, date: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={editingHoliday.type}
                    onChange={(e) => setEditingHoliday({ ...editingHoliday, type: e.target.value as Holiday['type'] })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  >
                    {holidayTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="editIsRecurring"
                  checked={editingHoliday.isRecurring}
                  onChange={(e) => setEditingHoliday({ ...editingHoliday, isRecurring: e.target.checked })}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="editIsRecurring" className="text-sm font-medium text-gray-700">
                  This is a recurring annual holiday
                </label>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-1">Update Notifications</h4>
                    <p className="text-sm text-yellow-700">
                      If you change the date or title, update notifications will be sent to all school members.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Holiday Modal */}
      {showViewModal && viewingHoliday && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Eye className="w-6 h-6 text-blue-600" />
                Holiday Details
              </h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-600">Title</label>
                <p className="text-xl font-bold text-gray-900 mt-1">{viewingHoliday.title}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-900 mt-1">{viewingHoliday.description || 'No description provided'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Date</label>
                  <p className="text-gray-900 font-semibold mt-1">
                    {new Date(viewingHoliday.date).toLocaleDateString('en-US', {
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
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getHolidayTypeColor(viewingHoliday.type)}`}>
                      {holidayTypes.find(t => t.value === viewingHoliday.type)?.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Created</label>
                  <p className="text-gray-900 font-semibold mt-1">
                    {new Date(viewingHoliday.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Notifications</label>
                  <div className="mt-1">
                    {viewingHoliday.notificationSent ? (
                      <span className="flex items-center gap-1 text-green-600 font-semibold">
                        <CheckCircle className="w-4 h-4" />
                        Sent
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-600 font-semibold">
                        <Clock className="w-4 h-4" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {viewingHoliday.isRecurring && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <span className="font-semibold text-purple-800">Recurring Annual Holiday</span>
                  </div>
                  <p className="text-sm text-purple-700 mt-1">
                    This holiday will repeat every year on the same date.
                  </p>
                </div>
              )}

              {isHolidayToday(viewingHoliday.date) && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-800">🎉 Today's Holiday!</span>
                  </div>
                  <p className="text-sm text-red-700 mt-1">
                    This holiday is happening today. Enjoy your day off!
                  </p>
                </div>
              )}

              {isUpcomingHoliday(viewingHoliday.date) && !isHolidayToday(viewingHoliday.date) && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-800">Upcoming Holiday</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    This holiday is coming up in the next 7 days.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};