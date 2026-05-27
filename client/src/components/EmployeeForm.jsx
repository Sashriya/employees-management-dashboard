// client/src/components/EmployeeForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { employeeService } from '../services/api';
import Navbar from './Navbar.jsx';

const EmployeeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;
  
  const [formData, setFormData] = useState({
    name: '',
    fullName: '',
    email: '',
    gender: '',
    department: '',
    position: '',
    phoneNumber: '',
    location: '',
    address: '',
    status: 'Active',
    joinDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [generatedEmpId, setGeneratedEmpId] = useState('');

  const departments = [
    'Human Resources', 'Information Technology', 'Finance', 'Marketing',
    'Sales', 'Operations', 'Customer Support', 'Research & Development',
    'Legal', 'Administration'
  ];

  const locations = [
    "Mumbai, Maharashtra", "Delhi, Delhi", "Bengaluru, Karnataka",
    "Chennai, Tamil Nadu", "Hyderabad, Telangana", "Kolkata, West Bengal",
    "Pune, Maharashtra", "Ahmedabad, Gujarat", "Jaipur, Rajasthan",
    "Surat, Gujarat", "Lucknow, Uttar Pradesh", "Kanpur, Uttar Pradesh"
  ];

  const genderOptions = [
    { value: 'Male', label: '👨 Male' },
    { value: 'Female', label: '👩 Female' },
    { value: 'Other', label: '👤 Other' }
  ];

  const statusOptions = [
    { value: 'Active', label: '🟢 Active' },
    { value: 'Inactive', label: '🔴 Inactive' },
    { value: 'On Leave', label: '🟡 On Leave' }
  ];

  useEffect(() => {
    if (isEditMode) {
      fetchEmployee();
    } else {
      generateEmployeeIdPreview();
    }
  }, [id]);

  const generateEmployeeIdPreview = () => {
    const existingEmployees = JSON.parse(localStorage.getItem('ems_employees') || '[]');
    const existingUsers = JSON.parse(localStorage.getItem('ems_users') || '[]');
    
    const allIds = [
      ...existingEmployees.map(e => e.employeeId),
      ...existingUsers.map(u => u.employeeId)
    ].filter(id => id && id.startsWith('EMP'));
    
    let maxNum = 0;
    allIds.forEach(id => {
      const num = parseInt(id.replace('EMP', ''));
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    });
    
    const nextNum = maxNum + 1;
    setGeneratedEmpId(`EMP${nextNum.toString().padStart(3, '0')}`);
  };

  const fetchEmployee = async () => {
    try {
      // Get from localStorage directly
      const employees = JSON.parse(localStorage.getItem('ems_employees') || '[]');
      const employee = employees.find(emp => emp.id === id);
      
      if (employee) {
        setFormData({
          name: employee.name || employee.fullName || '',
          fullName: employee.fullName || employee.name || '',
          email: employee.email || '',
          gender: employee.gender || '',
          department: employee.department || '',
          position: employee.position || '',
          phoneNumber: employee.phoneNumber || '',
          location: employee.location || '',
          address: employee.address || '',
          status: employee.status || 'Active',
          joinDate: employee.joinDate || new Date().toISOString().split('T')[0]
        });
        setGeneratedEmpId(employee.employeeId || '');
      } else {
        toast.error('Employee not found');
        navigate('/employees');
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
      toast.error('Failed to fetch employee details');
      navigate('/employees');
    } finally {
      setFetching(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.fullName && !formData.name) {
      toast.error('Name is required');
      return false;
    }
    if (!formData.email) {
      toast.error('Email is required');
      return false;
    }
    if (!formData.gender) {
      toast.error('Gender is required');
      return false;
    }
    if (!formData.department) {
      toast.error('Department is required');
      return false;
    }
    if (!formData.phoneNumber) {
      toast.error('Phone number is required');
      return false;
    }
    if (!formData.location) {
      toast.error('Location is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const employeeData = {
        name: formData.fullName || formData.name,
        fullName: formData.fullName || formData.name,
        email: formData.email,
        gender: formData.gender,
        department: formData.department,
        position: formData.position,
        phoneNumber: formData.phoneNumber,
        location: formData.location,
        address: formData.address,
        status: formData.status,
        joinDate: formData.joinDate
      };

      if (isEditMode) {
        // Update in localStorage directly
        const employees = JSON.parse(localStorage.getItem('ems_employees') || '[]');
        const index = employees.findIndex(emp => emp.id === id);
        
        if (index !== -1) {
          employees[index] = { ...employees[index], ...employeeData, updatedAt: new Date().toISOString() };
          localStorage.setItem('ems_employees', JSON.stringify(employees));
          
          // Also update users array
          const users = JSON.parse(localStorage.getItem('ems_users') || '[]');
          const userIndex = users.findIndex(u => u.email === formData.email);
          if (userIndex !== -1) {
            users[userIndex] = {
              ...users[userIndex],
              fullName: employeeData.fullName,
              gender: employeeData.gender,
              department: employeeData.department,
              phoneNumber: employeeData.phoneNumber,
              location: employeeData.location,
              address: employeeData.address,
              position: employeeData.position,
              updatedAt: new Date().toISOString()
            };
            localStorage.setItem('ems_users', JSON.stringify(users));
          }
          
          // Update current user if it's the logged in user
          const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
          if (currentUser.email === formData.email) {
            const updatedUser = {
              ...currentUser,
              fullName: employeeData.fullName,
              gender: employeeData.gender,
              department: employeeData.department,
              phoneNumber: employeeData.phoneNumber,
              location: employeeData.location
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
          
          toast.success('Employee updated successfully!');
          navigate('/employees');
        } else {
          toast.error('Employee not found');
        }
      } else {
        // Create new employee
        const employees = JSON.parse(localStorage.getItem('ems_employees') || '[]');
        const newId = Date.now().toString();
        const newEmployeeId = `EMP${(employees.length + 1).toString().padStart(3, '0')}`;
        
        const newEmployee = {
          id: newId,
          employeeId: newEmployeeId,
          ...employeeData,
          createdAt: new Date().toISOString()
        };
        employees.push(newEmployee);
        localStorage.setItem('ems_employees', JSON.stringify(employees));
        
        // Also create user account
        const users = JSON.parse(localStorage.getItem('ems_users') || '[]');
        const newUser = {
          id: newId,
          employeeId: newEmployeeId,
          username: formData.email.split('@')[0],
          email: formData.email,
          password: 'password123',
          fullName: employeeData.fullName,
          gender: employeeData.gender,
          role: 'employee',
          department: employeeData.department,
          position: employeeData.position,
          phoneNumber: employeeData.phoneNumber,
          location: employeeData.location,
          address: employeeData.address,
          status: 'active',
          createdAt: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem('ems_users', JSON.stringify(users));
        
        toast.success(`Employee added successfully! Employee ID: ${newEmployeeId}`);
        navigate('/employees');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error(isEditMode ? 'Failed to update employee' : 'Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">
              {isEditMode ? 'Edit Employee' : 'Add New Employee'}
            </h1>
            <p className="text-blue-100 text-sm mt-1">
              {isEditMode ? 'Update employee information' : 'Enter employee details to add to system'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {!isEditMode && (
              <div className="bg-blue-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-blue-800">
                  <strong>📋 New Employee ID:</strong> {generatedEmpId}
                </p>
                <p className="text-xs text-blue-600 mt-1">Employee ID will be auto-generated</p>
              </div>
            )}
            
            {isEditMode && generatedEmpId && (
              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-sm text-gray-700">
                  <strong>🆔 Employee ID:</strong> <span className="font-mono font-bold">{generatedEmpId}</span>
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName || formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isEditMode}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isEditMode ? 'bg-gray-100 cursor-not-allowed' : 'border-gray-300'
                  }`}
                  placeholder="employee@example.com"
                />
                {isEditMode && (
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Gender</option>
                  {genderOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Software Engineer, Manager"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="9876543210"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Location</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Join Date
                </label>
                <input
                  type="date"
                  name="joinDate"
                  value={formData.joinDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  name="address"
                  rows="3"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter complete address"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={() => navigate('/employees')}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : (isEditMode ? 'Update Employee' : 'Add Employee')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EmployeeForm;