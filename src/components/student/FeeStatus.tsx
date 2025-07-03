import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Calendar,
  Download,
  Eye,
  X,
  AlertCircle,
  CreditCard,
  Receipt,
  TrendingUp,
  PieChart
} from 'lucide-react';
import { User as UserType, Fee } from '../../types';
import { getStorageData } from '../../utils/mockData';
import jsPDF from 'jspdf';

interface FeeStatusProps {
  user: UserType;
}

interface StudentFeeBreakdown {
  totalFees: number;
  paidFees: number;
  pendingFees: number;
  overdueFees: number;
  paymentPercentage: number;
  totalRecords: number;
  paidRecords: number;
  pendingRecords: number;
  overdueRecords: number;
}

export const FeeStatus: React.FC<FeeStatusProps> = ({ user }) => {
  const [fees, setFees] = useState<Fee[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingFee, setViewingFee] = useState<Fee | null>(null);
  const [feeBreakdown, setFeeBreakdown] = useState<StudentFeeBreakdown | null>(null);

  useEffect(() => {
    loadFees();
  }, [user.id]);

  useEffect(() => {
    calculateFeeBreakdown();
  }, [fees]);

  const loadFees = () => {
    const allFees = getStorageData<Fee>('edusphere_fees');
    const userFees = allFees.filter(fee => fee.studentId === user.id);
    setFees(userFees.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const calculateFeeBreakdown = () => {
    const totalFees = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const paidFees = fees.filter(f => f.status === 'paid').reduce((sum, fee) => sum + fee.amount, 0);
    const pendingFees = fees.filter(f => f.status === 'pending').reduce((sum, fee) => sum + fee.amount, 0);
    const overdueFees = fees.filter(f => f.status === 'overdue').reduce((sum, fee) => sum + fee.amount, 0);
    
    const totalRecords = fees.length;
    const paidRecords = fees.filter(f => f.status === 'paid').length;
    const pendingRecords = fees.filter(f => f.status === 'pending').length;
    const overdueRecords = fees.filter(f => f.status === 'overdue').length;
    
    const paymentPercentage = totalFees > 0 ? (paidFees / totalFees) * 100 : 0;

    setFeeBreakdown({
      totalFees,
      paidFees,
      pendingFees,
      overdueFees,
      paymentPercentage,
      totalRecords,
      paidRecords,
      pendingRecords,
      overdueRecords
    });
  };

  const handleViewFee = (fee: Fee) => {
    setViewingFee(fee);
    setShowViewModal(true);
  };

  const generateReceipt = (fee: Fee) => {
    if (fee.status !== 'paid') return;

    const pdf = new jsPDF();
    
    // Header
    pdf.setFontSize(20);
    pdf.text('Fee Payment Receipt', 20, 30);
    
    // Receipt details
    pdf.setFontSize(12);
    pdf.text(`Receipt No: ${fee.id.toUpperCase()}`, 20, 50);
    pdf.text(`Date: ${fee.paidDate ? new Date(fee.paidDate).toLocaleDateString() : 'N/A'}`, 20, 60);
    
    // Student details
    pdf.setFontSize(14);
    pdf.text('Student Details:', 20, 80);
    pdf.setFontSize(10);
    pdf.text(`Name: ${user.name}`, 20, 95);
    pdf.text(`Email: ${user.email}`, 20, 105);
    pdf.text(`Roll Number: ${user.rollNumber || 'N/A'}`, 20, 115);
    
    // Fee details
    pdf.setFontSize(14);
    pdf.text('Fee Details:', 20, 135);
    pdf.setFontSize(10);
    pdf.text(`Description: ${fee.description}`, 20, 150);
    pdf.text(`Amount: ₹${fee.amount.toFixed(2)}`, 20, 160);
    pdf.text(`Due Date: ${new Date(fee.dueDate).toLocaleDateString()}`, 20, 170);
    pdf.text(`Payment Date: ${fee.paidDate ? new Date(fee.paidDate).toLocaleDateString() : 'N/A'}`, 20, 180);
    pdf.text(`Status: ${fee.status.toUpperCase()}`, 20, 190);
    
    // Footer
    pdf.setFontSize(8);
    pdf.text('This is a computer-generated receipt.', 20, 250);
    
    pdf.save(`receipt-${fee.id}.pdf`);
  };

  const generateCompleteFeeStatement = () => {
    if (!feeBreakdown) return;

    const pdf = new jsPDF();
    
    // Header
    pdf.setFontSize(20);
    pdf.text('Complete Fee Statement', 20, 30);
    
    // Student details
    pdf.setFontSize(12);
    pdf.text(`Student: ${user.name}`, 20, 50);
    pdf.text(`Email: ${user.email}`, 20, 60);
    pdf.text(`Roll Number: ${user.rollNumber || 'N/A'}`, 20, 70);
    pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 80);
    
    // Fee Summary
    pdf.setFontSize(16);
    pdf.text('Fee Summary', 20, 100);
    pdf.setFontSize(12);
    pdf.text(`Total Fees: ₹${feeBreakdown.totalFees.toFixed(2)}`, 20, 115);
    pdf.text(`Paid Amount: ₹${feeBreakdown.paidFees.toFixed(2)}`, 20, 125);
    pdf.text(`Pending Amount: ₹${feeBreakdown.pendingFees.toFixed(2)}`, 20, 135);
    pdf.text(`Overdue Amount: ₹${feeBreakdown.overdueFees.toFixed(2)}`, 20, 145);
    pdf.text(`Payment Completion: ${feeBreakdown.paymentPercentage.toFixed(1)}%`, 20, 155);
    
    // Record Summary
    pdf.setFontSize(16);
    pdf.text('Record Summary', 20, 175);
    pdf.setFontSize(12);
    pdf.text(`Total Records: ${feeBreakdown.totalRecords}`, 20, 190);
    pdf.text(`Paid Records: ${feeBreakdown.paidRecords}`, 20, 200);
    pdf.text(`Pending Records: ${feeBreakdown.pendingRecords}`, 20, 210);
    pdf.text(`Overdue Records: ${feeBreakdown.overdueRecords}`, 20, 220);
    
    // Detailed Records
    if (fees.length > 0) {
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text('Detailed Fee Records', 20, 30);
      
      let yPos = 50;
      fees.forEach((fee, index) => {
        if (yPos > 250) {
          pdf.addPage();
          yPos = 30;
        }
        
        pdf.setFontSize(10);
        pdf.text(`${index + 1}. ${fee.description}`, 20, yPos);
        pdf.text(`Amount: ₹${fee.amount.toFixed(2)}`, 25, yPos + 10);
        pdf.text(`Due Date: ${new Date(fee.dueDate).toLocaleDateString()}`, 25, yPos + 20);
        pdf.text(`Status: ${fee.status.toUpperCase()}`, 25, yPos + 30);
        if (fee.paidDate) {
          pdf.text(`Paid Date: ${new Date(fee.paidDate).toLocaleDateString()}`, 25, yPos + 40);
          yPos += 50;
        } else {
          yPos += 40;
        }
        yPos += 10;
      });
    }
    
    pdf.save(`fee-statement-${user.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

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

  const filteredFees = fees.filter(fee => {
    if (statusFilter === 'all') return true;
    return fee.status === statusFilter;
  });

  if (!feeBreakdown) {
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
            My Fee Status
          </h2>
          <p className="text-gray-600 mt-1">Complete breakdown of your fees, payments, and pending dues</p>
        </div>
        <button
          onClick={generateCompleteFeeStatement}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 flex items-center gap-2 transition-colors font-semibold"
        >
          <Download className="w-4 h-4" />
          Download Statement
        </button>
      </div>

      {/* Individual Student Fee Breakdown */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Your Complete Fee Breakdown</h3>
            <p className="text-gray-600">Individual fee summary and payment status</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Total Fees */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Fees Assigned</p>
                <p className="text-3xl font-bold text-blue-600 mt-1">₹{feeBreakdown.totalFees.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">{feeBreakdown.totalRecords} fee records</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Paid Fees */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Amount Paid</p>
                <p className="text-3xl font-bold text-green-600 mt-1">₹{feeBreakdown.paidFees.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">{feeBreakdown.paidRecords} payments completed</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Remaining Fees */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Still Pending</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">₹{(feeBreakdown.pendingFees + feeBreakdown.overdueFees).toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">{feeBreakdown.pendingRecords + feeBreakdown.overdueRecords} payments due</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Payment Progress */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Payment Progress</h4>
            <span className="text-2xl font-bold text-green-600">{feeBreakdown.paymentPercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-6 mb-4">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-6 rounded-full transition-all duration-500 flex items-center justify-center"
              style={{ width: `${feeBreakdown.paymentPercentage}%` }}
            >
              {feeBreakdown.paymentPercentage > 10 && (
                <span className="text-white text-xs font-bold">
                  {feeBreakdown.paymentPercentage.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>₹{feeBreakdown.paidFees.toFixed(2)} paid</span>
            <span>₹{feeBreakdown.totalFees.toFixed(2)} total</span>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Paid</p>
                <p className="text-2xl font-bold text-green-600">₹{feeBreakdown.paidFees.toFixed(2)}</p>
                <p className="text-xs text-green-700">{feeBreakdown.paidRecords} records</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-900">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">₹{feeBreakdown.pendingFees.toFixed(2)}</p>
                <p className="text-xs text-yellow-700">{feeBreakdown.pendingRecords} records</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Overdue</p>
                <p className="text-2xl font-bold text-red-600">₹{feeBreakdown.overdueFees.toFixed(2)}</p>
                <p className="text-xs text-red-700">{feeBreakdown.overdueRecords} records</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Alert */}
      {(feeBreakdown.pendingFees > 0 || feeBreakdown.overdueFees > 0) && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 mb-2">Payment Required</h3>
              <p className="text-orange-800 mb-4">
                You have outstanding fees totaling ₹{(feeBreakdown.pendingFees + feeBreakdown.overdueFees).toFixed(2)} that need to be paid. 
                Please contact the school office for payment instructions.
              </p>
              <div className="flex flex-wrap gap-4 text-sm">
                {feeBreakdown.pendingFees > 0 && (
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium">
                    Pending: ₹{feeBreakdown.pendingFees.toFixed(2)}
                  </span>
                )}
                {feeBreakdown.overdueFees > 0 && (
                  <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full font-medium">
                    Overdue: ₹{feeBreakdown.overdueFees.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Individual Fee Records</h3>
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
          {filteredFees.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Fee Records</h4>
              <p className="text-gray-600">
                {statusFilter === 'all' 
                  ? 'You have no fee records yet.'
                  : `No ${statusFilter} fees found.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredFees.map((fee) => (
                <div key={fee.id} className={`p-6 rounded-xl border-l-4 ${
                  fee.status === 'paid' ? 'border-green-500 bg-green-50' :
                  fee.status === 'pending' ? 'border-yellow-500 bg-yellow-50' :
                  'border-red-500 bg-red-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{fee.description}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(fee.status)}`}>
                          {getStatusIcon(fee.status)}
                          {fee.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1 font-semibold text-lg text-gray-900">
                          <DollarSign className="w-4 h-4" />
                          ₹{fee.amount.toFixed(2)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Due: {new Date(fee.dueDate).toLocaleDateString()}
                        </span>
                        {fee.paidDate && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Paid: {new Date(fee.paidDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      
                      {fee.status === 'overdue' && (
                        <div className="bg-red-100 border border-red-200 rounded-lg p-3 mb-3">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-800">
                              This fee is overdue. Please contact the school office immediately.
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleViewFee(fee)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {fee.status === 'paid' && (
                        <button
                          onClick={() => generateReceipt(fee)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Download Receipt"
                        >
                          <Download className="w-4 h-4" />
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

      {/* View Fee Modal */}
      {showViewModal && viewingFee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Receipt className="w-6 h-6 text-green-600" />
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
                <label className="text-sm font-medium text-gray-600">Description</label>
                <p className="text-gray-900 font-semibold text-lg">{viewingFee.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Amount</label>
                  <p className="text-gray-900 font-semibold text-xl">₹{viewingFee.amount.toFixed(2)}</p>
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

              {viewingFee.status === 'paid' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-green-800">Payment Completed</h4>
                      <p className="text-sm text-green-700">Download your receipt for records</p>
                    </div>
                    <button
                      onClick={() => generateReceipt(viewingFee)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold"
                    >
                      <Download className="w-4 h-4" />
                      Receipt
                    </button>
                  </div>
                </div>
              )}

              {viewingFee.status === 'pending' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-yellow-800">Payment Pending</h4>
                      <p className="text-sm text-yellow-700">
                        Please contact the school office for payment instructions.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {viewingFee.status === 'overdue' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-800">Payment Overdue</h4>
                      <p className="text-sm text-red-700">
                        This payment is past due. Please contact the school office immediately to avoid any penalties.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};