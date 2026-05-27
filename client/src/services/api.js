// client/src/services/api.js
import axios from 'axios';
import { 
  localAuthService, 
  localEmployeeService, 
  localAssignmentService, 
  localNotificationService,
  localDepartmentService,
  localLeaveService,
  backupService
} from './localStorage.service.js';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// FORCE LOCAL STORAGE MODE FOR DEPLOYMENT - NO BACKEND CALLS
localStorage.setItem('storage_mode', 'local');

// Create axios instance for real API (not used but kept for compatibility)
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Storage mode configuration
let storageMode = 'local'; // Force local mode
let isBackendAvailable = false; // Force backend as unavailable

export const setStorageMode = (mode) => {
  storageMode = mode;
  localStorage.setItem('storage_mode', mode);
  window.dispatchEvent(new Event('storageModeChange'));
};

export const getStorageMode = () => storageMode;

export const isLocalStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.error('LocalStorage not available:', e);
    return false;
  }
};

// Always use local storage
const isUsingLocalStorage = () => {
  return true; // Force always use local storage
};

// Check backend health - always returns false
export const checkBackendHealth = async () => {
  return false;
};

// ========== AUTH SERVICE ==========
export const authService = {
  register: async (userData) => {
    console.log('Using local storage for registration');
    return localAuthService.register(userData);
  },
  
  login: async (credentials) => {
    console.log('Using local storage for login');
    return localAuthService.login(credentials);
  },
  
  getMe: async () => {
    return localAuthService.getMe();
  },
  
  updateProfile: async (userData) => {
    return localAuthService.updateProfile(userData);
  },
  
  changePassword: async (currentPassword, newPassword) => {
    return localAuthService.changePassword(currentPassword, newPassword);
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userProfile');
    localAuthService.logout();
  },
  
  isAuthenticated: () => {
    return localAuthService.isAuthenticated();
  },
  
  getToken: () => {
    return localAuthService.getToken();
  }
};

// ========== EMPLOYEE SERVICE ==========
export const employeeService = {
  getAll: async (params = {}) => {
    return localEmployeeService.getAll(params);
  },
  
  getById: async (id) => {
    return localEmployeeService.getById(id);
  },
  
  getByEmployeeId: async (employeeId) => {
    return localEmployeeService.getByEmployeeId(employeeId);
  },
  
  create: async (data) => {
    return localEmployeeService.create(data);
  },
  
  update: async (id, data) => {
    return localEmployeeService.update(id, data);
  },
  
  delete: async (id) => {
    return localEmployeeService.delete(id);
  },
  
  getStats: async () => {
    return localEmployeeService.getStats();
  }
};

// ========== ASSIGNMENT SERVICE ==========
export const assignmentService = {
  getAll: async (params = {}) => {
    return localAssignmentService.getAll(params);
  },
  
  getById: async (id) => {
    return localAssignmentService.getById(id);
  },
  
  create: async (data) => {
    return localAssignmentService.create(data);
  },
  
  updateStatus: async (id, status) => {
    return localAssignmentService.updateStatus(id, status);
  },
  
  delete: async (id) => {
    return localAssignmentService.delete(id);
  },
  
  getByDepartment: async (department) => {
    return localAssignmentService.getByDepartment(department);
  },
  
  getByEmployee: async (email) => {
    return localAssignmentService.getByEmployee(email);
  }
};

// ========== NOTIFICATION SERVICE ==========
export const notificationService = {
  getAll: async (params = {}) => {
    return localNotificationService.getAll(params);
  },
  
  create: async (data) => {
    return localNotificationService.create(data);
  },
  
  markAsRead: async (id) => {
    return localNotificationService.markAsRead(id);
  },
  
  markAllAsRead: async (role, userEmail) => {
    return localNotificationService.markAllAsRead(role, userEmail);
  },
  
  clearAll: async (role, userEmail) => {
    return localNotificationService.clearAll(role, userEmail);
  }
};

// ========== DEPARTMENT SERVICE ==========
export const departmentService = {
  getAll: async () => {
    return localDepartmentService.getAll();
  }
};

// ========== LEAVE SERVICE ==========
export const leaveService = {
  getAll: async () => {
    return localLeaveService.getAll();
  },
  
  getByEmployee: async (email) => {
    return localLeaveService.getByEmployee(email);
  },
  
  create: async (data) => {
    return localLeaveService.create(data);
  },
  
  updateStatus: async (id, status, reviewedBy, comments) => {
    return localLeaveService.updateStatus(id, status, reviewedBy, comments);
  }
};

// ========== BACKUP SERVICE ==========
export { backupService };

export default axiosInstance;