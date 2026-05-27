// client/src/services/localStorage.service.js

export const STORAGE_KEYS = {
  USERS: 'ems_users',
  CURRENT_USER: 'ems_current_user',
  EMPLOYEES: 'ems_employees',
  ASSIGNMENTS: 'ems_assignments',
  NOTIFICATIONS: 'ems_notifications',
  BACKUP: 'ems_last_backup',
  STORAGE_MODE: 'storage_mode',
  USER_PROFILE: 'userProfile',
  LEAVE_REQUESTS: 'ems_leave_requests'
};

// Helper functions
const getUsers = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
  } catch (error) {
    console.error('Error parsing users:', error);
    return [];
  }
};

const getEmployees = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
  } catch (error) {
    console.error('Error parsing employees:', error);
    return [];
  }
};

const getAssignments = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS) || '[]');
  } catch (error) {
    console.error('Error parsing assignments:', error);
    return [];
  }
};

const getNotifications = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
  } catch (error) {
    console.error('Error parsing notifications:', error);
    return [];
  }
};

const getUserProfile = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_PROFILE) || '{}');
  } catch (error) {
    console.error('Error parsing user profile:', error);
    return {};
  }
};

const getLeaveRequests = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LEAVE_REQUESTS) || '[]');
  } catch (error) {
    console.error('Error parsing leave requests:', error);
    return [];
  }
};

const saveUsers = (users) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    return true;
  } catch (error) {
    console.error('Error saving users:', error);
    return false;
  }
};

const saveEmployees = (employees) => {
  try {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
    return true;
  } catch (error) {
    console.error('Error saving employees:', error);
    return false;
  }
};

const saveAssignments = (assignments) => {
  try {
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
    return true;
  } catch (error) {
    console.error('Error saving assignments:', error);
    return false;
  }
};

const saveNotifications = (notifications) => {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    return true;
  } catch (error) {
    console.error('Error saving notifications:', error);
    return false;
  }
};

const saveUserProfile = (profile) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    return true;
  } catch (error) {
    console.error('Error saving user profile:', error);
    return false;
  }
};

const saveLeaveRequests = (requests) => {
  try {
    localStorage.setItem(STORAGE_KEYS.LEAVE_REQUESTS, JSON.stringify(requests));
    return true;
  } catch (error) {
    console.error('Error saving leave requests:', error);
    return false;
  }
};

// Helper function to generate Employee ID
const generateEmployeeId = () => {
  const users = getUsers();
  const employees = getEmployees();
  
  const allIds = [
    ...users.map(u => u.employeeId),
    ...employees.map(e => e.employeeId)
  ].filter(id => id && id.startsWith('EMP'));
  
  let maxNum = 0;
  allIds.forEach(id => {
    const num = parseInt(id.replace('EMP', ''));
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  });
  
  const nextNum = maxNum + 1;
  const newId = `EMP${nextNum.toString().padStart(3, '0')}`;
  console.log('Generated new Employee ID:', newId);
  return newId;
};

// Check localStorage availability
export const isLocalStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

