// client/src/services/api.js
import axios from 'axios';
// client/src/services/api.js - Update the import at the top
import { 
  localAuthService, 
  localEmployeeService, 
  localAssignmentService, 
  localNotificationService 
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
      // Only clear if not using local storage
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
  // Don't reload, just update the mode
  window.dispatchEvent(new Event('storageModeChange'));
};

export const getStorageMode = () => storageMode;

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
  // Register new user
  register: async (userData) => {
    if (isUsingLocalStorage()) {
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
  
  // Login user
  login: async (credentials) => {
    if (isUsingLocalStorage()) {
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
  
  // Get current user
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
  
  // Update user profile
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
  
  // Change password
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
  
  // Logout
  logout: () => {
    if (!isUsingLocalStorage()) {
      localStorage.removeItem('token');
    }
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userProfile');
    localAuthService.logout();
  },
  
  // Check if authenticated
  isAuthenticated: () => {
    if (isUsingLocalStorage()) {
      return localAuthService.isAuthenticated();
    }
    return !!localStorage.getItem('token');
  },
  
  // Get token
  getToken: () => {
    if (isUsingLocalStorage()) {
      return localAuthService.getToken();
    }
    return localStorage.getItem('token');
  }
};

// ========== EMPLOYEE SERVICE ==========
export const employeeService = {
  // Get all employees with pagination and search
  getAll: async (params = {}) => {
    if (isUsingLocalStorage()) {
      return localEmployeeService.getAll(params);
    }
    try {
      const response = await axiosInstance.get('/employees', { params });
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        console.log('Backend unavailable, using local storage');
        return localEmployeeService.getAll(params);
      }
      throw error;
    }
  },
  
  // Get employee by ID
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
  
  // Create new employee
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
  
  // Update employee
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
  
  // Delete employee
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
  
  // Get employees by department
  getByDepartment: async (department) => {
    if (isUsingLocalStorage()) {
      const allEmployees = await localEmployeeService.getAll({ limit: 1000 });
      const filtered = allEmployees.data.employees.filter(emp => emp.department === department);
      return { data: { employees: filtered, total: filtered.length } };
    }
    try {
      const response = await axiosInstance.get(`/employees/department/${department}`);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        const allEmployees = await localEmployeeService.getAll({ limit: 1000 });
        const filtered = allEmployees.data.employees.filter(emp => emp.department === department);
        return { data: { employees: filtered, total: filtered.length } };
      }
      throw error;
    }
  },
  
  // Get employees by status
  getByStatus: async (status) => {
    if (isUsingLocalStorage()) {
      const allEmployees = await localEmployeeService.getAll({ limit: 1000 });
      const filtered = allEmployees.data.employees.filter(emp => emp.status === status);
      return { data: { employees: filtered, total: filtered.length } };
    }
    try {
      const response = await axiosInstance.get(`/employees/status/${status}`);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        const allEmployees = await localEmployeeService.getAll({ limit: 1000 });
        const filtered = allEmployees.data.employees.filter(emp => emp.status === status);
        return { data: { employees: filtered, total: filtered.length } };
      }
      throw error;
    }
  },
  
  // Get employee statistics
  getStatistics: async () => {
    if (isUsingLocalStorage()) {
      const employees = await localEmployeeService.getAll({ limit: 1000 });
      const deptCount = {};
      let activeCount = 0;
      employees.data.employees.forEach(emp => {
        if (emp.status === 'Active') activeCount++;
        deptCount[emp.department] = (deptCount[emp.department] || 0) + 1;
      });
      return {
        data: {
          total: employees.data.total,
          active: activeCount,
          departments: Object.entries(deptCount).map(([name, count]) => ({ name, count }))
        }
      };
    }
    try {
      const response = await axiosInstance.get('/employees/statistics');
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        const employees = await localEmployeeService.getAll({ limit: 1000 });
        const deptCount = {};
        let activeCount = 0;
        employees.data.employees.forEach(emp => {
          if (emp.status === 'Active') activeCount++;
          deptCount[emp.department] = (deptCount[emp.department] || 0) + 1;
        });
        return {
          data: {
            total: employees.data.total,
            active: activeCount,
            departments: Object.entries(deptCount).map(([name, count]) => ({ name, count }))
          }
        };
      }
      throw error;
    }
  },
  
  // Get employee stats for dashboard
  getStats: async () => {
    return employeeService.getStatistics();
  }
};

