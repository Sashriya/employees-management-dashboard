// client/src/services/api.js
import axios from 'axios';
import { 
  localAuthService, 
  localEmployeeService, 
  localAssignmentService, 
  localNotificationService,
  localDepartmentService,
  localLeaveService,
  backupService,
  isLocalStorageAvailable as localStorageAvailable
} from './localStorage.service.js';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance for real API
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Add token to requests for real API
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && !token.startsWith('local_token')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors for real API
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!isUsingLocalStorage()) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Storage mode configuration
let storageMode = localStorage.getItem('storage_mode') || 'auto'; // 'auto', 'local', 'api'
let isBackendAvailable = true;

export const setStorageMode = (mode) => {
  storageMode = mode;
  localStorage.setItem('storage_mode', mode);
  window.dispatchEvent(new Event('storageModeChange'));
};

export const getStorageMode = () => storageMode;

// Export isLocalStorageAvailable function
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

const isUsingLocalStorage = () => {
  if (storageMode === 'local') return true;
  if (storageMode === 'api') return false;
  // Auto mode - check if backend is available
  return !isBackendAvailable;
};

// Check backend health
export const checkBackendHealth = async () => {
  try {
    const response = await axiosInstance.get('/health', { timeout: 5000 });
    isBackendAvailable = response.data?.status === 'ok';
    return isBackendAvailable;
  } catch (error) {
    console.log('Backend health check failed:', error.message);
    isBackendAvailable = false;
    return false;
  }
};

// Initialize backend health check
checkBackendHealth();

// Listen for storage mode changes
window.addEventListener('storageModeChange', () => {
  storageMode = localStorage.getItem('storage_mode') || 'auto';
});

// ========== AUTH SERVICE ==========
export const authService = {
  register: async (userData) => {
    if (isUsingLocalStorage()) {
      console.log('Using local storage for registration');
      return localAuthService.register(userData);
    }
    try {
      const response = await axiosInstance.post('/auth/register', userData);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        console.log('Backend unavailable, using local storage');
        return localAuthService.register(userData);
      }
      throw error;
    }
  },
  
  login: async (credentials) => {
    if (isUsingLocalStorage()) {
      console.log('Using local storage for login');
      return localAuthService.login(credentials);
    }
    try {
      const response = await axiosInstance.post('/auth/login', credentials);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        console.log('Backend unavailable, using local storage');
        return localAuthService.login(credentials);
      }
      throw error;
    }
  },
  
  getMe: async () => {
    if (isUsingLocalStorage()) {
      return localAuthService.getMe();
    }
    try {
      const response = await axiosInstance.get('/auth/me');
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localAuthService.getMe();
      }
      throw error;
    }
  },
  
  updateProfile: async (userData) => {
    if (isUsingLocalStorage()) {
      return localAuthService.updateProfile(userData);
    }
    try {
      const response = await axiosInstance.put('/auth/profile', userData);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localAuthService.updateProfile(userData);
      }
      throw error;
    }
  },
  
  changePassword: async (currentPassword, newPassword) => {
    if (isUsingLocalStorage()) {
      return localAuthService.changePassword(currentPassword, newPassword);
    }
    try {
      const response = await axiosInstance.post('/auth/change-password', { currentPassword, newPassword });
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localAuthService.changePassword(currentPassword, newPassword);
      }
      throw error;
    }
  },
  
  logout: () => {
    if (!isUsingLocalStorage()) {
      localStorage.removeItem('token');
    }
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userProfile');
    localAuthService.logout();
  },
  
  isAuthenticated: () => {
    if (isUsingLocalStorage()) {
      return localAuthService.isAuthenticated();
    }
    return !!localStorage.getItem('token');
  },
  
  getToken: () => {
    if (isUsingLocalStorage()) {
      return localAuthService.getToken();
    }
    return localStorage.getItem('token');
  }
};

// ========== EMPLOYEE SERVICE ==========
export const employeeService = {
  getAll: async (params = {}) => {
    if (isUsingLocalStorage()) {
      return localEmployeeService.getAll(params);
    }
    try {
      const response = await axiosInstance.get('/employees', { params });
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localEmployeeService.getAll(params);
      }
      throw error;
    }
  },
  
  getById: async (id) => {
    if (isUsingLocalStorage()) {
      return localEmployeeService.getById(id);
    }
    try {
      const response = await axiosInstance.get(`/employees/${id}`);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localEmployeeService.getById(id);
      }
      throw error;
    }
  },
  
  getByEmployeeId: async (employeeId) => {
    if (isUsingLocalStorage()) {
      return localEmployeeService.getByEmployeeId(employeeId);
    }
    try {
      const response = await axiosInstance.get(`/employees/employeeId/${employeeId}`);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localEmployeeService.getByEmployeeId(employeeId);
      }
      throw error;
    }
  },
  
  create: async (data) => {
    if (isUsingLocalStorage()) {
      return localEmployeeService.create(data);
    }
    try {
      const response = await axiosInstance.post('/employees', data);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localEmployeeService.create(data);
      }
      throw error;
    }
  },
  
  update: async (id, data) => {
    if (isUsingLocalStorage()) {
      return localEmployeeService.update(id, data);
    }
    try {
      const response = await axiosInstance.put(`/employees/${id}`, data);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localEmployeeService.update(id, data);
      }
      throw error;
    }
  },
  
  delete: async (id) => {
    if (isUsingLocalStorage()) {
      return localEmployeeService.delete(id);
    }
    try {
      const response = await axiosInstance.delete(`/employees/${id}`);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localEmployeeService.delete(id);
      }
      throw error;
    }
  },
  
  getStats: async () => {
    if (isUsingLocalStorage()) {
      return localEmployeeService.getStats();
    }
    try {
      const response = await axiosInstance.get('/employees/stats');
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localEmployeeService.getStats();
      }
      throw error;
    }
  }
};

