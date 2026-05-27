// client/src/pages/Register.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService, isLocalStorageAvailable } from '../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    gender: '',
    department: '',
    address: '',
    phoneNumber: '',
    location: '',
    role: 'employee',
    position: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [storageAvailable, setStorageAvailable] = useState(true);

  useEffect(() => {
    // Check localStorage availability on component mount
    const available = isLocalStorageAvailable();
    setStorageAvailable(available);
    if (!available) {
      toast.error('LocalStorage is not available. Please check your browser settings.');
    }
    
    // Debug: Log current localStorage data
    console.log('Current localStorage on register page load:');
    console.log('ems_users:', localStorage.getItem('ems_users'));
    console.log('ems_employees:', localStorage.getItem('ems_employees'));
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username) newErrors.username = 'Username is required';
    else if (formData.username.length < 3) newErrors.username = 'Username must be at least 3 characters';
    
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
    else if (!/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) {
      newErrors.phoneNumber = 'Please enter a valid 10-digit phone number';
    }
    if (!formData.location) newErrors.location = 'Location is required';
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check localStorage availability again
    if (!isLocalStorageAvailable()) {
      toast.error('LocalStorage is not available. Please check your browser settings.');
      return;
    }
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const { confirmPassword, ...registerData } = formData;
      
      console.log('Submitting registration for:', registerData.email);
      
      const response = await authService.register(registerData);
      
      console.log('Registration response:', response);
      
      const employeeId = response.data?.user?.employeeId || response.data?.employeeId;
      
      // Verify that data was saved
      const users = JSON.parse(localStorage.getItem('ems_users') || '[]');
      const savedUser = users.find(u => u.email === registerData.email);
      
      if (savedUser) {
        console.log('Verification: User saved successfully', savedUser);
        toast.success(`Registration successful! Your Employee ID: ${employeeId}`, {
          duration: 5000,
          icon: '🎉'
        });
        
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        throw new Error('User data not found in localStorage after registration');
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const departments = [
    'Human Resources', 'Information Technology', 'Finance', 'Marketing',
    'Sales', 'Operations', 'Customer Support', 'Research & Development',
    'Legal', 'Administration'
  ];

  const locations = [
    "Mumbai, Maharashtra", "Delhi, Delhi", "Bengaluru, Karnataka",
    "Chennai, Tamil Nadu", "Hyderabad, Telangana", "Kolkata, West Bengal",
    "Pune, Maharashtra", "Ahmedabad, Gujarat", "Jaipur, Rajasthan",
    "Surat, Gujarat", "Lucknow, Uttar Pradesh", "Kanpur, Uttar Pradesh",
    "Nagpur, Maharashtra", "Coimbatore, Tamil Nadu", "Madurai, Tamil Nadu"
  ];

  const genderOptions = [
    { value: 'Male', label: '👨 Male' },
    { value: 'Female', label: '👩 Female' },
    { value: 'Other', label: '👤 Other' }
  ];

  if (!storageAvailable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">LocalStorage Not Available</h2>
          <p className="text-gray-600 mb-4">
            LocalStorage is not available in your browser. Please check your browser settings 
            or try using a different browser.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-xl shadow-2xl">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create Account</h2>
          <p className="mt-2 text-sm text-gray-600">Sign up to get started with your profile</p>
        </div>
        
        {/* Info Box */}
        <div className="bg-green-50 p-3 rounded-lg">
          <p className="text-xs text-green-800">
            <strong>📋 Note:</strong> After registration, you will receive a unique Employee ID (e.g., EMP001). 
            Use this Employee ID to login to the system.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Username *</label>
              <input name="username" type="text" required value={formData.username} onChange={handleChange}
                className={`mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.username ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="johndoe" />
              {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input name="email" type="email" required value={formData.email} onChange={handleChange}
                className={`mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="you@example.com" />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name *</label>
              <input name="fullName" type="text" required value={formData.fullName} onChange={handleChange}
                className={`mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="John Doe" />
              {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Gender *</label>
              <select name="gender" required value={formData.gender} onChange={handleChange}
                className={`mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.gender ? 'border-red-500' : 'border-gray-300'}`}>
                <option value="">Select Gender</option>
                {genderOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
              <input name="phoneNumber" type="tel" required value={formData.phoneNumber} onChange={handleChange}
                className={`mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="9876543210" />
              {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password *</label>
              <input name="password" type="password" required value={formData.password} onChange={handleChange}
                className={`mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="••••••" />
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
              <input name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange}
                className={`mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="••••••" />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Department *</label>
              <select name="department" required value={formData.department} onChange={handleChange}
                className={`mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.department ? 'border-red-500' : 'border-gray-300'}`}>
                <option value="">Select Department</option>
                {departments.map((dept) => (<option key={dept} value={dept}>{dept}</option>))}
              </select>
              {errors.department && <p className="mt-1 text-sm text-red-600">{errors.department}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Position</label>
              <input name="position" type="text" value={formData.position} onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Software Engineer, Manager, etc." />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Location *</label>
              <select name="location" required value={formData.location} onChange={handleChange}
                className={`mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.location ? 'border-red-500' : 'border-gray-300'}`}>
                <option value="">Select Location</option>
                {locations.map((loc) => (<option key={loc} value={loc}>{loc}</option>))}
              </select>
              {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select name="role" value={formData.role} onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Address *</label>
              <textarea name="address" rows="2" required value={formData.address} onChange={handleChange}
                className={`mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter your complete address" />
              {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50">
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>

          <div className="text-center">
            <Link to="/login" className="text-sm text-blue-600 hover:text-blue-500">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;