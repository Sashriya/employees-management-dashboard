// client/src/pages/Login.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/api';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    employeeId: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  // Pre-defined admin credentials
  const ADMIN_CREDENTIALS = {
    employeeId: 'ADMIN001',
    password: 'admin123',
    role: 'admin',
    username: 'Administrator',
    fullName: 'System Administrator'
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check for admin login by Employee ID
      if (formData.employeeId === ADMIN_CREDENTIALS.employeeId && 
          formData.password === ADMIN_CREDENTIALS.password) {
        
        const adminData = {
          id: 'admin_001',
          employeeId: ADMIN_CREDENTIALS.employeeId,
          username: 'Administrator',
          email: 'admin@ems.com',
          role: 'admin',
          fullName: 'System Administrator',
          department: 'IT',
          position: 'Administrator'
        };
        
        localStorage.setItem('token', 'admin_token_123');
        localStorage.setItem('user', JSON.stringify(adminData));
        localStorage.setItem('userRole', 'admin');
        
        toast.success('Welcome Admin! Full access granted.');
        navigate('/dashboard');
        setLoading(false);
        return;
      }

      // Regular user login from localStorage by Employee ID only
      const users = JSON.parse(localStorage.getItem('ems_users') || '[]');
      const employees = JSON.parse(localStorage.getItem('ems_employees') || '[]');
      
      // Find user by Employee ID
      const user = users.find(u => 
        u.employeeId === formData.employeeId && u.password === formData.password
      );
      
      if (user) {
        const userRole = user.role || 'employee';
        
        // Get employee details from employees array
        const employee = employees.find(e => e.email === user.email);
        
        const userData = {
          id: user.id,
          employeeId: user.employeeId,
          username: user.username,
          email: user.email,
          role: userRole,
          fullName: user.fullName,
          gender: user.gender,
          department: user.department,
          position: user.position,
          phoneNumber: user.phoneNumber,
          location: user.location
        };
        
        localStorage.setItem('token', `user_token_${user.id}`);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('userRole', userRole);
        
        toast.success(`Welcome ${user.fullName || user.username}!`);
        navigate('/dashboard');
      } else {
        toast.error('Invalid Employee ID or Password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-2xl">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign In</h2>
          <p className="mt-2 text-sm text-gray-600">Employee Management System</p>
          <p className="text-xs text-blue-600 mt-1">Login using your Employee ID</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Employee ID
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9h6m-6 3h6m-6 3h6M9 5v16m-5-8h10" />
                  </svg>
                </div>
                <input
                  name="employeeId"
                  type="text"
                  required
                  value={formData.employeeId}
                  onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  placeholder="EMP001"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">Enter your Employee ID (e.g., EMP001)</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••"
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>Demo Access:</strong><br />
              👤 Employee: Use your registered Employee ID (EMP001, EMP002...)
            </p>
            <p className="text-xs text-green-600 mt-2">
              💡 Tip: Your Employee ID was provided after registration
            </p>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>

          <div className="text-center">
            <Link to="/register" className="text-sm text-blue-600 hover:text-blue-500 font-medium">
              Don't have an account? Sign up
            </Link>
          </div>
          
          <div className="text-center text-xs text-gray-400">
            <p>New employees will receive their Employee ID after registration</p>
            <p className="mt-1">Contact admin if you forgot your Employee ID</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;