// ========== AUTH SERVICE ==========
export const localAuthService = {
  register: async (userData) => {
    console.log('Starting registration with data:', userData);
    
    // Check localStorage availability
    if (!isLocalStorageAvailable()) {
      throw new Error('LocalStorage is not available. Please check your browser settings.');
    }
    
    try {
      const users = getUsers();
      console.log('Existing users:', users);
      
      const existingUser = users.find(u => u.email === userData.email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }
      
      const employeeId = generateEmployeeId();
      console.log('Generated Employee ID:', employeeId);
      
      const newUser = {
        id: Date.now().toString(),
        employeeId: employeeId,
        username: userData.username,
        email: userData.email,
        password: userData.password,
        fullName: userData.fullName || userData.username,
        gender: userData.gender || '',
        role: userData.role || 'employee',
        department: userData.department || '',
        position: userData.position || '',
        phoneNumber: userData.phoneNumber || '',
        location: userData.location || '',
        address: userData.address || '',
        createdAt: new Date().toISOString()
      };
      
      users.push(newUser);
      const saved = saveUsers(users);
      if (!saved) {
        throw new Error('Failed to save user to localStorage');
      }
      console.log('User saved successfully:', newUser);
      
      const employees = getEmployees();
      const newEmployee = {
        id: Date.now().toString(),
        employeeId: employeeId,
        name: newUser.fullName,
        fullName: newUser.fullName,
        email: newUser.email,
        gender: newUser.gender,
        department: newUser.department,
        position: newUser.position,
        phoneNumber: newUser.phoneNumber,
        location: newUser.location,
        address: newUser.address,
        status: 'Active',
        joinDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      };
      employees.push(newEmployee);
      saveEmployees(employees);
      console.log('Employee saved successfully:', newEmployee);
      
      const userProfile = {
        id: newUser.id,
        employeeId: employeeId,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.fullName,
        gender: newUser.gender,
        department: newUser.department,
        phoneNumber: newUser.phoneNumber,
        location: newUser.location,
        address: newUser.address,
        position: newUser.position,
        role: newUser.role,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        profilePicture: null,
        skills: [],
        experience: [],
        education: []
      };
      saveUserProfile(userProfile);
      console.log('User profile saved successfully');
      
      const token = `local_token_${newUser.id}`;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id: newUser.id,
        employeeId: employeeId,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
        fullName: newUser.fullName,
        gender: newUser.gender,
        department: newUser.department
      }));
      localStorage.setItem('userRole', newUser.role);
      
      console.log('Registration completed successfully');
      
      return { 
        data: { 
          token, 
          user: newUser, 
          employeeId: employeeId 
        } 
      };
    } catch (error) {
      console.error('Registration error in localStorage:', error);
      throw error;
    }
  },
  
  login: async (credentials) => {
    console.log('Login attempt with:', credentials.employeeId);
    
    try {
      const users = getUsers();
      console.log('Total users:', users.length);
      
      const user = users.find(u => 
        u.employeeId === credentials.employeeId && u.password === credentials.password
      );
      
      if (!user) {
        throw new Error('Invalid Employee ID or Password');
      }
      
      console.log('User found:', user);
      
      const employees = getEmployees();
      const employee = employees.find(e => e.email === user.email);
      
      const token = `local_token_${user.id}`;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id: user.id,
        employeeId: user.employeeId,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        gender: user.gender,
        department: user.department,
        position: user.position,
        phoneNumber: user.phoneNumber,
        location: user.location
      }));
      localStorage.setItem('userRole', user.role);
      
      console.log('Login successful');
      
      return { data: { token, user, employee } };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  getMe: async () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.id) throw new Error('Not authenticated');
    return { data: user };
  },
  
  updateProfile: async (userData) => {
    const users = getUsers();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...userData, updatedAt: new Date().toISOString() };
      saveUsers(users);
      localStorage.setItem('user', JSON.stringify(users[userIndex]));
      
      const profile = getUserProfile();
      const updatedProfile = { ...profile, ...userData, updatedAt: new Date().toISOString() };
      saveUserProfile(updatedProfile);
      
      const employees = getEmployees();
      const empIndex = employees.findIndex(e => e.email === users[userIndex].email);
      if (empIndex !== -1) {
        employees[empIndex] = { ...employees[empIndex], ...userData, updatedAt: new Date().toISOString() };
        saveEmployees(employees);
      }
    }
    
    return { data: users[userIndex] };
  },
  
  changePassword: async (currentPassword, newPassword) => {
    const users = getUsers();
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const user = users.find(u => u.id === currentUser.id);
    
    if (user && user.password !== currentPassword) {
      throw new Error('Current password is incorrect');
    }
    
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
      users[userIndex].password = newPassword;
      saveUsers(users);
    }
    
    return { data: { success: true } };
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userProfile');
  },
  
  isAuthenticated: () => !!localStorage.getItem('token'),
  getToken: () => localStorage.getItem('token')
};

