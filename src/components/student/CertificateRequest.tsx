import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Eye,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  X
} from 'lucide-react';
import { CertificateRequest, User as UserType } from '../../types';
import { getStorageData, setStorageData } from '../../utils/mockData';
import { downloadPDF } from '../../utils/certificateGenerator';
import toast from 'react-hot-toast';

interface CertificateRequestProps {
  user: UserType;
}

export const CertificateRequestComponent: React.FC<CertificateRequestProps> = ({ user }) => {
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<CertificateRequest | null>(null);
  
  const [newRequest, setNewRequest] = useState({
    certificateType: '',
    purpose: '',
    additionalDetails: ''
  });

  const certificateTypes = [
    { value: 'bonafide', label: 'Bonafide Certificate', description: 'Certifies that you are a student of this institution' },
    { value: 'character', label: 'Character Certificate', description: 'Certifies your character and conduct' },
    { value: 'transfer', label: 'Transfer Certificate', description: 'Required for transferring to another institution' },
    { value: 'conduct', label: 'Conduct Certificate', description: 'Certifies your behavior and discipline record' },
    { value: 'study', label: 'Study Certificate', description: 'Certifies your current enrollment status' },
    { value: 'migration', label: 'Migration Certificate', description: 'Required for higher education or employment' }
  ];

  useEffect(() => {
    loadRequests();
  }, [user.id]);

  const loadRequests = () => {
    const allRequests = getStorageData<CertificateRequest>('edusphere_certificate_requests');
    const userRequests = allRequests.filter(req => req.studentId === user.id);
    setRequests(userRequests.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()));
  };

  const handleSubmitRequest = () => {
    if (!newRequest.certificateType || !newRequest.purpose.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const request: CertificateRequest = {
      id: `cert_req_${Date.now()}`,
      studentId: user.id,
      schoolId: user.schoolId!,
      certificateType: newRequest.certificateType as any,
      purpose: newRequest.purpose.trim(),
      additionalDetails: newRequest.additionalDetails.trim() || undefined,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };

    const allRequests = getStorageData<CertificateRequest>('edusphere_certificate_requests');
    const updatedRequests = [...allRequests, request];
    setStorageData('edusphere_certificate_requests', updatedRequests);

    setNewRequest({
      certificateType: '',
      purpose: '',
      additionalDetails: ''
    });
    setShowRequestModal(false);
    loadRequests();
    toast.success('Certificate request submitted successfully!');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            Certificate Requests
          </h2>
          <p className="text-gray-600 mt-1">Request and track your academic certificates</p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
        >
          <Plus className="w-5 h-5" />
          New Request
        </button>
      </div>

      {/* Certificate Types Info */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Certificates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {certificateTypes.map((type) => (
            <div key={type.value} className="bg-white p-4 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
              <h4 className="font-semibold text-gray-900 mb-2">{type.label}</h4>
              <p className="text-sm text-gray-600">{type.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">My Certificate Requests</h3>
          
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Certificate Requests</h4>
              <p className="text-gray-600 mb-6">You haven't requested any certificates yet.</p>
              <button
                onClick={() => setShowRequestModal(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-semibold"
              >
                Request Your First Certificate
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => {
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
                        {request.status === 'generated' && request.certificateUrl && (
                          <button
                            onClick={() => handleDownloadCertificate(request)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
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

      {/* New Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                Request Certificate
              </h3>
              <button
                onClick={() => setShowRequestModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Certificate Type *
                </label>
                <select
                  value={newRequest.certificateType}
                  onChange={(e) => setNewRequest({ ...newRequest, certificateType: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="">Select Certificate Type</option>
                  {certificateTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {newRequest.certificateType && (
                  <p className="text-sm text-gray-600 mt-2">
                    {certificateTypes.find(type => type.value === newRequest.certificateType)?.description}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Purpose *
                </label>
                <textarea
                  value={newRequest.purpose}
                  onChange={(e) => setNewRequest({ ...newRequest, purpose: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Please specify the purpose for which you need this certificate..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={newRequest.additionalDetails}
                  onChange={(e) => setNewRequest({ ...newRequest, additionalDetails: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="Any additional information or special requirements..."
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-1">Important Note</h4>
                    <p className="text-sm text-yellow-700">
                      Your certificate request will be reviewed by the principal. Processing typically takes 2-3 business days. 
                      You will be notified once your certificate is ready for download.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setShowRequestModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitRequest}
                disabled={!newRequest.certificateType || !newRequest.purpose.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Requested Date</label>
                  <p className="text-gray-900 font-semibold">
                    {new Date(viewingRequest.requestedAt).toLocaleDateString()}
                  </p>
                </div>
                {viewingRequest.reviewedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Reviewed Date</label>
                    <p className="text-gray-900 font-semibold">
                      {new Date(viewingRequest.reviewedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {viewingRequest.certificateNumber && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Certificate Number</label>
                  <p className="text-gray-900 font-semibold">{viewingRequest.certificateNumber}</p>
                </div>
              )}

              {viewingRequest.validUntil && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Valid Until</label>
                  <p className="text-gray-900 font-semibold">
                    {new Date(viewingRequest.validUntil).toLocaleDateString()}
                  </p>
                </div>
              )}

              {viewingRequest.status === 'rejected' && viewingRequest.rejectionReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <label className="text-sm font-medium text-red-800">Rejection Reason</label>
                  <p className="text-red-700 mt-1">{viewingRequest.rejectionReason}</p>
                </div>
              )}

              {viewingRequest.status === 'generated' && viewingRequest.certificateUrl && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-green-800">Certificate Ready</h4>
                      <p className="text-sm text-green-700">Your certificate is ready for download</p>
                    </div>
                    <button
                      onClick={() => handleDownloadCertificate(viewingRequest)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-semibold"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
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