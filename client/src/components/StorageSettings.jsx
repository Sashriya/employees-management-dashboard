// client/src/components/StorageSettings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getStorageMode, setStorageMode, checkBackendHealth } from '../services/api';

const StorageSettings = () => {
  const navigate = useNavigate();
  const [currentMode, setCurrentMode] = useState(getStorageMode());
  const [backendStatus, setBackendStatus] = useState(null);
  const [checking, setChecking] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const [profile, setProfile] = useState({
    employeeId: '', username: '', email: '', fullName: '',
    gender: '', phoneNumber: '', department: '', position: '',
    address: '', location: '', role: 'employee', status: 'active',
    profilePicture: null, skills: [], experience: [], education: []
  });
  const [originalProfile, setOriginalProfile] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: '', newPassword: '', confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [backupStats, setBackupStats] = useState({
    users: 0, employees: 0, storageUsed: 0, lastBackup: null
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
    const userProfile = localStorage.getItem('userProfile');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const source = userProfile ? JSON.parse(userProfile) : currentUser;
    const merged = {
      employeeId: source.employeeId || currentUser.employeeId || '',
      username: source.username || currentUser.username || '',
      email: source.email || currentUser.email || '',
      fullName: source.fullName || currentUser.fullName || '',
      gender: source.gender || currentUser.gender || '',
      phoneNumber: source.phoneNumber || currentUser.phoneNumber || '',
      department: source.department || currentUser.department || '',
      position: source.position || currentUser.position || '',
      address: source.address || currentUser.address || '',
      location: source.location || currentUser.location || '',
      role: source.role || 'employee',
      status: source.status || 'active',
      profilePicture: source.profilePicture || null,
      skills: source.skills || [],
      experience: source.experience || [],
      education: source.education || [],
    };
    setProfile(merged);
    setOriginalProfile({ ...merged });
  };

  const loadBackupStats = () => {
    const users = JSON.parse(localStorage.getItem('ems_users') || '[]');
    const employees = JSON.parse(localStorage.getItem('ems_employees') || '[]');
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) totalSize += localStorage[key].length;
    }
    const lastBackup = localStorage.getItem('ems_last_backup');
    setBackupStats({
      users: users.length, employees: employees.length,
      storageUsed: (totalSize / 1024).toFixed(2),
      lastBackup: lastBackup ? new Date(JSON.parse(lastBackup)) : null
    });
  };

  const handleModeChange = (mode) => {
    if (mode === 'api' && backendStatus === false) {
      toast.error('Backend server is not available.');
      return;
    }
    setStorageMode(mode);
    setCurrentMode(mode);
    toast.success(`Switched to ${mode.toUpperCase()} mode`);
  };

  const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleArrayChange = (field, value) => {
    setProfile({ ...profile, [field]: value.split(',').map(i => i.trim()).filter(Boolean) });
  };

  const handleExperienceChange = (i, field, value) => {
    const exp = [...profile.experience];
    exp[i][field] = value;
    setProfile({ ...profile, experience: exp });
  };

  const addExperience = () =>
    setProfile({ ...profile, experience: [...profile.experience, { title: '', company: '', year: '', description: '' }] });

  const removeExperience = (i) =>
    setProfile({ ...profile, experience: profile.experience.filter((_, idx) => idx !== i) });

  const handleEducationChange = (i, field, value) => {
    const edu = [...profile.education];
    edu[i][field] = value;
    setProfile({ ...profile, education: edu });
  };

  const addEducation = () =>
    setProfile({ ...profile, education: [...profile.education, { degree: '', institution: '', year: '', grade: '' }] });

  const removeEducation = (i) =>
    setProfile({ ...profile, education: profile.education.filter((_, idx) => idx !== i) });

  const handleProfilePicture = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfile({ ...profile, profilePicture: reader.result });
    reader.readAsDataURL(file);
  };

  const updateProfile = async () => {
    setProfileLoading(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const users = JSON.parse(localStorage.getItem('ems_users') || '[]');
      const userIndex = users.findIndex(u => u.id === currentUser.id);
      const updatedProfileData = { ...profile, updatedAt: new Date().toISOString() };

      if (userIndex !== -1) {
        users[userIndex] = {
          ...users[userIndex],
          username: profile.username, email: profile.email,
          fullName: profile.fullName, gender: profile.gender,
          phoneNumber: profile.phoneNumber, department: profile.department,
          position: profile.position, address: profile.address,
          location: profile.location, updatedAt: new Date().toISOString()
        };
        localStorage.setItem('ems_users', JSON.stringify(users));
        localStorage.setItem('user', JSON.stringify({
          id: currentUser.id, employeeId: profile.employeeId || currentUser.employeeId,
          username: profile.username, email: profile.email, fullName: profile.fullName,
          gender: profile.gender, phoneNumber: profile.phoneNumber,
          department: profile.department, position: profile.position,
          address: profile.address, location: profile.location,
          role: profile.role, status: profile.status
        }));

        const employees = JSON.parse(localStorage.getItem('ems_employees') || '[]');
        const empIndex = employees.findIndex(e => e.email === profile.email);
        if (empIndex !== -1) {
          employees[empIndex] = {
            ...employees[empIndex],
            fullName: profile.fullName, gender: profile.gender,
            department: profile.department, position: profile.position,
            phoneNumber: profile.phoneNumber, location: profile.location,
            address: profile.address, updatedAt: new Date().toISOString()
          };
          localStorage.setItem('ems_employees', JSON.stringify(employees));
        }
      }

      localStorage.setItem('userProfile', JSON.stringify(updatedProfileData));
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      loadProfile();
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const cancelEdit = () => { setProfile(originalProfile); setIsEditing(false); };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    if (passwordErrors[e.target.name]) setPasswordErrors({ ...passwordErrors, [e.target.name]: '' });
  };

  const validatePassword = () => {
    const errors = {};
    if (!passwordData.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwordData.newPassword) errors.newPassword = 'New password is required';
    else if (passwordData.newPassword.length < 6) errors.newPassword = 'Minimum 6 characters required';
    if (passwordData.newPassword !== passwordData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    return errors;
  };

  const changePassword = async () => {
    const errors = validatePassword();
    if (Object.keys(errors).length > 0) { setPasswordErrors(errors); return; }
    setPasswordLoading(true);
    try {
      const users = JSON.parse(localStorage.getItem('ems_users') || '[]');
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const user = users.find(u => u.id === currentUser.id);
      if (user && user.password !== passwordData.currentPassword) {
        toast.error('Current password is incorrect');
        setPasswordLoading(false);
        return;
      }
      const idx = users.findIndex(u => u.id === currentUser.id);
      if (idx !== -1) {
        users[idx].password = passwordData.newPassword;
        users[idx].updatedAt = new Date().toISOString();
        localStorage.setItem('ems_users', JSON.stringify(users));
      }
      toast.success('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch {
      toast.error('Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const exportData = () => {
    const data = {
      users: JSON.parse(localStorage.getItem('ems_users') || '[]'),
      employees: JSON.parse(localStorage.getItem('ems_employees') || '[]'),
      userProfile: JSON.parse(localStorage.getItem('userProfile') || '{}'),
      assignments: JSON.parse(localStorage.getItem('ems_assignments') || '[]'),
      notifications: JSON.parse(localStorage.getItem('ems_notifications') || '[]'),
      exportDate: new Date().toISOString(), version: '1.0.0'
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ems_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    localStorage.setItem('ems_last_backup', JSON.stringify(new Date().toISOString()));
    loadBackupStats();
    toast.success('Data exported successfully!');
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.users) localStorage.setItem('ems_users', JSON.stringify(data.users));
        if (data.employees) localStorage.setItem('ems_employees', JSON.stringify(data.employees));
        if (data.userProfile) localStorage.setItem('userProfile', JSON.stringify(data.userProfile));
        if (data.assignments) localStorage.setItem('ems_assignments', JSON.stringify(data.assignments));
        if (data.notifications) localStorage.setItem('ems_notifications', JSON.stringify(data.notifications));
        toast.success('Imported! Please login again.');
        setTimeout(() => {
          ['token', 'user', 'userRole'].forEach(k => localStorage.removeItem(k));
          window.location.href = '/login';
        }, 1500);
      } catch { toast.error('Invalid file format'); }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (window.confirm('⚠️ This will delete ALL data! This cannot be undone. Continue?')) {
      localStorage.clear();
      toast.success('All data cleared. Redirecting...');
      setTimeout(() => { window.location.href = '/login'; }, 2000);
    }
  };

  const resetToDefault = () => {
    if (window.confirm('Reset to sample data? All current data will be replaced.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const departments = [
    'Human Resources', 'Information Technology', 'Finance', 'Marketing',
    'Sales', 'Operations', 'Customer Support', 'Research & Development', 'Legal', 'Administration'
  ];

  const locations = [
    // 🇮🇳 India
    'Mumbai, Maharashtra', 'Delhi, Delhi', 'Bengaluru, Karnataka',
    'Chennai, Tamil Nadu', 'Hyderabad, Telangana', 'Kolkata, West Bengal',
    'Pune, Maharashtra', 'Ahmedabad, Gujarat', 'Jaipur, Rajasthan',
    'Tirunelveli, Tamil Nadu', 'Coimbatore, Tamil Nadu', 'Madurai, Tamil Nadu',
    'Kochi, Kerala', 'Thiruvananthapuram, Kerala', 'Trichy, Tamil Nadu',
    // 🇺🇸 USA
    'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX',
    'San Francisco, CA', 'Seattle, WA', 'Austin, TX', 'Boston, MA',
    // 🇬🇧 UK
    'London, England', 'Manchester, England', 'Birmingham, England',
    // 🇦🇪 UAE
    'Dubai, Dubai', 'Abu Dhabi, Abu Dhabi',
    // 🇸🇬 Singapore
    'Singapore, Singapore',
    // 🇦🇺 Australia
    'Sydney, New South Wales', 'Melbourne, Victoria',
    // 🇩🇪 Germany
    'Berlin, Berlin', 'Munich, Bavaria', 'Frankfurt, Hesse',
    // 🇨🇦 Canada
    'Toronto, Ontario', 'Vancouver, British Columbia',
  ];

  const genderOptions = [
    { value: 'Male', label: '👨 Male' },
    { value: 'Female', label: '👩 Female' },
    { value: 'Other', label: '👤 Other' },
    { value: 'Prefer not to say', label: '🔒 Prefer not to say' },
  ];

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white';
  const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5';

  const tabs = [
    { id: 'profile', label: '👤 Profile' },
    { id: 'security', label: '🔐 Security' },
    { id: 'storage', label: '💾 Storage' },
    { id: 'backup', label: '📦 Backup' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Page Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors font-medium"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dashboard
            </button>
            <span className="text-gray-300">/</span>
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          </div>

          {/* Profile tab action buttons */}
          {activeTab === 'profile' && (
            <div className="flex gap-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  ✏️ Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={cancelEdit}
                    className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateProfile}
                    disabled={profileLoading}
                    className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50"
                  >
                    {profileLoading ? 'Saving…' : '✓ Save Changes'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="bg-white border border-gray-200 rounded-xl mb-6 p-1 flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════
            PROFILE TAB
        ══════════════════════════════════════════ */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">

            {/* Avatar row */}
            <div className="flex flex-col items-center py-8 bg-gradient-to-b from-blue-50 to-white border-b border-gray-100">
              <div className="relative mb-3">
                {profile.profilePicture ? (
                  <img src={profile.profilePicture} alt="Profile"
                    className="w-20 h-20 rounded-full object-cover ring-4 ring-blue-100" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center ring-4 ring-blue-100">
                    <span className="text-white text-2xl font-bold">
                      {(profile.fullName || profile.username || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                {isEditing && (
                  <label className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700 shadow-md">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input type="file" accept="image/*" onChange={handleProfilePicture} className="hidden" />
                  </label>
                )}
              </div>
              <p className="font-semibold text-gray-900">{profile.fullName || 'Your Name'}</p>
              <p className="text-sm text-gray-500">{profile.position || profile.role}</p>
              <div className="flex gap-2 mt-2">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  profile.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {profile.role === 'admin' ? 'Administrator' : 'Employee'}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  profile.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {profile.status}
                </span>
              </div>
            </div>

            <div className="p-6 space-y-8">

              {/* ── Basic Info ── */}
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Employee ID — always disabled */}
                  <div>
                    <label className={labelCls}>Employee ID</label>
                    {isEditing ? (
                      <input value={profile.employeeId || '—'} disabled
                        className={`${inputCls} bg-gray-50 cursor-not-allowed text-gray-400`} />
                    ) : (
                      <p className="text-sm font-mono font-semibold text-blue-600 py-1">{profile.employeeId || 'Not assigned'}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelCls}>Username</label>
                    {isEditing
                      ? <input type="text" name="username" value={profile.username} onChange={handleProfileChange} className={inputCls} />
                      : <p className="text-sm text-gray-800 py-1">{profile.username || '—'}</p>}
                  </div>

                  <div>
                    <label className={labelCls}>Full Name</label>
                    {isEditing
                      ? <input type="text" name="fullName" value={profile.fullName} onChange={handleProfileChange} className={inputCls} />
                      : <p className="text-sm text-gray-800 py-1">{profile.fullName || '—'}</p>}
                  </div>

                  <div>
                    <label className={labelCls}>Email</label>
                    {isEditing
                      ? <input type="email" name="email" value={profile.email} onChange={handleProfileChange} className={inputCls} />
                      : <p className="text-sm text-gray-800 py-1">{profile.email || '—'}</p>}
                  </div>

                  <div>
                    <label className={labelCls}>Gender</label>
                    {isEditing ? (
                      <select name="gender" value={profile.gender} onChange={handleProfileChange} className={inputCls}>
                        <option value="">Select Gender</option>
                        {genderOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-800 py-1">{profile.gender || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelCls}>Phone Number</label>
                    {isEditing
                      ? <input type="tel" name="phoneNumber" value={profile.phoneNumber} onChange={handleProfileChange} className={inputCls} placeholder="9876543210" />
                      : <p className="text-sm text-gray-800 py-1">{profile.phoneNumber || '—'}</p>}
                  </div>
                </div>
              </section>

              {/* ── Work Info ── */}
              <section>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Work Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Department</label>
                    {isEditing ? (
                      <select name="department" value={profile.department} onChange={handleProfileChange} className={inputCls}>
                        <option value="">Select Department</option>
                        {departments.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-800 py-1">{profile.department || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelCls}>Position</label>
                    {isEditing
                      ? <input type="text" name="position" value={profile.position} onChange={handleProfileChange} className={inputCls} placeholder="Software Engineer, Manager, etc." />
                      : <p className="text-sm text-gray-800 py-1">{profile.position || '—'}</p>}
                  </div>

                  <div>
                    <label className={labelCls}>Location</label>
                    {isEditing ? (
                      <select name="location" value={profile.location} onChange={handleProfileChange} className={inputCls}>
                        <option value="">Select Location</option>
                        {locations.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    ) : (
                      <p className="text-sm text-gray-800 py-1">{profile.location || '—'}</p>
                    )}
                  </div>

                  <div>
                    <label className={labelCls}>Skills <span className="normal-case text-gray-400 font-normal">(comma separated)</span></label>
                    {isEditing ? (
                      <input type="text" value={profile.skills.join(', ')}
                        onChange={e => handleArrayChange('skills', e.target.value)}
                        placeholder="React, JavaScript, Python"
                        className={inputCls} />
                    ) : (
                      <div className="flex flex-wrap gap-1.5 py-1">
                        {profile.skills.length > 0
                          ? profile.skills.map((s, i) => (
                              <span key={i} className="bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded text-xs font-medium">{s}</span>
                            ))
                          : <span className="text-sm text-gray-400">No skills added</span>}
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelCls}>Address</label>
                    {isEditing
                      ? <textarea name="address" rows={2} value={profile.address} onChange={handleProfileChange} className={inputCls} placeholder="Enter your complete address" />
                      : <p className="text-sm text-gray-800 py-1">{profile.address || '—'}</p>}
                  </div>
                </div>
              </section>

              {/* ── Work Experience ── */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Work Experience</h3>
                  {isEditing && (
                    <button onClick={addExperience}
                      className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition font-medium">
                      + Add Experience
                    </button>
                  )}
                </div>
                {profile.experience.length > 0 ? (
                  <div className="space-y-3">
                    {profile.experience.map((exp, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        {isEditing ? (
                          <>
                            <div className="flex justify-end mb-2">
                              <button onClick={() => removeExperience(i)} className="text-xs text-red-500 hover:text-red-700 font-medium">✕ Remove</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input type="text" placeholder="Job Title" value={exp.title} onChange={e => handleExperienceChange(i, 'title', e.target.value)} className={inputCls} />
                              <input type="text" placeholder="Company" value={exp.company} onChange={e => handleExperienceChange(i, 'company', e.target.value)} className={inputCls} />
                              <input type="text" placeholder="Year (e.g. 2020–2023)" value={exp.year} onChange={e => handleExperienceChange(i, 'year', e.target.value)} className={inputCls} />
                              <textarea placeholder="Description" rows={2} value={exp.description} onChange={e => handleExperienceChange(i, 'description', e.target.value)} className={`${inputCls} md:col-span-2`} />
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold text-gray-900 text-sm">{exp.title}</p>
                            <p className="text-gray-600 text-sm">{exp.company}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{exp.year}</p>
                            {exp.description && <p className="text-gray-700 text-sm mt-2">{exp.description}</p>}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No work experience added yet.</p>
                )}
              </section>

              {/* ── Education ── */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Education</h3>
                  {isEditing && (
                    <button onClick={addEducation}
                      className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition font-medium">
                      + Add Education
                    </button>
                  )}
                </div>
                {profile.education.length > 0 ? (
                  <div className="space-y-3">
                    {profile.education.map((edu, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                        {isEditing ? (
                          <>
                            <div className="flex justify-end mb-2">
                              <button onClick={() => removeEducation(i)} className="text-xs text-red-500 hover:text-red-700 font-medium">✕ Remove</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input type="text" placeholder="Degree / Course" value={edu.degree} onChange={e => handleEducationChange(i, 'degree', e.target.value)} className={inputCls} />
                              <input type="text" placeholder="Institution" value={edu.institution} onChange={e => handleEducationChange(i, 'institution', e.target.value)} className={inputCls} />
                              <input type="text" placeholder="Year (e.g. 2018–2022)" value={edu.year} onChange={e => handleEducationChange(i, 'year', e.target.value)} className={inputCls} />
                              <input type="text" placeholder="Grade / CGPA" value={edu.grade} onChange={e => handleEducationChange(i, 'grade', e.target.value)} className={inputCls} />
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="font-semibold text-gray-900 text-sm">{edu.degree}</p>
                            <p className="text-gray-600 text-sm">{edu.institution}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Year: {edu.year} {edu.grade && `| Grade: ${edu.grade}`}</p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">No education details added yet.</p>
                )}
              </section>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            SECURITY TAB
        ══════════════════════════════════════════ */}
        {activeTab === 'security' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Change Password</h2>
            <p className="text-sm text-gray-500 mb-6">Keep your account secure with a strong password.</p>

            <div className="space-y-4 max-w-md">
              {[
                { name: 'currentPassword', label: 'Current Password' },
                { name: 'newPassword', label: 'New Password' },
                { name: 'confirmPassword', label: 'Confirm New Password' },
              ].map(field => (
                <div key={field.name}>
                  <label className={labelCls}>{field.label}</label>
                  <input
                    type="password"
                    name={field.name}
                    value={passwordData[field.name]}
                    onChange={handlePasswordChange}
                    className={`${inputCls} ${passwordErrors[field.name] ? 'border-red-400 focus:ring-red-400' : ''}`}
                  />
                  {passwordErrors[field.name] && (
                    <p className="mt-1 text-xs text-red-600">{passwordErrors[field.name]}</p>
                  )}
                  {field.name === 'newPassword' && (
                    <p className="mt-1 text-xs text-gray-400">Minimum 6 characters</p>
                  )}
                </div>
              ))}

              <button onClick={changePassword} disabled={passwordLoading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition font-medium text-sm disabled:opacity-50">
                {passwordLoading ? 'Changing…' : 'Change Password'}
              </button>
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-lg max-w-md">
              <p className="text-sm font-semibold text-amber-800 mb-2">🔒 Security Tips</p>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• Use at least 6 characters with letters and numbers</li>
                <li>• Never share your password with anyone</li>
                <li>• Change your password regularly</li>
              </ul>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            STORAGE TAB
        ══════════════════════════════════════════ */}
        {activeTab === 'storage' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Storage Configuration</h2>
            <p className="text-sm text-gray-500 mb-6">Choose where your data should be stored.</p>

            {/* Backend status */}
            <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <span className="text-sm font-medium text-gray-600">Backend Status</span>
              <div className="flex items-center gap-3">
                {checking ? (
                  <span className="text-xs text-gray-400">Checking…</span>
                ) : backendStatus ? (
                  <span className="text-xs text-green-600 flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Online
                  </span>
                ) : (
                  <span className="text-xs text-red-500 flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 bg-red-500 rounded-full" /> Offline
                  </span>
                )}
                <button onClick={checkBackend} disabled={checking}
                  className="text-xs text-blue-600 hover:underline disabled:opacity-50">
                  Refresh
                </button>
              </div>
            </div>

            <div className="space-y-3 max-w-lg">
              {[
                { value: 'auto', label: 'Auto Mode', desc: 'Uses backend when available, falls back to local storage', recommended: true },
                { value: 'api', label: 'Backend Database', desc: 'MongoDB — requires backend server to be running', disabled: backendStatus === false },
                { value: 'local', label: 'Local Storage (Offline)', desc: 'Stores data in the browser — works without internet' },
              ].map(opt => (
                <label key={opt.value}
                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition ${
                    currentMode === opt.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
                  <input type="radio" name="storageMode" value={opt.value}
                    checked={currentMode === opt.value}
                    onChange={() => handleModeChange(opt.value)}
                    disabled={opt.disabled}
                    className="mt-0.5 accent-blue-600" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">{opt.label}</span>
                      {opt.recommended && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Recommended</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mt-5 p-3 bg-blue-50 border border-blue-100 rounded-lg max-w-lg">
              <p className="text-xs text-blue-800">
                <strong>Active:</strong> {currentMode.toUpperCase()} — {
                  currentMode === 'auto' ? 'Auto-switching between backend and local' :
                  currentMode === 'api' ? 'All data stored in MongoDB' :
                  'All data stored in your browser'
                }
              </p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════
            BACKUP TAB
        ══════════════════════════════════════════ */}
        {activeTab === 'backup' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Backup & Restore</h2>
            <p className="text-sm text-gray-500 mb-6">Export or import all system data.</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Total Users', value: backupStats.users, color: 'blue' },
                { label: 'Total Employees', value: backupStats.employees, color: 'green' },
                { label: 'Storage Used', value: `${backupStats.storageUsed} KB`, color: 'purple' },
              ].map(stat => (
                <div key={stat.label} className={`p-4 rounded-xl border text-center bg-${stat.color}-50 border-${stat.color}-100`}>
                  <p className={`text-xs font-semibold text-${stat.color}-600 mb-1`}>{stat.label}</p>
                  <p className={`text-2xl font-bold text-${stat.color}-900`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {backupStats.lastBackup && (
              <p className="text-xs text-gray-400 mb-5">
                Last backup: {backupStats.lastBackup.toLocaleString()}
              </p>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <button onClick={exportData}
                className="flex flex-col items-center gap-1.5 p-4 border border-green-200 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition text-xs font-semibold">
                <span className="text-2xl">📥</span> Export Data
              </button>
              <label className="flex flex-col items-center gap-1.5 p-4 border border-blue-200 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition text-xs font-semibold cursor-pointer">
                <span className="text-2xl">📤</span> Import Data
                <input type="file" accept=".json" onChange={importData} className="hidden" />
              </label>
              <button onClick={resetToDefault}
                className="flex flex-col items-center gap-1.5 p-4 border border-amber-200 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition text-xs font-semibold">
                <span className="text-2xl">🔄</span> Reset Default
              </button>
              <button onClick={clearAllData}
                className="flex flex-col items-center gap-1.5 p-4 border border-red-200 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition text-xs font-semibold">
                <span className="text-2xl">🗑️</span> Clear All
              </button>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs font-semibold text-gray-600 mb-2">Instructions</p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li><strong>Export:</strong> Downloads a JSON backup of all your data</li>
                <li><strong>Import:</strong> Restores data from a previous backup file</li>
                <li><strong>Reset Default:</strong> Replaces current data with sample data</li>
                <li><strong>Clear All:</strong> ⚠️ Permanently deletes everything</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StorageSettings;