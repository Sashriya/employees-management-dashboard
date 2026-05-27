// client/src/components/AdminRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token) {
    toast.error('Please login to access this page');
    return <Navigate to="/login" />;
  }
  
  if (userRole !== 'admin' && user.role !== 'admin') {
    toast.error('Access denied. Admin privileges required.');
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};

export default AdminRoute;