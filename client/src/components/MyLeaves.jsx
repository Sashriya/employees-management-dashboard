// client/src/components/MyLeaves.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import toast from 'react-hot-toast';

const MyLeaves = () => {
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const loadLeaveRequests = () => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const allRequests = JSON.parse(localStorage.getItem('ems_leave_requests') || '[]');
    const userRequests = allRequests.filter(req => req.employeeEmail === currentUser.email);
    setLeaveRequests(userRequests);
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
        <div className="sm:flex sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Leave Requests</h1>
            <p className="text-sm text-gray-500 mt-1">Track your leave applications</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              to="/apply-leave"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              + Apply for Leave
            </Link>
          </div>
        </div>

        {leaveRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Leave Requests</h3>
            <p className="text-gray-500 mb-4">You haven't applied for any leave yet.</p>
            <Link to="/apply-leave" className="text-green-600 hover:text-green-700 font-medium">
              Apply for leave →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {leaveRequests.map(request => (
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
                        <p className="text-sm text-gray-500">📅 Leave Period</p>
                        <p className="font-medium">
                          {new Date(request.startDate).toLocaleDateString()} → {new Date(request.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-600">Total: {request.daysCount} day{request.daysCount !== 1 ? 's' : ''}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">📝 Purpose</p>
                        <p className="text-gray-700">{request.purpose}</p>
                      </div>
                      
                      {request.reason && (
                        <div className="md:col-span-2">
                          <p className="text-sm text-gray-500">📌 Detailed Reason</p>
                          <p className="text-gray-700">{request.reason}</p>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyLeaves;