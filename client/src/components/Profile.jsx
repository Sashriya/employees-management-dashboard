// client/src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar.jsx';

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = JSON.parse(localStorage.getItem('user'));
    const role = localStorage.getItem('userRole');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }
    
    setUser(userData);
    setUserRole(role);
    loadProfile();
  }, [navigate]);

  const loadProfile = () => {
    let userProfile = localStorage.getItem('userProfile');
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const users = JSON.parse(localStorage.getItem('ems_users') || '[]');
    const employees = JSON.parse(localStorage.getItem('ems_employees') || '[]');
    
    if (userProfile) {
      const profileData = JSON.parse(userProfile);
      setProfile(profileData);
      setEditForm(profileData);
    } else {
      const userData = users.find(u => u.id === currentUser.id) || currentUser;
      const employeeData = employees.find(e => e.email === currentUser.email);
      
      const defaultProfile = {
        id: userData.id || Date.now().toString(),
        employeeId: userData.employeeId || employeeData?.employeeId || 'N/A',
        username: userData.username || '',
        email: userData.email || '',
        fullName: userData.fullName || employeeData?.name || '',
        gender: userData.gender || employeeData?.gender || '',
        department: userData.department || employeeData?.department || '',
        phoneNumber: userData.phoneNumber || employeeData?.phoneNumber || '',
        location: userData.location || employeeData?.location || '',
        address: userData.address || '',
        position: userData.position || employeeData?.position || '',
        role: userData.role || 'employee',
        status: 'active',
        profilePicture: null,
        skills: [],
        experience: [],
        education: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      setProfile(defaultProfile);
      setEditForm(defaultProfile);
    }
    
    setLoading(false);
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };

  const handleArrayChange = (field, value) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item);
    setEditForm({
      ...editForm,
      [field]: arrayValue
    });
  };

  const handleExperienceChange = (index, field, value) => {
    const updatedExperience = [...(editForm.experience || [])];
    updatedExperience[index][field] = value;
    setEditForm({
      ...editForm,
      experience: updatedExperience
    });
  };

  const addExperience = () => {
    setEditForm({
      ...editForm,
      experience: [...(editForm.experience || []), { title: '', company: '', year: '', description: '' }]
    });
  };

  const removeExperience = (index) => {
    const updatedExperience = (editForm.experience || []).filter((_, i) => i !== index);
    setEditForm({
      ...editForm,
      experience: updatedExperience
    });
  };

  const handleEducationChange = (index, field, value) => {
    const updatedEducation = [...(editForm.education || [])];
    updatedEducation[index][field] = value;
    setEditForm({
      ...editForm,
      education: updatedEducation
    });
  };

  const addEducation = () => {
    setEditForm({
      ...editForm,
      education: [...(editForm.education || []), { degree: '', institution: '', year: '', grade: '' }]
    });
  };

  const removeEducation = (index) => {
    const updatedEducation = (editForm.education || []).filter((_, i) => i !== index);
    setEditForm({
      ...editForm,
      education: updatedEducation
    });
  };

  const handleProfilePicture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({
          ...editForm,
          profilePicture: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    const updatedProfile = {
      ...editForm,
      updatedAt: new Date().toISOString()
    };
    
    localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    
    const users = JSON.parse(localStorage.getItem('ems_users') || '[]');
    const userIndex = users.findIndex(u => u.id === updatedProfile.id);
    
    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        username: updatedProfile.username,
        email: updatedProfile.email,
        fullName: updatedProfile.fullName,
        gender: updatedProfile.gender,
        department: updatedProfile.department,
        phoneNumber: updatedProfile.phoneNumber,
        location: updatedProfile.location,
        address: updatedProfile.address,
        position: updatedProfile.position,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('ems_users', JSON.stringify(users));
    }
    
    const currentUser = {
      id: updatedProfile.id,
      employeeId: updatedProfile.employeeId,
      username: updatedProfile.username,
      email: updatedProfile.email,
      role: updatedProfile.role,
      fullName: updatedProfile.fullName,
      gender: updatedProfile.gender,
      department: updatedProfile.department,
      phoneNumber: updatedProfile.phoneNumber,
      location: updatedProfile.location
    };
    localStorage.setItem('user', JSON.stringify(currentUser));
    
    const employees = JSON.parse(localStorage.getItem('ems_employees') || '[]');
    const employeeIndex = employees.findIndex(e => e.email === updatedProfile.email);
    
    if (employeeIndex !== -1) {
      employees[employeeIndex] = {
        ...employees[employeeIndex],
        name: updatedProfile.fullName,
        fullName: updatedProfile.fullName,
        gender: updatedProfile.gender,
        department: updatedProfile.department,
        phoneNumber: updatedProfile.phoneNumber,
        location: updatedProfile.location,
        address: updatedProfile.address,
        position: updatedProfile.position
      };
      localStorage.setItem('ems_employees', JSON.stringify(employees));
    }
    
    setProfile(updatedProfile);
    setIsEditing(false);
    toast.success('Profile updated successfully!');
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  const isAdmin = userRole === 'admin';

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const InfoField = ({ label, value }) => (
    <div>
      <label className="block text-sm font-medium text-gray-500">{label}</label>
      <p className="mt-1 text-gray-900">{value || 'Not specified'}</p>
    </div>
  );

  const EditField = ({ label, name, value, onChange, type = "text", isTextarea = false, required = false }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label} {required && <span className="text-red-500">*</span>}</label>
      {isTextarea ? (
        <textarea name={name} rows="2" value={value} onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      ) : (
        <input type={type} name={name} value={value} onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      )}
    </div>
  );

  return (
    <div>
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">My Profile</h1>
                <p className="text-blue-100 text-sm mt-1">{isAdmin ? 'Administrator Account' : 'Employee Account'}</p>
              </div>
              {!isEditing && (
                <button onClick={() => setIsEditing(true)} className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {!isEditing ? (
            <div className="p-6">
              <div className="flex justify-center mb-6">
                <div className="relative">
                  {profile?.profilePicture ? (
                    <img src={profile.profilePicture} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-blue-600 shadow-lg" />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center border-4 border-blue-600 shadow-lg">
                      <span className="text-white text-4xl font-bold">
                        {profile?.fullName?.charAt(0).toUpperCase() || profile?.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-1 border-2 border-white">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoField label="Employee ID" value={profile?.employeeId || 'N/A'} />
                <InfoField label="Full Name" value={profile?.fullName} />
                <InfoField label="Gender" value={profile?.gender ? `${profile.gender === 'Male' ? '👨' : profile.gender === 'Female' ? '👩' : '👤'} ${profile.gender}` : 'Not specified'} />
                <InfoField label="Username" value={profile?.username} />
                <InfoField label="Email" value={profile?.email} />
                <InfoField label="Phone Number" value={profile?.phoneNumber} />
                <InfoField label="Department" value={profile?.department} />
                <InfoField label="Position" value={profile?.position} />
                <InfoField label="Location" value={profile?.location} />
                <InfoField label="Role" value={profile?.role === 'admin' ? 'Administrator' : 'Employee'} />
                <div className="md:col-span-2">
                  <InfoField label="Address" value={profile?.address} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Skills</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {profile?.skills?.length > 0 ? (
                      profile.skills.map((skill, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">{skill}</span>
                      ))
                    ) : (
                      <p className="text-gray-900">No skills added</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Work Experience
                </h2>
                {profile?.experience?.length > 0 ? (
                  <div className="space-y-4">
                    {profile.experience.map((exp, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                        <h3 className="font-semibold text-gray-900">{exp.title}</h3>
                        <p className="text-gray-600">{exp.company}</p>
                        <p className="text-sm text-gray-500">{exp.year}</p>
                        {exp.description && <p className="text-gray-700 mt-2">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No work experience added</p>
                )}
              </div>

              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="h-5 w-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                  </svg>
                  Education
                </h2>
                {profile?.education?.length > 0 ? (
                  <div className="space-y-4">
                    {profile.education.map((edu, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-lg border-l-4 border-green-500">
                        <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                        <p className="text-gray-600">{edu.institution}</p>
                        <p className="text-sm text-gray-500">Year: {edu.year} | Grade: {edu.grade}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No education details added</p>
                )}
              </div>

              <div className="mt-8 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                  <div><span className="font-medium">Member since:</span> {new Date(profile?.createdAt).toLocaleDateString()}</div>
                  <div><span className="font-medium">Last updated:</span> {new Date(profile?.updatedAt).toLocaleDateString()}</div>
                  <div><span className="font-medium">Status:</span> <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">{profile?.status || 'Active'}</span></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                <div className="mb-6 flex justify-center">
                  <div className="text-center">
                    {editForm.profilePicture ? (
                      <img src={editForm.profilePicture} alt="Preview" className="w-32 h-32 rounded-full object-cover border-4 border-blue-600 mx-auto mb-2" />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center border-4 border-blue-600 mx-auto mb-2">
                        <span className="text-white text-4xl font-bold">{editForm.fullName?.charAt(0).toUpperCase() || 'U'}</span>
                      </div>
                    )}
                    <label className="cursor-pointer bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm hover:bg-gray-200">
                      Change Photo
                      <input type="file" accept="image/*" onChange={handleProfilePicture} className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Employee ID</label>
                    <input type="text" value={editForm.employeeId || 'N/A'} disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed" />
                  </div>
                  <EditField label="Full Name" name="fullName" value={editForm.fullName || ''} onChange={handleEditChange} required />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                    <select name="gender" value={editForm.gender || ''} onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Gender</option>
                      <option value="Male">👨 Male</option>
                      <option value="Female">👩 Female</option>
                      <option value="Other">👤 Other</option>
                    </select>
                  </div>
                  <EditField label="Username" name="username" value={editForm.username || ''} onChange={handleEditChange} required />
                  <EditField label="Email" name="email" type="email" value={editForm.email || ''} onChange={handleEditChange} required />
                  <EditField label="Phone Number" name="phoneNumber" value={editForm.phoneNumber || ''} onChange={handleEditChange} />
                  <EditField label="Department" name="department" value={editForm.department || ''} onChange={handleEditChange} />
                  <EditField label="Position" name="position" value={editForm.position || ''} onChange={handleEditChange} />
                  <EditField label="Location" name="location" value={editForm.location || ''} onChange={handleEditChange} />
                  <div className="md:col-span-2">
                    <EditField label="Address" name="address" value={editForm.address || ''} onChange={handleEditChange} isTextarea />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Skills (comma separated)</label>
                    <input type="text" value={editForm.skills?.join(', ') || ''} onChange={(e) => handleArrayChange('skills', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="React, JavaScript, Python, Leadership, etc." />
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
                    <button type="button" onClick={addExperience} className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700">+ Add Experience</button>
                  </div>
                  {(editForm.experience || []).map((exp, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="flex justify-end mb-2">
                        <button type="button" onClick={() => removeExperience(index)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input type="text" placeholder="Job Title" value={exp.title || ''} onChange={(e) => handleExperienceChange(index, 'title', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                        <input type="text" placeholder="Company" value={exp.company || ''} onChange={(e) => handleExperienceChange(index, 'company', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                        <input type="text" placeholder="Year (e.g., 2020-2023)" value={exp.year || ''} onChange={(e) => handleExperienceChange(index, 'year', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                        <textarea placeholder="Description" rows="2" value={exp.description || ''} onChange={(e) => handleExperienceChange(index, 'description', e.target.value)}
                          className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  ))}
                  {(editForm.experience || []).length === 0 && <p className="text-gray-500 text-sm">No experience added. Click "Add Experience" to start.</p>}
                </div>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                    <button type="button" onClick={addEducation} className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700">+ Add Education</button>
                  </div>
                  {(editForm.education || []).map((edu, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg mb-4">
                      <div className="flex justify-end mb-2">
                        <button type="button" onClick={() => removeEducation(index)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input type="text" placeholder="Degree (e.g., B.Tech, MBA)" value={edu.degree || ''} onChange={(e) => handleEducationChange(index, 'degree', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                        <input type="text" placeholder="Institution" value={edu.institution || ''} onChange={(e) => handleEducationChange(index, 'institution', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                        <input type="text" placeholder="Year (e.g., 2019)" value={edu.year || ''} onChange={(e) => handleEducationChange(index, 'year', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                        <input type="text" placeholder="Grade/CGPA" value={edu.grade || ''} onChange={(e) => handleEducationChange(index, 'grade', e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                  ))}
                  {(editForm.education || []).length === 0 && <p className="text-gray-500 text-sm">No education added. Click "Add Education" to start.</p>}
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <button type="button" onClick={handleCancel} className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Save Changes</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;