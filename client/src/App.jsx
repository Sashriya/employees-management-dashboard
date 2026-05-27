// client/src/App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import Dashboard from './components/Dashboard.jsx';
import Profile from './components/Profile.jsx';
import EmployeeList from './components/EmployeeList.jsx';
import EmployeeForm from './components/EmployeeForm.jsx';
import LeaveRequestForm from './components/LeaveRequestForm.jsx';
import MyLeaves from './components/MyLeaves.jsx';
import LeaveManagement from './components/LeaveManagement.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import StorageSettings from './components/StorageSettings.jsx';
import { getStorageMode, checkBackendHealth } from './services/api';

function App() {
  const [storageMode, setStorageMode] = useState(getStorageMode());
  const [backendStatus, setBackendStatus] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      const isAvailable = await checkBackendHealth();
      setBackendStatus(isAvailable);
    };
    checkStatus();
    
    const interval = setInterval(() => {
      setStorageMode(getStorageMode());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: { primary: '#10B981', secondary: '#fff' },
          },
          error: {
            duration: 4000,
            iconTheme: { primary: '#EF4444', secondary: '#fff' },
          },
        }}
      />
      
      {/* Status Bar */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <div className="bg-gray-800 text-white text-xs px-3 py-1 rounded-full shadow-lg flex items-center space-x-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span>Storage: {storageMode.toUpperCase()}</span>
        </div>
        {backendStatus !== null && (
          <div className={`text-xs px-3 py-1 rounded-full shadow-lg flex items-center space-x-2 ${
            backendStatus ? 'bg-green-600' : 'bg-red-600'
          } text-white`}>
            <span className={`w-2 h-2 rounded-full ${backendStatus ? 'bg-white' : 'bg-yellow-400'}`}></span>
            <span>Backend: {backendStatus ? 'Online' : 'Offline'}</span>
          </div>
        )}
      </div>
      
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes (Both Admin & Employee) */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        
        <Route path="/profile" element={
          <PrivateRoute>
            <Profile />
          </PrivateRoute>
        } />
        
        {/* Employee Leave Routes */}
        <Route path="/apply-leave" element={
          <PrivateRoute>
            <LeaveRequestForm />
          </PrivateRoute>
        } />
        
        <Route path="/my-leaves" element={
          <PrivateRoute>
            <MyLeaves />
          </PrivateRoute>
        } />
        
        {/* Admin Only Routes */}
        <Route path="/employees" element={
          <AdminRoute>
            <EmployeeList />
          </AdminRoute>
        } />
        
        <Route path="/employees/add" element={
          <AdminRoute>
            <EmployeeForm />
          </AdminRoute>
        } />
        
        <Route path="/employees/edit/:id" element={
          <AdminRoute>
            <EmployeeForm />
          </AdminRoute>
        } />
        
        <Route path="/leave-management" element={
          <AdminRoute>
            <LeaveManagement />
          </AdminRoute>
        } />
        
        <Route path="/settings" element={
          <AdminRoute>
            <div className="max-w-4xl mx-auto px-4 py-8">
              <StorageSettings />
            </div>
          </AdminRoute>
        } />
        
        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  );
}

export default App;