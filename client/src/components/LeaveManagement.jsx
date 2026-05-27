// client/src/components/LeaveManagement.jsx
import React, { useState, useEffect } from 'react';
import Navbar from './Navbar.jsx';
import toast from 'react-hot-toast';

const LeaveManagement = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comment, setComment] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = () => {
    const allRequests = JSON.parse(localStorage.getItem('ems_leave_requests') || '[]');
    setLeaveRequests(allRequests);
    setLoading(false);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'Approved':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">✅ Approved</span>;
      case 'Rejected':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">❌ Rejected</span>;
      case 'Pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">⏳ Pending</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getLeaveTypeIcon = (type) => {
    const icons = {
      'Sick Leave': '🤒',
      'Casual Leave': '🏖️',
      'Annual Leave': '🌴',
      'Emergency Leave': '🚨',
      'Maternity/Paternity Leave': '👶',
      'Bereavement Leave': '💔',
      'Study Leave': '📚',
      'Other': '📝'
    };
    return icons[type] || '📋';
  };

  const createEmployeeNotification = async (message, type, leaveRequestId, targetUser) => {
    const notification = {
      id: Date.now().toString(),
      message,
      type,
      leaveRequestId: leaveRequestId,
      targetUser: targetUser,
      read: false,
      createdAt: new Date().toISOString()
    };
    
    const existing = JSON.parse(localStorage.getItem('ems_notifications') || '[]');
    existing.unshift(notification);
    localStorage.setItem('ems_notifications', JSON.stringify(existing));
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const submitDecision = async (decision) => {
    const adminUser = JSON.parse(localStorage.getItem('user'));
    const updatedRequests = leaveRequests.map(req => {
      if (req.id === selectedRequest.id) {
        return {
          ...req,
          status: decision,
          reviewedBy: adminUser.fullName || adminUser.username,
          reviewedOn: new Date().toISOString(),
          comments: comment || null
        };
      }
      return req;
    });

    localStorage.setItem('ems_leave_requests', JSON.stringify(updatedRequests));
    setLeaveRequests(updatedRequests);

    // Create notification for Employee only
    const notificationMessage = decision === 'Approved' 
      ? `✅ Your leave request (${selectedRequest.leaveType}) has been APPROVED by ${adminUser.fullName || adminUser.username}`
      : `❌ Your leave request (${selectedRequest.leaveType}) has been REJECTED by ${adminUser.fullName || adminUser.username}`;
    
    let finalMessage = notificationMessage;
    if (comment) {
      finalMessage += `\n📝 Remarks: ${comment}`;
    }
    
    await createEmployeeNotification(
      finalMessage,
      'leave_response',
      selectedRequest.id,
      selectedRequest.employeeEmail
    );

    toast.success(`Leave request ${decision.toLowerCase()} successfully`);
    setShowModal(false);
    setComment('');
    setSelectedRequest(null);
  };

  const filteredRequests = leaveRequests.filter(req => {
    if (filter === 'all') return true;
    if (filter === 'pending') return req.status === 'Pending';
    if (filter === 'approved') return req.status === 'Approved';
    if (filter === 'rejected') return req.status === 'Rejected';
    return true;
  });

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage employee leave requests</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6 border-b">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium ${filter === 'all' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            All Requests ({leaveRequests.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 text-sm font-medium ${filter === 'pending' ? 'text-yellow-600 border-b-2 border-yellow-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Pending ({leaveRequests.filter(r => r.status === 'Pending').length})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 text-sm font-medium ${filter === 'approved' ? 'text-green-600 border-b-2 border-green-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Approved ({leaveRequests.filter(r => r.status === 'Approved').length})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 text-sm font-medium ${filter === 'rejected' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Rejected ({leaveRequests.filter(r => r.status === 'Rejected').length})
          </button>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Leave Requests</h3>
            <p className="text-gray-500">No leave requests found for the selected filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map(request => (
              <div key={request.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{getLeaveTypeIcon(request.leaveType)}</span>
                      <h3 className="text-lg font-semibold text-gray-900">{request.leaveType}</h3>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-sm text-gray-500">👤 Employee Details</p>
                        <p className="font-medium">{request.employeeName}</p>
                        <p className="text-sm text-gray-600">{request.employeeDepartment}</p>
                        <p className="text-sm text-gray-500">{request.employeeEmail}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">📅 Leave Period</p>
                        <p className="font-medium">
                          {new Date(request.startDate).toLocaleDateString()} → {new Date(request.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">Total: {request.daysCount} day{request.daysCount !== 1 ? 's' : ''}</p>
                      </div>
                      
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-500">📝 Purpose</p>
                        <p className="text-gray-700">{request.purpose}</p>
                      </div>
                      
                      {request.reason && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-500">📌 Detailed Reason</p>
                          <p className="text-gray-700">{request.reason}</p>
                        </div>
                      )}
                      
                      {request.contactDuringLeave && (
                        <div>
                          <p className="text-sm text-gray-500">📞 Contact During Leave</p>
                          <p className="text-sm">{request.contactDuringLeave}</p>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-sm text-gray-500">📅 Applied On</p>
                        <p className="text-sm">{new Date(request.appliedOn).toLocaleString()}</p>
                      </div>
                      
                      {request.status !== 'Pending' && (
                        <div>
                          <p className="text-sm text-gray-500">
                            {request.status === 'Approved' ? '✅ Approved By' : '❌ Rejected By'}
                          </p>
                          <p className="text-sm">{request.reviewedBy}</p>
                          <p className="text-xs text-gray-400">{new Date(request.reviewedOn).toLocaleString()}</p>
                        </div>
                      )}
                      
                      {request.comments && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-500">💬 Admin Comments</p>
                          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{request.comments}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {request.status === 'Pending' && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleApprove(request)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(request)}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal for Comments */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold">
                  {selectedRequest?.status === 'Pending' ? 'Review Leave Request' : 'Add Comment'}
                </h3>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-3">
                  Leave Request from <strong>{selectedRequest?.employeeName}</strong>
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comments (Optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Add any comments or remarks..."
                ></textarea>
              </div>
              <div className="p-4 border-t flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setComment('');
                    setSelectedRequest(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => submitDecision('Approved')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Approve
                </button>
                <button
                  onClick={() => submitDecision('Rejected')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveManagement;