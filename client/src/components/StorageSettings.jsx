import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getStorageMode, setStorageMode, checkBackendHealth, authService } from '../services/api';

const StorageSettings = () => {
  const [currentMode, setCurrentMode] = useState(getStorageMode());
  const [backendStatus, setBackendStatus] = useState(null);
  const [checking, setChecking] = useState(false);
  const [activeTab, setActiveTab] = useState('profile'); // Changed default to profile
  
  // Profile states
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    department: '',
    position: ''
  });
  const [originalProfile, setOriginalProfile] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  
  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Backup states
  const [backupStats, setBackupStats] = useState({
    users: 0,
    employees: 0,
    storageUsed: 0,
    lastBackup: null
  });

  useEffect(() => {
    checkBackend();
    loadProfile();
    loadBackupStats();
  }, []);

  const checkBackend = async () => {
    setChecking(true);
    const isAvailable = await checkBackendHealth();
    setBackendStatus(isAvailable);
    setChecking(false);
  };

  const loadProfile = () => {
    const user = JSON.parse(localStorage.getItem('ems_current_user') || '{}');
    setProfile({
      username: user.username || '',
      email: user.email || '',
      fullName: user.fullName || '',
      phone: user.phone || '',
      department: user.department || '',
      position: user.position || ''
    });
    setOriginalProfile({ ...user });
  };

  const loadBackupStats = () => {
    const users = JSON.parse(localStorage.getItem('ems_users') || '[]');
    const employees = JSON.parse(localStorage.getItem('ems_employees') || '[]');
    
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length;
      }
    }
    
    const lastBackup = localStorage.getItem('ems_last_backup');
    
    setBackupStats({
      users: users.length,
      employees: employees.length,
      storageUsed: (totalSize / 1024).toFixed(2),
      lastBackup: lastBackup ? new Date(JSON.parse(lastBackup)) : null
    });
  };

  const handleModeChange = (mode) => {
    if (mode === 'api' && backendStatus === false) {
      toast.error('Backend server is not available. Cannot switch to API mode.');
      return;
    }
    setStorageMode(mode);
    setCurrentMode(mode);
    toast.success(`Switched to ${mode.toUpperCase()} storage mode`);
  };

  // Profile Update Functions
  const handleProfileChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const updateProfile = async () => {
    setProfileLoading(true);
    try {
      // Get current user
      const currentUser = JSON.parse(localStorage.getItem('ems_current_user') || '{}');
      const users = JSON.parse(localStorage.getItem('ems_users') || '[]');
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      
      if (userIndex !== -1) {
        // Update user in users array
        users[userIndex] = {
          ...users[userIndex],
          username: profile.username,
          email: profile.email,
          fullName: profile.fullName,
          phone: profile.phone,
          department: profile.department,
          position: profile.position,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('ems_users', JSON.stringify(users));
        
        // Update current user in localStorage
        const updatedCurrentUser = {
          id: currentUser.id,
          username: profile.username,
          email: profile.email,
          fullName: profile.fullName,
          phone: profile.phone,
          department: profile.department,
          position: profile.position
        };
        localStorage.setItem('ems_current_user', JSON.stringify(updatedCurrentUser));
        
        toast.success('Profile updated successfully!');
        setIsEditing(false);
        loadProfile(); // Reload profile
      } else {
        toast.error('User not found');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const cancelEdit = () => {
    setProfile(originalProfile);
    setIsEditing(false);
  };

  // Password Change Function
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
    // Clear error when user types
    if (passwordErrors[e.target.name]) {
      setPasswordErrors({
        ...passwordErrors,
        [e.target.name]: ''
      });
    }
  };

  const validatePassword = () => {
    const errors = {};
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    return errors;
  };

  const changePassword = async () => {
    const errors = validatePassword();
    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }
    
    setPasswordLoading(true);
    try {
      const users = JSON.parse(localStorage.getItem('ems_users') || '[]');
      const currentUser = JSON.parse(localStorage.getItem('ems_current_user') || '{}');
      const user = users.find(u => u.id === currentUser.id);
      
      // Verify current password
      if (user.password !== passwordData.currentPassword) {
        toast.error('Current password is incorrect');
        setPasswordLoading(false);
        return;
      }
      
      // Update password
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      users[userIndex].password = passwordData.newPassword;
      users[userIndex].updatedAt = new Date().toISOString();
      localStorage.setItem('ems_users', JSON.stringify(users));
      
      toast.success('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Backup Functions
  const exportData = () => {
    const data = {
      users: JSON.parse(localStorage.getItem('ems_users') || '[]'),
      employees: JSON.parse(localStorage.getItem('ems_employees') || '[]'),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ems_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    localStorage.setItem('ems_last_backup', JSON.stringify(new Date().toISOString()));
    loadBackupStats();
    toast.success('Data exported successfully!');
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.users) {
          localStorage.setItem('ems_users', JSON.stringify(data.users));
        }
        if (data.employees) {
          localStorage.setItem('ems_employees', JSON.stringify(data.employees));
        }
        toast.success('Data imported successfully! Please login again.');
        setTimeout(() => {
          localStorage.removeItem('ems_token');
          localStorage.removeItem('ems_current_user');
          window.location.href = '/login';
        }, 1500);
      } catch (error) {
        toast.error('Invalid file format');
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (window.confirm('⚠️ WARNING: This will delete ALL data including users and employees! This action cannot be undone. Are you sure?')) {
      localStorage.clear();
      toast.success('All data cleared. Redirecting to login...');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    }
  };

  const resetToDefault = () => {
    if (window.confirm('Reset to default data? This will replace all current data with sample data.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>
      
      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profile Settings
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Security
          </button>
          <button
            onClick={() => setActiveTab('storage')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'storage'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Storage Settings
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'backup'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Backup & Restore
          </button>
        </nav>
      </div>

      {/* Profile Settings Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Profile Information</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Edit Profile
              </button>
            ) : (
              <div className="space-x-2">
                <button
                  onClick={cancelEdit}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={updateProfile}
                  disabled={profileLoading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="username"
                    value={profile.username}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{profile.username || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{profile.email || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="fullName"
                    value={profile.fullName}
                    onChange={handleProfileChange}
                    placeholder="Enter your full name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{profile.fullName || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    placeholder="Enter your phone number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{profile.phone || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                {isEditing ? (
                  <select
                    name="department"
                    value={profile.department}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Department</option>
                    <option value="HR">Human Resources</option>
                    <option value="IT">Information Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="Operations">Operations</option>
                  </select>
                ) : (
                  <p className="text-gray-900">{profile.department || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="position"
                    value={profile.position}
                    onChange={handleProfileChange}
                    placeholder="Enter your position"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{profile.position || 'Not set'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Change Password</h2>
          
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  passwordErrors.currentPassword ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {passwordErrors.currentPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  passwordErrors.newPassword ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {passwordErrors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  passwordErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {passwordErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
              )}
            </div>

            <button
              onClick={changePassword}
              disabled={passwordLoading}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>

          <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
            <h3 className="font-medium text-yellow-800 mb-2">Security Tips:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Use a strong password with at least 6 characters</li>
              <li>• Never share your password with anyone</li>
              <li>• Use different passwords for different accounts</li>
              <li>• Change your password regularly</li>
            </ul>
          </div>
        </div>
      )}

      {/* Storage Settings Tab */}
      {activeTab === 'storage' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Storage Configuration</h2>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Backend Status:</span>
              {checking ? (
                <span className="text-sm text-gray-500">Checking...</span>
              ) : backendStatus ? (
                <span className="text-sm text-green-600 flex items-center">
                  <span className="w-2 h-2 bg-green-600 rounded-full mr-2"></span>
                  Online
                </span>
              ) : (
                <span className="text-sm text-red-600 flex items-center">
                  <span className="w-2 h-2 bg-red-600 rounded-full mr-2"></span>
                  Offline
                </span>
              )}
            </div>
            <button
              onClick={checkBackend}
              disabled={checking}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Check Connection
            </button>
          </div>

          <div className="space-y-3">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="storageMode"
                value="auto"
                checked={currentMode === 'auto'}
                onChange={() => handleModeChange('auto')}
                className="mr-3"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Auto Mode (Recommended)</div>
                <div className="text-sm text-gray-500">
                  Automatically uses backend when available, falls back to local storage
                </div>
              </div>
            </label>

            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="storageMode"
                value="api"
                checked={currentMode === 'api'}
                onChange={() => handleModeChange('api')}
                className="mr-3"
                disabled={backendStatus === false}
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Backend Database</div>
                <div className="text-sm text-gray-500">
                  Use MongoDB database (requires backend server)
                </div>
              </div>
            </label>

            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="storageMode"
                value="local"
                checked={currentMode === 'local'}
                onChange={() => handleModeChange('local')}
                className="mr-3"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">Local Storage (Offline)</div>
                <div className="text-sm text-gray-500">
                  Store data in browser (works offline)
                </div>
              </div>
            </label>
          </div>

          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Current Mode:</strong> {currentMode.toUpperCase()}<br />
              {currentMode === 'auto' && '🔁 Data will be saved to backend if available, otherwise local'}
              {currentMode === 'api' && '☁️ All data is stored in MongoDB database'}
              {currentMode === 'local' && '💾 All data is stored in your browser'}
            </p>
          </div>
        </div>
      )}

      {/* Backup & Restore Tab */}
      {activeTab === 'backup' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Backup & Restore</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium">Total Users</div>
              <div className="text-2xl font-bold text-blue-900">{backupStats.users}</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium">Total Employees</div>
              <div className="text-2xl font-bold text-green-900">{backupStats.employees}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-purple-600 font-medium">Storage Used</div>
              <div className="text-2xl font-bold text-purple-900">{backupStats.storageUsed} KB</div>
            </div>
          </div>

          {backupStats.lastBackup && (
            <div className="mb-6 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Last Backup: {backupStats.lastBackup.toLocaleString()}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={exportData}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                📥 Export Data
              </button>
              
              <label className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer">
                📤 Import Data
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
              
              <button
                onClick={resetToDefault}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
              >
                🔄 Reset to Default
              </button>
              
              <button
                onClick={clearAllData}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                🗑️ Clear All Data
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Instructions:</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>Export Data:</strong> Creates a backup file of all your data</li>
              <li>• <strong>Import Data:</strong> Restore data from a previous backup</li>
              <li>• <strong>Reset to Default:</strong> Restores sample data</li>
              <li>• <strong>Clear All Data:</strong> Deletes everything (use with caution)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default StorageSettings;