// ========== ASSIGNMENT SERVICE ==========
export const assignmentService = {
  // Get all assignments
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
  
  // Get assignment by ID
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
  
  // Create assignment
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
  
  // Update assignment
  update: async (id, data) => {
    if (isUsingLocalStorage()) {
      return localAssignmentService.update(id, data);
    }
    try {
      const response = await axiosInstance.put(`/assignments/${id}`, data);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localAssignmentService.update(id, data);
      }
      throw error;
    }
  },
  
  // Update assignment status
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
  
  // Delete assignment
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
  
  // Get assignments by department
  getByDepartment: async (department) => {
    if (isUsingLocalStorage()) {
      const allAssignments = await localAssignmentService.getAll();
      const filtered = allAssignments.data.assignments.filter(a => a.assignedDepartment === department);
      return { data: { assignments: filtered } };
    }
    try {
      const response = await axiosInstance.get(`/assignments/department/${department}`);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        const allAssignments = await localAssignmentService.getAll();
        const filtered = allAssignments.data.assignments.filter(a => a.assignedDepartment === department);
        return { data: { assignments: filtered } };
      }
      throw error;
    }
  },
  
  // Get assignments by employee
  getByEmployee: async (email) => {
    if (isUsingLocalStorage()) {
      const allAssignments = await localAssignmentService.getAll();
      const filtered = allAssignments.data.assignments.filter(a => a.assignedTo === email);
      return { data: { assignments: filtered } };
    }
    try {
      const response = await axiosInstance.get(`/assignments/employee/${email}`);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        const allAssignments = await localAssignmentService.getAll();
        const filtered = allAssignments.data.assignments.filter(a => a.assignedTo === email);
        return { data: { assignments: filtered } };
      }
      throw error;
    }
  }
};

// ========== NOTIFICATION SERVICE ==========
export const notificationService = {
  // Get all notifications
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
  
  // Mark notification as read
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
  
  // Mark all as read
  markAllAsRead: async () => {
    if (isUsingLocalStorage()) {
      return localNotificationService.markAllAsRead();
    }
    try {
      const response = await axiosInstance.post('/notifications/mark-all-read');
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localNotificationService.markAllAsRead();
      }
      throw error;
    }
  },
  
  // Delete notification
  delete: async (id) => {
    if (isUsingLocalStorage()) {
      return localNotificationService.delete(id);
    }
    try {
      const response = await axiosInstance.delete(`/notifications/${id}`);
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localNotificationService.delete(id);
      }
      throw error;
    }
  },
  
  // Clear all notifications
  clearAll: async () => {
    if (isUsingLocalStorage()) {
      return localNotificationService.clearAll();
    }
    try {
      const response = await axiosInstance.delete('/notifications');
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localNotificationService.clearAll();
      }
      throw error;
    }
  },
  
  // Get unread count
  getUnreadCount: async () => {
    if (isUsingLocalStorage()) {
      return localNotificationService.getUnreadCount();
    }
    try {
      const response = await axiosInstance.get('/notifications/unread/count');
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        return localNotificationService.getUnreadCount();
      }
      throw error;
    }
  }
};

// ========== DEPARTMENT SERVICE ==========
export const departmentService = {
  // Get all departments
  getAll: async () => {
    if (isUsingLocalStorage()) {
      const employees = await localEmployeeService.getAll({ limit: 1000 });
      const departments = [...new Set(employees.data.employees.map(emp => emp.department).filter(Boolean))];
      return { data: { departments } };
    }
    try {
      const response = await axiosInstance.get('/departments');
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        const employees = await localEmployeeService.getAll({ limit: 1000 });
        const departments = [...new Set(employees.data.employees.map(emp => emp.department).filter(Boolean))];
        return { data: { departments } };
      }
      throw error;
    }
  },
  
  // Get department stats
  getStats: async () => {
    if (isUsingLocalStorage()) {
      const employees = await localEmployeeService.getAll({ limit: 1000 });
      const deptCount = {};
      employees.data.employees.forEach(emp => {
        if (emp.department) {
          deptCount[emp.department] = (deptCount[emp.department] || 0) + 1;
        }
      });
      return { data: { departments: deptCount } };
    }
    try {
      const response = await axiosInstance.get('/departments/stats');
      return response;
    } catch (error) {
      if (storageMode === 'auto') {
        const employees = await localEmployeeService.getAll({ limit: 1000 });
        const deptCount = {};
        employees.data.employees.forEach(emp => {
          if (emp.department) {
            deptCount[emp.department] = (deptCount[emp.department] || 0) + 1;
          }
        });
        return { data: { departments: deptCount } };
      }
      throw error;
    }
  }
};

// Export the instance for direct use
export default axiosInstance;