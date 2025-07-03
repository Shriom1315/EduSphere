import React, { useState, useEffect } from 'react';
import {
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  Download,
  Search,
  Filter,
  Clock,
  User,
  Calendar,
  AlertCircle,
  X,
  Check
} from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { CertificateRequest, User as UserType, School } from '../../types';
import { generateCertificatePDF, downloadPDF } from '../../utils/certificateGenerator';
import toast from 'react-hot-toast';

interface CertificateManagementProps {
  user: UserType;
}

import { db } from '../../lib/firebase'; // Import db from your firebase initialization
export const CertificateManagement: React.FC<CertificateManagementProps> = ({ user }) => {
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [students, setStudents] = useState<UserType[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<CertificateRequest | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<CertificateRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const certificateTypes = [
    { value: 'bonafide', label: 'Bonafide Certificate' },
    { value: 'character', label: 'Character Certificate' },
    { value: 'transfer', label: 'Transfer Certificate' },
    { value: 'conduct', label: 'Conduct Certificate' },
    { value: 'study', label: 'Study Certificate' },
    { value: 'migration', label: 'Migration Certificate' }
  ];

  useEffect(() => {
    loadData();
  }, [user.schoolId]);

  const loadData = async () => {
    if (!user.schoolId) return;

    // Fetch certificate requests in real-time
    const requestsCollectionRef = collection(db, 'certificate_requests');
    const qRequests = query(requestsCollectionRef, where('schoolId', '==', user.schoolId));
    
    const unsubscribe = onSnapshot(qRequests, (snapshot) => {
      const fetchedRequests: CertificateRequest[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CertificateRequest[]; // Type assertion assuming data matches interface
      setRequests(fetchedRequests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
    });

    // Fetch student users once
    const usersCollectionRef = collection(db, 'users');
    const qStudents = query(usersCollectionRef, where('schoolId', '==', user.schoolId), where('role', '==', 'student'));
    const studentSnapshot = await getDocs(qStudents);
    const fetchedStudents: UserType[] = studentSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as UserType[]; // Type assertion
    setStudents(fetchedStudents);

    // Fetch school data once
    const schoolDocRef = doc(db, 'schools', user.schoolId);
    const schoolSnapshot = await getDoc(schoolDocRef);
    setSchool(schoolSnapshot.exists() ? schoolSnapshot.data() as School : null); // Type assertion
  };

  const handleApproveRequest = async (request: CertificateRequest) => {
    if (!school) {
      toast.error('School information not found');
      return;
    }

    const student = students.find(s => s.id === request.studentId);
    if (!student) {
      toast.error('Student information not found');
      return;
    }

    try {
      // Generate certificate number
      const certificateNumber = `${school.name.substring(0, 3).toUpperCase()}/${new Date().getFullYear()}/${String(Date.now()).slice(-6)}`;
      
      // Generate PDF
      const certificateUrl = generateCertificatePDF(request, student, school, certificateNumber);
      
      // Calculate validity (1 year from now for most certificates)
      const validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);

      // Update request
      const updatedRequest: CertificateRequest = {
        ...request,
        status: 'generated',
        reviewedAt: new Date().toISOString(),
        reviewedBy: user.id,
        certificateUrl,
        certificateNumber,
        validUntil: validUntil.toISOString()
      };

      // Update document in Firestore
      await updateDoc(doc(db, 'certificate_requests', request.id), updatedRequest as any); // Use 'any' temporarily or define stricter type for update
      toast.success('Certificate approved and generated successfully!');
      // No need to call loadData() explicitly due to onSnapshot
    } catch (error) {
      toast.error('Failed to generate certificate');
      console.error('Certificate generation error:', error);
    }
  };

  const handleRejectRequest = () => {
    if (!rejectingRequest || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    const updatedRequest: CertificateRequest = {
      ...rejectingRequest,
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
      reviewedBy: user.id,
      rejectionReason: rejectionReason.trim()
    };

    // Update document in Firestore
    await updateDoc(doc(db, 'certificate_requests', rejectingRequest.id), updatedRequest as any); // Use 'any' temporarily or define stricter type for update
    
    setShowRejectModal(false);
    setRejectingRequest(null); // Close modal will happen due to state change
    toast.success('Certificate request rejected');
  };

  const handleViewRequest = (request: CertificateRequest) => {
    setViewingRequest(request);
    setShowViewModal(true);
  };

  const handleDownloadCertificate = (request: CertificateRequest) => {
    if (request.certificateUrl) {
      const certificateType = certificateTypes.find(type => type.value === request.certificateType);
      const filename = `${certificateType?.label.replace(' ', '_')}_${request.certificateNumber}.pdf`;
      downloadPDF(request.certificateUrl, filename);
      toast.success('Certificate downloaded successfully!');
    }
  };

  const openRejectModal = (request: CertificateRequest) => {
    setRejectingRequest(request);
    setShowRejectModal(true);
  };

  const filteredRequests = requests.filter(request => {
    const student = students.find(s => s.id === request.studentId);
    const matchesSearch = student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.certificateNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.certificateType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'generated':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'generated':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const generatedCount = requests.filter(r => r.status === 'generated').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <FileText className="w-6 h-6 text-blue-600" />
          Certificate Management
        </h2>
        <p className="text-gray-600 mt-1">Review and approve student certificate requests</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Requests</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingCount}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Generated</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{generatedCount}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{rejectedCount}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Requests</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{requests.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
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
                placeholder="Search by student name, email, or certificate number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="generated">Generated</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Types</option>
            {certificateTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Certificate Requests</h3>
          
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Certificate Requests</h4>
              <p className="text-gray-600">No certificate requests match your current filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const student = students.find(s => s.id === request.studentId);
                const certificateType = certificateTypes.find(type => type.value === request.certificateType);
                
                return (
                  <div key={request.id} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{certificateType?.label}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            {request.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">{student?.name}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-gray-600">{student?.email}</span>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{request.purpose}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Requested: {new Date(request.requestedAt).toLocaleDateString()}
                          </span>
                          {request.reviewedAt && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Reviewed: {new Date(request.reviewedAt).toLocaleDateString()}
                            </span>
                          )}
                          {request.certificateNumber && (
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              Cert. No: {request.certificateNumber}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleViewRequest(request)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveRequest(request)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Approve & Generate"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openRejectModal(request)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject Request"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {request.status === 'generated' && request.certificateUrl && (
                          <button
                            onClick={() => handleDownloadCertificate(request)}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Download Certificate"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* View Request Modal */}
      {showViewModal && viewingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                Certificate Request Details
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
                <label className="text-sm font-medium text-gray-600">Student</label>
                <p className="text-lg font-semibold text-gray-900">
                  {students.find(s => s.id === viewingRequest.studentId)?.name}
                </p>
                <p className="text-sm text-gray-600">
                  {students.find(s => s.id === viewingRequest.studentId)?.email}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Certificate Type</label>
                <p className="text-lg font-semibold text-gray-900">
                  {certificateTypes.find(type => type.value === viewingRequest.certificateType)?.label}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusIcon(viewingRequest.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(viewingRequest.status)}`}>
                    {viewingRequest.status.toUpperCase()}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Purpose</label>
                <p className="text-gray-900 mt-1">{viewingRequest.purpose}</p>
              </div>

              {viewingRequest.additionalDetails && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Additional Details</label>
                  <p className="text-gray-900 mt-1">{viewingRequest.additionalDetails}</p>
                </div>
              )}

              {viewingRequest.status === 'rejected' && viewingRequest.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <label className="text-sm font-medium text-red-800">Rejection Reason</label>
                  <p className="text-red-700 mt-1">{viewingRequest.rejectionReason}</p>
                </div>
              )}

              {viewingRequest.status === 'pending' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleApproveRequest(viewingRequest);
                    }}
                    className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Approve & Generate
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      openRejectModal(viewingRequest);
                    }}
                    className="flex-1 bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Request Modal */}
      {showRejectModal && rejectingRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <XCircle className="w-6 h-6 text-red-600" />
                Reject Request
              </h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-800 font-medium">
                  You are about to reject the certificate request from{' '}
                  <span className="font-bold">
                    {students.find(s => s.id === rejectingRequest.studentId)?.name}
                  </span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reason for Rejection *
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  placeholder="Please provide a clear reason for rejecting this certificate request..."
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectRequest}
                disabled={!rejectionReason.trim()}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};