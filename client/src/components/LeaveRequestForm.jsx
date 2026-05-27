// client/src/components/LeaveRequestForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from './Navbar.jsx';

const LeaveRequestForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    purpose: '',
    reason: '',
    contactDuringLeave: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const leaveTypes = [
    { value: 'Sick Leave', label: '🤒 Sick Leave', description: 'For illness or medical appointments' },
    { value: 'Casual Leave', label: '🏖️ Casual Leave', description: 'For personal work or relaxation' },
    { value: 'Annual Leave', label: '🌴 Annual Leave', description: 'Planned vacation or time off' },
    { value: 'Emergency Leave', label: '🚨 Emergency Leave', description: 'For unexpected emergencies' },
    { value: 'Maternity/Paternity Leave', label: '👶 Maternity/Paternity Leave', description: 'For new parents' },
    { value: 'Bereavement Leave', label: '💔 Bereavement Leave', description: 'For family loss' },
    { value: 'Study Leave', label: '📚 Study Leave', description: 'For educational purposes' },
    { value: 'Other', label: '📝 Other', description: 'Other valid reasons' }
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.leaveType) newErrors.leaveType = 'Please select leave type';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (!formData.purpose) newErrors.purpose = 'Purpose is required';
    if (formData.purpose && formData.purpose.length < 10) {
      newErrors.purpose = 'Please provide a detailed purpose (minimum 10 characters)';
    }
    return newErrors;
  };

  const calculateDays = () => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  const createNotification = async (message, type, leaveRequestId, targetUser, targetDepartment) => {
    const notification = {
      id: Date.now().toString(),
      message,
      type,
      leaveRequestId: leaveRequestId,
      targetUser: targetUser,
      targetDepartment: targetDepartment,
      read: false,
      createdAt: new Date().toISOString()
    };
    
    const existing = JSON.parse(localStorage.getItem('ems_notifications') || '[]');
    existing.unshift(notification);
    localStorage.setItem('ems_notifications', JSON.stringify(existing));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const employeeData = JSON.parse(localStorage.getItem('ems_employees') || '[]').find(
        emp => emp.email === currentUser.email
      );

      const leaveRequest = {
        id: Date.now().toString(),
        employeeId: currentUser.id,
        employeeName: currentUser.fullName || employeeData?.fullName || employeeData?.name,
        employeeEmail: currentUser.email,
        employeeDepartment: employeeData?.department || currentUser.department,
        leaveType: formData.leaveType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        daysCount: calculateDays(),
        purpose: formData.purpose,
        reason: formData.reason,
        contactDuringLeave: formData.contactDuringLeave,
        status: 'Pending',
        appliedOn: new Date().toISOString(),
        reviewedBy: null,
        reviewedOn: null,
        comments: null
      };

      // Save to localStorage
      const existingRequests = JSON.parse(localStorage.getItem('ems_leave_requests') || '[]');
      existingRequests.push(leaveRequest);
      localStorage.setItem('ems_leave_requests', JSON.stringify(existingRequests));

      // Create notification for Admin only
      const adminNotification = {
        id: Date.now().toString(),
        message: `📋 New Leave Request from ${leaveRequest.employeeName} (${leaveRequest.leaveType}) - ${leaveRequest.daysCount} days`,
        type: 'leave_request',
        leaveRequestId: leaveRequest.id,
        targetRole: 'admin',
        read: false,
        createdAt: new Date().toISOString()
      };
      
      const notifications = JSON.parse(localStorage.getItem('ems_notifications') || '[]');
      notifications.unshift(adminNotification);
      
      // Create notification for Employee (confirmation)
      const employeeNotification = {
        id: (Date.now() + 1).toString(),
        message: `📋 Your leave request (${leaveRequest.leaveType}) has been submitted successfully. Waiting for admin approval.`,
        type: 'leave_response',
        leaveRequestId: leaveRequest.id,
        targetUser: currentUser.email,
        read: false,
        createdAt: new Date().toISOString()
      };
      notifications.unshift(employeeNotification);
      
      localStorage.setItem('ems_notifications', JSON.stringify(notifications));

      toast.success('Leave request submitted successfully!');
      navigate('/my-leaves');
    } catch (error) {
      console.error('Error submitting leave request:', error);
      toast.error('Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const daysCount = calculateDays();

  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">Apply for Leave</h1>
            <p className="text-green-100 text-sm mt-1">Submit your leave request for approval</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Leave Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leave Type <span className="text-red-500">*</span>
              </label>
              <select
                name="leaveType"
                value={formData.leaveType}
                onChange={handleChange}
                required
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.leaveType ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Select Leave Type</option>
                {leaveTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              {formData.leaveType && (
                <p className="text-xs text-gray-500 mt-1">
                  {leaveTypes.find(t => t.value === formData.leaveType)?.description}
                </p>
              )}
              {errors.leaveType && <p className="mt-1 text-sm text-red-600">{errors.leaveType}</p>}
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.startDate ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.endDate ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
              </div>
            </div>

            {/* Days Count Display */}
            {daysCount > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>📅 Total Leave Days:</strong> {daysCount} day{daysCount !== 1 ? 's' : ''}
                </p>
              </div>
            )}

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purpose of Leave <span className="text-red-500">*</span>
              </label>
              <textarea
                name="purpose"
                rows="3"
                value={formData.purpose}
                onChange={handleChange}
                required
                placeholder="Please explain the main reason for taking leave..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${errors.purpose ? 'border-red-500' : 'border-gray-300'}`}
              ></textarea>
              {errors.purpose && <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>}
              <p className="text-xs text-gray-500 mt-1">Minimum 10 characters</p>
            </div>

            {/* Detailed Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Reason (Optional)
              </label>
              <textarea
                name="reason"
                rows="2"
                value={formData.reason}
                onChange={handleChange}
                placeholder="Provide any additional details about your leave..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              ></textarea>
            </div>

            {/* Contact During Leave */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number (During Leave)
              </label>
              <input
                type="tel"
                name="contactDuringLeave"
                value={formData.contactDuringLeave}
                onChange={handleChange}
                placeholder="Enter alternate contact number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500 mt-1">In case of emergency, we can reach you</p>
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Leave Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestForm;