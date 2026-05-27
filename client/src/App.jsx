import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import Dashboard from './components/Dashboard.jsx';
import EmployeeList from './components/EmployeeList.jsx';
import EmployeeForm from './components/EmployeeForm.jsx';
import PrivateRoute from './components/PrivateRoute.jsx';
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
    
    // Update storage mode when it changes
    const interval = setInterval(() => {
      setStorageMode(getStorageMode());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Status Bar */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        <div className="bg-gray-800 text-white text-xs px-3 py-1 rounded-full shadow-lg">
          Storage: {storageMode.toUpperCase()}
        </div>
        {backendStatus !== null && (
          <div className={`text-xs px-3 py-1 rounded-full shadow-lg ${
            backendStatus ? 'bg-green-600' : 'bg-red-600'
          } text-white`}>
            Backend: {backendStatus ? 'Online' : 'Offline'}
          </div>
        )}
      </div>
      
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        } />
        <Route path="/employees" element={
          <PrivateRoute>
            <EmployeeList />
          </PrivateRoute>
        } />
        <Route path="/employees/add" element={
          <PrivateRoute>
            <EmployeeForm />
          </PrivateRoute>
        } />
        <Route path="/employees/edit/:id" element={
          <PrivateRoute>
            <EmployeeForm />
          </PrivateRoute>
        } />
        <Route path="/settings" element={
          <PrivateRoute>
            <div className="max-w-4xl mx-auto px-4 py-8">
              <StorageSettings />
            </div>
          </PrivateRoute>
        } />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </div>
  );
}

export default App;