// ========== EMPLOYEE SERVICE ==========
export const localEmployeeService = {
  getAll: async (params = {}) => {
    let employees = getEmployees();
    const { limit = 100, page = 1, search, department, status } = params;
    
    if (search) {
      employees = employees.filter(emp => 
        emp.employeeId?.toLowerCase().includes(search.toLowerCase()) ||
        emp.name?.toLowerCase().includes(search.toLowerCase()) ||
        emp.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        emp.email?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (department) employees = employees.filter(emp => emp.department === department);
    if (status) employees = employees.filter(emp => emp.status === status);
    
    const total = employees.length;
    const paginated = employees.slice((page - 1) * limit, page * limit);
    
    return { data: { employees: paginated, total, page, limit } };
  },
  
  getById: async (id) => {
    const employees = getEmployees();
    const employee = employees.find(emp => emp.id === id);
    if (!employee) throw new Error('Employee not found');
    return { data: employee };
  },
  
  getByEmployeeId: async (employeeId) => {
    const employees = getEmployees();
    const employee = employees.find(emp => emp.employeeId === employeeId);
    if (!employee) throw new Error('Employee not found');
    return { data: employee };
  },
  
  create: async (data) => {
    const employees = getEmployees();
    const employeeId = generateEmployeeId();
    
    const newEmployee = {
      id: Date.now().toString(),
      employeeId: employeeId,
      name: data.fullName || data.name,
      fullName: data.fullName || data.name,
      email: data.email,
      gender: data.gender || '',
      department: data.department,
      position: data.position || '',
      phoneNumber: data.phoneNumber,
      location: data.location,
      address: data.address || '',
      status: data.status || 'Active',
      joinDate: data.joinDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    
    employees.push(newEmployee);
    saveEmployees(employees);
    
    const users = getUsers();
    const newUser = {
      id: Date.now().toString(),
      employeeId: employeeId,
      username: data.email.split('@')[0],
      email: data.email,
      password: 'password123',
      fullName: data.fullName || data.name,
      gender: data.gender || '',
      role: 'employee',
      department: data.department,
      position: data.position || '',
      phoneNumber: data.phoneNumber,
      location: data.location,
      address: data.address || '',
      status: 'active',
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    saveUsers(users);
    
    return { data: newEmployee };
  },
  
  update: async (id, data) => {
    const employees = getEmployees();
    const index = employees.findIndex(emp => emp.id === id);
    if (index === -1) throw new Error('Employee not found');
    
    employees[index] = { ...employees[index], ...data, updatedAt: new Date().toISOString() };
    saveEmployees(employees);
    
    const users = getUsers();
    const userIndex = users.findIndex(u => u.email === data.email);
    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        fullName: data.fullName || data.name,
        gender: data.gender,
        department: data.department,
        phoneNumber: data.phoneNumber,
        location: data.location,
        address: data.address,
        position: data.position,
        updatedAt: new Date().toISOString()
      };
      saveUsers(users);
    }
    
    return { data: employees[index] };
  },
  
  delete: async (id) => {
    const employees = getEmployees();
    const employee = employees.find(emp => emp.id === id);
    const filtered = employees.filter(emp => emp.id !== id);
    saveEmployees(filtered);
    
    if (employee) {
      const users = getUsers();
      const filteredUsers = users.filter(u => u.email !== employee.email);
      saveUsers(filteredUsers);
    }
    
    return { data: { success: true } };
  },
  
  getStats: async () => {
    const employees = getEmployees();
    const departmentCount = {};
    let activeCount = 0;
    
    employees.forEach(emp => {
      if (emp.status === 'Active' || emp.status === 'active') activeCount++;
      const dept = emp.department || 'Unassigned';
      departmentCount[dept] = (departmentCount[dept] || 0) + 1;
    });
    
    return {
      data: {
        total: employees.length,
        active: activeCount,
        departments: Object.entries(departmentCount).map(([name, count]) => ({ name, count }))
      }
    };
  }
};

// ========== ASSIGNMENT SERVICE ==========
export const localAssignmentService = {
  getAll: async (params = {}) => {
    let assignments = getAssignments();
    const { department, employee, status } = params;
    
    if (department) assignments = assignments.filter(a => a.assignedDepartment === department);
    if (employee) assignments = assignments.filter(a => a.assignedTo === employee);
    if (status) assignments = assignments.filter(a => a.status === status);
    
    assignments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { data: { assignments } };
  },
  
  getById: async (id) => {
    const assignments = getAssignments();
    const assignment = assignments.find(a => a.id === id);
    if (!assignment) throw new Error('Assignment not found');
    return { data: assignment };
  },
  
  create: async (data) => {
    const assignments = getAssignments();
    const newAssignment = {
      ...data,
      id: data.id || Date.now().toString(),
      status: data.status || 'Not Started',
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    assignments.push(newAssignment);
    saveAssignments(assignments);
    return { data: newAssignment };
  },
  
  update: async (id, data) => {
    const assignments = getAssignments();
    const index = assignments.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Assignment not found');
    assignments[index] = { ...assignments[index], ...data, updatedAt: new Date().toISOString() };
    saveAssignments(assignments);
    return { data: assignments[index] };
  },
  
  updateStatus: async (id, status) => {
    const assignments = getAssignments();
    const index = assignments.findIndex(a => a.id === id);
    if (index === -1) throw new Error('Assignment not found');
    assignments[index] = {
      ...assignments[index],
      status,
      updatedAt: new Date().toISOString(),
      completedAt: status === 'Completed' ? new Date().toISOString() : assignments[index].completedAt
    };
    saveAssignments(assignments);
    return { data: assignments[index] };
  },
  
  delete: async (id) => {
    const assignments = getAssignments();
    const filtered = assignments.filter(a => a.id !== id);
    saveAssignments(filtered);
    return { data: { success: true } };
  },
  
  getByDepartment: async (department) => {
    const assignments = getAssignments();
    const filtered = assignments.filter(a => a.assignedDepartment === department);
    return { data: { assignments: filtered } };
  },
  
  getByEmployee: async (email) => {
    const assignments = getAssignments();
    const filtered = assignments.filter(a => a.assignedTo === email);
    return { data: { assignments: filtered } };
  }
};

// ========== NOTIFICATION SERVICE ==========
export const localNotificationService = {
  getAll: async (params = {}) => {
    let notifications = getNotifications();
    const { assignedTo, department, type, role, targetUser } = params;
    
    if (assignedTo) notifications = notifications.filter(n => n.assignedTo === assignedTo);
    if (department) notifications = notifications.filter(n => n.department === department);
    if (type) notifications = notifications.filter(n => n.type === type);
    
    if (role === 'admin') {
      notifications = notifications.filter(n => 
        n.type === 'leave_request' || n.type === 'completion' || n.type === 'assignment' || n.targetRole === 'admin'
      );
    } else if (role === 'employee' && targetUser) {
      notifications = notifications.filter(n => 
        n.targetUser === targetUser || 
        n.department === department ||
        (n.type === 'assignment' && (n.assignedTo === targetUser || n.assignedDepartment === department))
      );
    }
    
    notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { data: { notifications } };
  },
  
  create: async (data) => {
    const notifications = getNotifications();
    const newNotification = {
      ...data,
      id: data.id || Date.now().toString(),
      read: false,
      createdAt: new Date().toISOString(),
      targetRole: data.targetRole || null,
      targetUser: data.targetUser || null,
      targetDepartment: data.targetDepartment || null
    };
    notifications.unshift(newNotification);
    saveNotifications(notifications);
    return { data: newNotification };
  },
  
  markAsRead: async (id) => {
    const notifications = getNotifications();
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications[index].read = true;
      saveNotifications(notifications);
    }
    return { data: { success: true } };
  },
  
  markAllAsRead: async (role, userEmail) => {
    let notifications = getNotifications();
    if (role === 'admin') {
      notifications = notifications.map(n => ({ ...n, read: true }));
    } else {
      notifications = notifications.map(n => {
        if (n.targetUser === userEmail || (n.type === 'assignment' && n.assignedTo === userEmail)) {
          return { ...n, read: true };
        }
        return n;
      });
    }
    saveNotifications(notifications);
    return { data: { success: true } };
  },
  
  delete: async (id) => {
    const notifications = getNotifications();
    const filtered = notifications.filter(n => n.id !== id);
    saveNotifications(filtered);
    return { data: { success: true } };
  },
  
  clearAll: async (role, userEmail) => {
    let notifications = getNotifications();
    if (role === 'admin') {
      notifications = [];
    } else {
      notifications = notifications.filter(n => 
        n.targetUser !== userEmail && !(n.type === 'assignment' && n.assignedTo === userEmail)
      );
    }
    saveNotifications(notifications);
    return { data: { success: true } };
  },
  
  getUnreadCount: async (role, userEmail, userDepartment) => {
    let notifications = getNotifications();
    if (role === 'admin') {
      notifications = notifications.filter(n => !n.read);
    } else {
      notifications = notifications.filter(n => 
        (!n.read) && (
          n.targetUser === userEmail || 
          n.targetDepartment === userDepartment ||
          (n.type === 'assignment' && (n.assignedTo === userEmail || n.assignedDepartment === userDepartment))
        )
      );
    }
    return { data: { count: notifications.length } };
  }
};

// ========== DEPARTMENT SERVICE ==========
export const localDepartmentService = {
  getAll: async () => {
    const employees = getEmployees();
    const departments = [...new Set(employees.map(emp => emp.department).filter(Boolean))];
    return { data: { departments } };
  },
  
  getStats: async () => {
    const employees = getEmployees();
    const stats = {};
    employees.forEach(emp => { if (emp.department) stats[emp.department] = (stats[emp.department] || 0) + 1; });
    return { data: { stats } };
  }
};

// ========== LEAVE SERVICE ==========
export const localLeaveService = {
  getAll: async () => {
    const leaves = getLeaveRequests();
    return { data: { leaves } };
  },
  
  getByEmployee: async (email) => {
    const leaves = getLeaveRequests();
    const filtered = leaves.filter(l => l.employeeEmail === email);
    return { data: { leaves: filtered } };
  },
  
  create: async (data) => {
    const leaves = getLeaveRequests();
    const newLeave = {
      ...data,
      id: data.id || Date.now().toString(),
      status: 'Pending',
      appliedOn: new Date().toISOString()
    };
    leaves.push(newLeave);
    saveLeaveRequests(leaves);
    return { data: newLeave };
  },
  
  updateStatus: async (id, status, reviewedBy, comments) => {
    const leaves = getLeaveRequests();
    const index = leaves.findIndex(l => l.id === id);
    if (index !== -1) {
      leaves[index] = {
        ...leaves[index],
        status,
        reviewedBy,
        reviewedOn: new Date().toISOString(),
        comments: comments || null
      };
      saveLeaveRequests(leaves);
    }
    return { data: leaves[index] };
  }
};

// ========== BACKUP SERVICE ==========
export const backupService = {
  exportData: () => {
    const data = {
      users: getUsers(),
      employees: getEmployees(),
      assignments: getAssignments(),
      notifications: getNotifications(),
      leaveRequests: getLeaveRequests(),
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
    localStorage.setItem(STORAGE_KEYS.BACKUP, JSON.stringify(new Date().toISOString()));
  },
  
  importData: async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.users) saveUsers(data.users);
          if (data.employees) saveEmployees(data.employees);
          if (data.assignments) saveAssignments(data.assignments);
          if (data.notifications) saveNotifications(data.notifications);
          if (data.leaveRequests) saveLeaveRequests(data.leaveRequests);
          resolve({ data: { success: true } });
        } catch (error) { reject(error); }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  },
  
  clearAllData: () => {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
    localStorage.removeItem(STORAGE_KEYS.ASSIGNMENTS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.BACKUP);
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.LEAVE_REQUESTS);
  },
  
  getStats: () => ({
    users: getUsers().length,
    employees: getEmployees().length,
    assignments: getAssignments().length,
    notifications: getNotifications().length,
    leaveRequests: getLeaveRequests().length
  })
};