import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Calendar,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  X,
  Save,
  AlertCircle,
  TrendingUp,
  BarChart3,
  PieChart,
  Users
} from 'lucide-react';
import { User as UserType, Fee } from '../../types';
import { getStorageData, setStorageData } from '../../utils/mockData';
import { getAllUsers } from '../../utils/auth';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';

interface FeeManagementProps {
  user: UserType;
}

interface FeeStats {
  totalAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  totalRecords: number;
  paidRecords: number;
  pendingRecords: number;
  overdueRecords: number;
  collectionRate: number;
  monthlyCollection: { month: string; amount: number }[];
  studentWiseStats: { 
    studentId: string; 
    studentName: string; 
    studentEmail: string;
    totalFees: number; 
    paidFees: number; 
    pendingFees: number;
    overdueAmount: number;
    paymentPercentage: number;
    totalRecords: number;
    paidRecords: number;
    pendingRecords: number;
    overdueRecords: number;
  }[];
}

export const FeeManagement: React.FC<FeeManagementProps> = ({ user }) => {
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<UserType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showStudentBreakdownModal, setShowStudentBreakdownModal] = useState(false);
  const [selectedStudentStats, setSelectedStudentStats] = useState<any>(null);
  const [editingFee, setEditingFee] = useState<Fee | null>(null);
  const [viewingFee, setViewingFee] = useState<Fee | null>(null);
  const [feeStats, setFeeStats] = useState<FeeStats | null>(null);

  const [newFee, setNewFee] = useState({
    studentId: '',
    amount: '',
    dueDate: '',
    description: '',
    status: 'pending' as 'pending' | 'paid' | 'overdue'
  });

  useEffect(() => {
    loadData();
  }, [user.schoolId]);

  useEffect(() => {
    calculateFeeStats();
  }, [fees, students]);

  const loadData = () => {
    if (!user.schoolId) return;

    const allFees = getStorageData<Fee>('edusphere_fees');
    const schoolFees = allFees.filter(fee => fee.schoolId === user.schoolId);
    setFees(schoolFees.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    const allUsers = getAllUsers();
    const schoolStudents = allUsers.filter(u => u.schoolId === user.schoolId && u.role === 'student');
    setStudents(schoolStudents);
  };

  const calculateFeeStats = () => {
    const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const collectedAmount = fees.filter(f => f.status === 'paid').reduce((sum, fee) => sum + fee.amount, 0);
    const pendingAmount = fees.filter(f => f.status === 'pending').reduce((sum, fee) => sum + fee.amount, 0);
    const overdueAmount = fees.filter(f => f.status === 'overdue').reduce((sum, fee) => sum + fee.amount, 0);
    
    const totalRecords = fees.length;
    const paidRecords = fees.filter(f => f.status === 'paid').length;
    const pendingRecords = fees.filter(f => f.status === 'pending').length;
    const overdueRecords = fees.filter(f => f.status === 'overdue').length;
    
    const collectionRate = totalAmount > 0 ? (collectedAmount / totalAmount) * 100 : 0;

    // Monthly collection data (last 6 months)
    const monthlyCollection = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthlyAmount = fees
        .filter(f => f.status === 'paid' && f.paidDate)
        .filter(f => {
          const paidDate = new Date(f.paidDate!);
          return paidDate.getMonth() === date.getMonth() && paidDate.getFullYear() === date.getFullYear();
        })
        .reduce((sum, fee) => sum + fee.amount, 0);
      
      monthlyCollection.push({ month: monthYear, amount: monthlyAmount });
    }

    // Individual student fee breakdown
    const studentWiseStats = students.map(student => {
      const studentFees = fees.filter(f => f.studentId === student.id);
      const totalFees = studentFees.reduce((sum, fee) => sum + fee.amount, 0);
      const paidFees = studentFees.filter(f => f.status === 'paid').reduce((sum, fee) => sum + fee.amount, 0);
      const pendingFees = studentFees.filter(f => f.status === 'pending').reduce((sum, fee) => sum + fee.amount, 0);
      const overdueAmount = studentFees.filter(f => f.status === 'overdue').reduce((sum, fee) => sum + fee.amount, 0);
      
      const totalRecords = studentFees.length;
      const paidRecords = studentFees.filter(f => f.status === 'paid').length;
      const pendingRecords = studentFees.filter(f => f.status === 'pending').length;
      const overdueRecords = studentFees.filter(f => f.status === 'overdue').length;
      
      const paymentPercentage = totalFees > 0 ? (paidFees / totalFees) * 100 : 0;
      
      return {
        studentId: student.id,
        studentName: student.name,
        studentEmail: student.email,
        totalFees,
        paidFees,
        pendingFees,
        overdueAmount,
        paymentPercentage,
        totalRecords,
        paidRecords,
        pendingRecords,
        overdueRecords
      };
    }).filter(stat => stat.totalFees > 0); // Only show students with fee records

    setFeeStats({
      totalAmount,
      collectedAmount,
      pendingAmount,
      overdueAmount,
      totalRecords,
      paidRecords,
      pendingRecords,
      overdueRecords,
      collectionRate,
      monthlyCollection,
      studentWiseStats
    });
  };

  const handleAddFee = () => {
    if (!newFee.studentId || !newFee.amount || !newFee.dueDate || !newFee.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const fee: Fee = {
      id: `fee_${Date.now()}`,
      studentId: newFee.studentId,
      amount: parseFloat(newFee.amount),
      dueDate: newFee.dueDate,
      description: newFee.description,
      status: newFee.status,
      schoolId: user.schoolId!,
      createdAt: new Date().toISOString()
    };

    const allFees = getStorageData<Fee>('edusphere_fees');
    const updatedFees = [...allFees, fee];
    setStorageData('edusphere_fees', updatedFees);

    setNewFee({
      studentId: '',
      amount: '',
      dueDate: '',
      description: '',
      status: 'pending'
    });
    setShowAddModal(false);
    loadData();
    toast.success('Fee added successfully!');
  };

  const handleEditFee = (fee: Fee) => {
    setEditingFee(fee);
    setShowEditModal(true);
  };

  const handleSaveFee = () => {
    if (!editingFee) return;

    const allFees = getStorageData<Fee>('edusphere_fees');
    const updatedFees = allFees.map(f => f.id === editingFee.id ? editingFee : f);
    setStorageData('edusphere_fees', updatedFees);

    setShowEditModal(false);
    setEditingFee(null);
    loadData();
    toast.success('Fee updated successfully!');
  };

  const handleDeleteFee = (feeId: string) => {
    if (!confirm('Are you sure you want to delete this fee record?')) return;

    const allFees = getStorageData<Fee>('edusphere_fees');
    const updatedFees = allFees.filter(f => f.id !== feeId);
    setStorageData('edusphere_fees', updatedFees);

    loadData();
    toast.success('Fee deleted successfully!');
  };

  const handleMarkAsPaid = (feeId: string) => {
    const allFees = getStorageData<Fee>('edusphere_fees');
    const updatedFees = allFees.map(f => 
      f.id === feeId 
        ? { ...f, status: 'paid' as const, paidDate: new Date().toISOString().split('T')[0] }
        : f
    );
    setStorageData('edusphere_fees', updatedFees);

    loadData();
    toast.success('Fee marked as paid!');
  };

  const handleViewFee = (fee: Fee) => {
    setViewingFee(fee);
    setShowViewModal(true);
  };

  const handleViewStudentBreakdown = (studentStats: any) => {
    setSelectedStudentStats(studentStats);
    setShowStudentBreakdownModal(true);
  };

  const generateComprehensiveReport = () => {
    if (!feeStats) return;

    const pdf = new jsPDF();
    
    // Header
    pdf.setFontSize(20);
    pdf.text('Comprehensive Fee Management Report', 20, 30);
    
    pdf.setFontSize(12);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 45);
    pdf.text(`School: ${user.schoolId}`, 20, 55);
    pdf.text(`Principal: ${user.name}`, 20, 65);
    
    // Financial Summary
    pdf.setFontSize(16);
    pdf.text('Financial Summary', 20, 85);
    pdf.setFontSize(10);
    pdf.text(`Total Fee Amount: ₹${feeStats.totalAmount.toFixed(2)}`, 20, 100);
    pdf.text(`Collected Amount: ₹${feeStats.collectedAmount.toFixed(2)}`, 20, 110);
    pdf.text(`Pending Amount: ₹${feeStats.pendingAmount.toFixed(2)}`, 20, 120);
    pdf.text(`Overdue Amount: ₹${feeStats.overdueAmount.toFixed(2)}`, 20, 130);
    pdf.text(`Collection Rate: ${feeStats.collectionRate.toFixed(1)}%`, 20, 140);
    
    // Record Statistics
    pdf.setFontSize(16);
    pdf.text('Record Statistics', 20, 160);
    pdf.setFontSize(10);
    pdf.text(`Total Records: ${feeStats.totalRecords}`, 20, 175);
    pdf.text(`Paid Records: ${feeStats.paidRecords}`, 20, 185);
    pdf.text(`Pending Records: ${feeStats.pendingRecords}`, 20, 195);
    pdf.text(`Overdue Records: ${feeStats.overdueRecords}`, 20, 205);
    
    // Monthly Collection Trend
    pdf.setFontSize(16);
    pdf.text('Monthly Collection Trend', 20, 225);
    pdf.setFontSize(10);
    let yPos = 240;
    feeStats.monthlyCollection.forEach((month, index) => {
      pdf.text(`${month.month}: ₹${month.amount.toFixed(2)}`, 20, yPos);
      yPos += 10;
    });
    
    // Add new page for student-wise data
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.text('Individual Student Fee Summary', 20, 30);
    pdf.setFontSize(10);
    
    yPos = 45;
    feeStats.studentWiseStats.forEach((student, index) => {
      if (yPos > 250) {
        pdf.addPage();
        yPos = 30;
      }
      pdf.text(`${student.studentName} (${student.studentEmail}):`, 20, yPos);
      pdf.text(`  Total Fees: ₹${student.totalFees.toFixed(2)}`, 25, yPos + 10);
      pdf.text(`  Paid: ₹${student.paidFees.toFixed(2)} (${student.paymentPercentage.toFixed(1)}%)`, 25, yPos + 20);
      pdf.text(`  Pending: ₹${student.pendingFees.toFixed(2)}`, 25, yPos + 30);
      pdf.text(`  Overdue: ₹${student.overdueAmount.toFixed(2)}`, 25, yPos + 40);
      pdf.text(`  Records: ${student.totalRecords} total, ${student.paidRecords} paid, ${student.pendingRecords} pending, ${student.overdueRecords} overdue`, 25, yPos + 50);
      yPos += 65;
    });
    
    pdf.save(`comprehensive-fee-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const filteredFees = fees.filter(fee => {
    const student = students.find(s => s.id === fee.studentId);
    const matchesSearch = student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fee.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || fee.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'overdue':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!feeStats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-green-600" />
            Fee Management
          </h2>
          <p className="text-gray-600 mt-1">Individual student fee tracking and comprehensive management</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowStatsModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 flex items-center gap-2 transition-colors font-semibold"
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <button
            onClick={generateComprehensiveReport}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2 transition-colors font-semibold"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Fee
          </button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total School Fees</p>
              <p className="text-3xl font-bold mt-2">₹{feeStats.totalAmount.toFixed(2)}</p>
              <p className="text-blue-100 text-xs mt-1">{feeStats.totalRecords} records</p>
            </div>
            <div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Collected Amount</p>
              <p className="text-3xl font-bold mt-2">₹{feeStats.collectedAmount.toFixed(2)}</p>
              <p className="text-green-100 text-xs mt-1">{feeStats.paidRecords} payments</p>
            </div>
            <div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm font-medium">Pending Amount</p>
              <p className="text-3xl font-bold mt-2">₹{feeStats.pendingAmount.toFixed(2)}</p>
              <p className="text-yellow-100 text-xs mt-1">{feeStats.pendingRecords} pending</p>
            </div>
            <div className="w-12 h-12 bg-yellow-400 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Overdue Amount</p>
              <p className="text-3xl font-bold mt-2">₹{feeStats.overdueAmount.toFixed(2)}</p>
              <p className="text-red-100 text-xs mt-1">{feeStats.overdueRecords} overdue</p>
            </div>
            <div className="w-12 h-12 bg-red-400 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Collection Rate Progress */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Fee Collection Progress</h3>
          <span className="text-2xl font-bold text-green-600">{feeStats.collectionRate.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${feeStats.collectionRate}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-600 mt-2">
          <span>₹{feeStats.collectedAmount.toFixed(2)} collected</span>
          <span>₹{feeStats.totalAmount.toFixed(2)} total</span>
        </div>
      </div>

      {/* Individual Student Fee Breakdown */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Individual Student Fee Breakdown</h3>
          <span className="text-sm text-gray-600">{feeStats.studentWiseStats.length} students with fee records</span>
        </div>
        
        {feeStats.studentWiseStats.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No student fee records found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {feeStats.studentWiseStats.map((student, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">{student.studentName}</h4>
                    <p className="text-sm text-gray-600 truncate">{student.studentEmail}</p>
                  </div>
                  <button
                    onClick={() => handleViewStudentBreakdown(student)}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Fees:</span>
                    <span className="font-semibold text-gray-900">₹{student.totalFees.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paid:</span>
                    <span className="font-semibold text-green-600">₹{student.paidFees.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Pending:</span>
                    <span className="font-semibold text-orange-600">₹{(student.pendingFees + student.overdueAmount).toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Payment Progress</span>
                    <span>{student.paymentPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${student.paymentPercentage}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{student.paidRecords}/{student.totalRecords} paid</span>
                  {student.overdueRecords > 0 && (
                    <span className="text-red-600 font-medium">{student.overdueRecords} overdue</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setStatusFilter('overdue')}
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-red-200 hover:bg-red-50 transition-colors"
          >
            <XCircle className="w-5 h-5 text-red-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">View Overdue</p>
              <p className="text-sm text-gray-600">{feeStats.overdueRecords} overdue payments</p>
            </div>
          </button>
          
          <button
            onClick={() => setStatusFilter('pending')}
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-yellow-200 hover:bg-yellow-50 transition-colors"
          >
            <Clock className="w-5 h-5 text-yellow-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">View Pending</p>
              <p className="text-sm text-gray-600">{feeStats.pendingRecords} pending payments</p>
            </div>
          </button>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-3 p-4 bg-white rounded-lg border border-green-200 hover:bg-green-50 transition-colors"
          >
            <Plus className="w-5 h-5 text-green-600" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">Add New Fee</p>
              <p className="text-sm text-gray-600">Create fee record</p>
            </div>
          </button>
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
                placeholder="Search by student name, email, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Fee List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Fee Records</h3>
          
          {filteredFees.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Fee Records</h4>
              <p className="text-gray-600 mb-6">No fee records match your current filters.</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-semibold"
              >
                Add First Fee Record
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Student</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Due Date</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFees.map((fee) => {
                    const student = students.find(s => s.id === fee.studentId);
                    return (
                      <tr key={fee.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{student?.name}</p>
                            <p className="text-sm text-gray-600">{student?.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-900">{fee.description}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-gray-900">₹{fee.amount.toFixed(2)}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {new Date(fee.dueDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit ${getStatusColor(fee.status)}`}>
                            {getStatusIcon(fee.status)}
                            {fee.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewFee(fee)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEditFee(fee)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Edit Fee"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            {fee.status === 'pending' && (
                              <button
                                onClick={() => handleMarkAsPaid(fee.id)}
                                className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                                title="Mark as Paid"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteFee(fee.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Delete Fee"
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

      {/* Student Breakdown Modal */}
      {showStudentBreakdownModal && selectedStudentStats && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <User className="w-6 h-6 text-blue-600" />
                Individual Fee Breakdown
              </h3>
              <button
                onClick={() => setShowStudentBreakdownModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Student Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2">{selectedStudentStats.studentName}</h4>
                <p className="text-blue-700">{selectedStudentStats.studentEmail}</p>
              </div>

              {/* Fee Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">₹{selectedStudentStats.totalFees.toFixed(2)}</p>
                  <p className="text-sm text-blue-700">Total Fees</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">₹{selectedStudentStats.paidFees.toFixed(2)}</p>
                  <p className="text-sm text-green-700">Paid</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">₹{selectedStudentStats.pendingFees.toFixed(2)}</p>
                  <p className="text-sm text-yellow-700">Pending</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">₹{selectedStudentStats.overdueAmount.toFixed(2)}</p>
                  <p className="text-sm text-red-700">Overdue</p>
                </div>
              </div>

              {/* Payment Progress */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Payment Progress</span>
                  <span>{selectedStudentStats.paymentPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-green-500 h-4 rounded-full transition-all duration-300"
                    style={{ width: `${selectedStudentStats.paymentPercentage}%` }}
                  />
                </div>
              </div>

              {/* Record Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-xl font-bold text-gray-900">{selectedStudentStats.totalRecords}</p>
                  <p className="text-xs text-gray-600">Total Records</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xl font-bold text-green-600">{selectedStudentStats.paidRecords}</p>
                  <p className="text-xs text-green-700">Paid Records</p>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xl font-bold text-yellow-600">{selectedStudentStats.pendingRecords}</p>
                  <p className="text-xs text-yellow-700">Pending Records</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-xl font-bold text-red-600">{selectedStudentStats.overdueRecords}</p>
                  <p className="text-xs text-red-700">Overdue Records</p>
                </div>
              </div>

              {/* Key Insights */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h5 className="font-semibold text-gray-900 mb-2">Key Insights</h5>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-700">
                    • Payment completion rate: <span className="font-semibold">{selectedStudentStats.paymentPercentage.toFixed(1)}%</span>
                  </p>
                  <p className="text-gray-700">
                    • Outstanding amount: <span className="font-semibold">₹{(selectedStudentStats.pendingFees + selectedStudentStats.overdueAmount).toFixed(2)}</span>
                  </p>
                  {selectedStudentStats.overdueRecords > 0 && (
                    <p className="text-red-700">
                      • <span className="font-semibold">Attention needed:</span> {selectedStudentStats.overdueRecords} overdue payment(s)
                    </p>
                  )}
                  {selectedStudentStats.paymentPercentage === 100 && (
                    <p className="text-green-700">
                      • <span className="font-semibold">Excellent:</span> All fees paid on time!
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-purple-600" />
                Fee Analytics & Insights
              </h3>
              <button
                onClick={() => setShowStatsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-8">
              {/* Monthly Collection Trend */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Monthly Collection Trend</h4>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="grid grid-cols-6 gap-4">
                    {feeStats.monthlyCollection.map((month, index) => (
                      <div key={index} className="text-center">
                        <div className="bg-blue-100 rounded-lg p-3 mb-2">
                          <p className="text-xs font-medium text-blue-800">{month.month}</p>
                          <p className="text-lg font-bold text-blue-900">₹{month.amount.toFixed(0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Student-wise Fee Summary */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Student-wise Fee Summary</h4>
                <div className="bg-gray-50 rounded-xl p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-3">
                    {feeStats.studentWiseStats.map((student, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-semibold text-gray-900">{student.studentName}</h5>
                          <span className="text-sm font-medium text-gray-600">
                            {student.paymentPercentage.toFixed(1)}% paid
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Total</p>
                            <p className="font-semibold text-gray-900">₹{student.totalFees.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Paid</p>
                            <p className="font-semibold text-green-600">₹{student.paidFees.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Pending</p>
                            <p className="font-semibold text-yellow-600">₹{student.pendingFees.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Overdue</p>
                            <p className="font-semibold text-red-600">₹{student.overdueAmount.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${student.paymentPercentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <h5 className="font-semibold text-green-900">Collection Performance</h5>
                    </div>
                    <p className="text-green-800 text-sm">
                      {feeStats.collectionRate >= 80 
                        ? 'Excellent collection rate! Keep up the good work.'
                        : feeStats.collectionRate >= 60
                        ? 'Good collection rate. Consider following up on pending payments.'
                        : 'Collection rate needs improvement. Focus on overdue payments.'
                      }
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <h5 className="font-semibold text-blue-900">Student Coverage</h5>
                    </div>
                    <p className="text-blue-800 text-sm">
                      {feeStats.studentWiseStats.length} out of {students.length} students have fee records.
                      {feeStats.studentWiseStats.length < students.length && 
                        ` Consider adding fees for remaining ${students.length - feeStats.studentWiseStats.length} students.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Fee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-green-600" />
                Add New Fee
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Student *
                </label>
                <select
                  value={newFee.studentId}
                  onChange={(e) => setNewFee({ ...newFee, studentId: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                >
                  <option value="">Select Student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} - {student.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <input
                  type="text"
                  value={newFee.description}
                  onChange={(e) => setNewFee({ ...newFee, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  placeholder="e.g., Tuition Fee - January 2024"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newFee.amount}
                    onChange={(e) => setNewFee({ ...newFee, amount: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={newFee.dueDate}
                    onChange={(e) => setNewFee({ ...newFee, dueDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={newFee.status}
                  onChange={(e) => setNewFee({ ...newFee, status: e.target.value as any })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
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
                onClick={handleAddFee}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-lg"
              >
                Add Fee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Fee Modal */}
      {showEditModal && editingFee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Edit className="w-6 h-6 text-green-600" />
                Edit Fee
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Student
                </label>
                <select
                  value={editingFee.studentId}
                  onChange={(e) => setEditingFee({ ...editingFee, studentId: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                >
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.name} - {student.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={editingFee.description}
                  onChange={(e) => setEditingFee({ ...editingFee, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingFee.amount}
                    onChange={(e) => setEditingFee({ ...editingFee, amount: parseFloat(e.target.value) })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editingFee.dueDate}
                    onChange={(e) => setEditingFee({ ...editingFee, dueDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={editingFee.status}
                  onChange={(e) => setEditingFee({ ...editingFee, status: e.target.value as any })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>

              {editingFee.status === 'paid' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Paid Date
                  </label>
                  <input
                    type="date"
                    value={editingFee.paidDate || ''}
                    onChange={(e) => setEditingFee({ ...editingFee, paidDate: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFee}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-lg"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Fee Modal */}
      {showViewModal && viewingFee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Eye className="w-6 h-6 text-green-600" />
                Fee Details
              </h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Student</label>
                <p className="text-gray-900 font-semibold">
                  {students.find(s => s.id === viewingFee.studentId)?.name}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-900 font-semibold">{viewingFee.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Amount</label>
                  <p className="text-gray-900 font-semibold text-lg">₹{viewingFee.amount.toFixed(2)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(viewingFee.status)}
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(viewingFee.status)}`}>
                      {viewingFee.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Due Date</label>
                  <p className="text-gray-900 font-semibold">
                    {new Date(viewingFee.dueDate).toLocaleDateString()}
                  </p>
                </div>
                {viewingFee.paidDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Paid Date</label>
                    <p className="text-gray-900 font-semibold">
                      {new Date(viewingFee.paidDate).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Created</label>
                <p className="text-gray-900 font-semibold">
                  {new Date(viewingFee.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};