// ========== ASSIGNMENT SERVICE ==========
export const assignmentService = {
  getAll: async (params = {}) => {
    if (isUsingLocalStorage()) {
      return localAssignmentService.getAll(params);
    }
    try {
      const response = await axiosInstance.get('/assignments', { params });
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localAssignmentService.getAll(params);
      }
      throw error;
    }
  },
  
  getById: async (id) => {
    if (isUsingLocalStorage()) {
      return localAssignmentService.getById(id);
    }
    try {
      const response = await axiosInstance.get(`/assignments/${id}`);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localAssignmentService.getById(id);
      }
      throw error;
    }
  },
  
  create: async (data) => {
    if (isUsingLocalStorage()) {
      return localAssignmentService.create(data);
    }
    try {
      const response = await axiosInstance.post('/assignments', data);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localAssignmentService.create(data);
      }
      throw error;
    }
  },
  
  updateStatus: async (id, status) => {
    if (isUsingLocalStorage()) {
      return localAssignmentService.updateStatus(id, status);
    }
    try {
      const response = await axiosInstance.patch(`/assignments/${id}/status`, { status });
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localAssignmentService.updateStatus(id, status);
      }
      throw error;
    }
  },
  
  delete: async (id) => {
    if (isUsingLocalStorage()) {
      return localAssignmentService.delete(id);
    }
    try {
      const response = await axiosInstance.delete(`/assignments/${id}`);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localAssignmentService.delete(id);
      }
      throw error;
    }
  },
  
  getByDepartment: async (department) => {
    if (isUsingLocalStorage()) {
      return localAssignmentService.getByDepartment(department);
    }
    try {
      const response = await axiosInstance.get(`/assignments/department/${department}`);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localAssignmentService.getByDepartment(department);
      }
      throw error;
    }
  },
  
  getByEmployee: async (email) => {
    if (isUsingLocalStorage()) {
      return localAssignmentService.getByEmployee(email);
    }
    try {
      const response = await axiosInstance.get(`/assignments/employee/${email}`);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localAssignmentService.getByEmployee(email);
      }
      throw error;
    }
  }
};

// ========== NOTIFICATION SERVICE ==========
export const notificationService = {
  getAll: async (params = {}) => {
    if (isUsingLocalStorage()) {
      return localNotificationService.getAll(params);
    }
    try {
      const response = await axiosInstance.get('/notifications', { params });
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localNotificationService.getAll(params);
      }
      throw error;
    }
  },
  
  create: async (data) => {
    if (isUsingLocalStorage()) {
      return localNotificationService.create(data);
    }
    try {
      const response = await axiosInstance.post('/notifications', data);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localNotificationService.create(data);
      }
      throw error;
    }
  },
  
  markAsRead: async (id) => {
    if (isUsingLocalStorage()) {
      return localNotificationService.markAsRead(id);
    }
    try {
      const response = await axiosInstance.patch(`/notifications/${id}/read`);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localNotificationService.markAsRead(id);
      }
      throw error;
    }
  },
  
  markAllAsRead: async (role, userEmail) => {
    if (isUsingLocalStorage()) {
      return localNotificationService.markAllAsRead(role, userEmail);
    }
    try {
      const response = await axiosInstance.post('/notifications/mark-all-read', { role, userEmail });
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localNotificationService.markAllAsRead(role, userEmail);
      }
      throw error;
    }
  },
  
  clearAll: async (role, userEmail) => {
    if (isUsingLocalStorage()) {
      return localNotificationService.clearAll(role, userEmail);
    }
    try {
      const response = await axiosInstance.delete('/notifications', { data: { role, userEmail } });
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localNotificationService.clearAll(role, userEmail);
      }
      throw error;
    }
  }
};

// ========== DEPARTMENT SERVICE ==========
export const departmentService = {
  getAll: async () => {
    if (isUsingLocalStorage()) {
      return localDepartmentService.getAll();
    }
    try {
      const response = await axiosInstance.get('/departments');
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localDepartmentService.getAll();
      }
      throw error;
    }
  }
};

// ========== LEAVE SERVICE ==========
export const leaveService = {
  getAll: async () => {
    if (isUsingLocalStorage()) {
      return localLeaveService.getAll();
    }
    try {
      const response = await axiosInstance.get('/leaves');
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localLeaveService.getAll();
      }
      throw error;
    }
  },
  
  getByEmployee: async (email) => {
    if (isUsingLocalStorage()) {
      return localLeaveService.getByEmployee(email);
    }
    try {
      const response = await axiosInstance.get(`/leaves/employee/${email}`);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localLeaveService.getByEmployee(email);
      }
      throw error;
    }
  },
  
  create: async (data) => {
    if (isUsingLocalStorage()) {
      return localLeaveService.create(data);
    }
    try {
      const response = await axiosInstance.post('/leaves', data);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localLeaveService.create(data);
      }
      throw error;
    }
  },
  
  updateStatus: async (id, status, reviewedBy, comments) => {
    if (isUsingLocalStorage()) {
      return localLeaveService.updateStatus(id, status, reviewedBy, comments);
    }
    try {
      const response = await axiosInstance.patch(`/leaves/${id}/status`, { status, reviewedBy, comments });
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localLeaveService.updateStatus(id, status, reviewedBy, comments);
      }
      throw error;
    }
  }
};

// ========== BACKUP SERVICE ==========
export { backupService };

export default axiosInstance;