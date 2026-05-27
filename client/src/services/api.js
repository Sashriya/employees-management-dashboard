import axios from 'axios';
import { localAuthService, localEmployeeService } from './localStorage.service.js';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance for real API
const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Storage mode configuration
let storageMode = localStorage.getItem('storage_mode') || 'auto'; // 'auto', 'local', 'api'

export const setStorageMode = (mode) => {
  storageMode = mode;
  localStorage.setItem('storage_mode', mode);
  window.location.reload();
};

export const getStorageMode = () => storageMode;

const isUsingLocalStorage = () => {
  if (storageMode === 'local') return true;
  if (storageMode === 'api') return false;
  // Auto mode - check if backend is available
  return !isBackendAvailable;
};

let isBackendAvailable = true;

// Check backend health - Fixed to use root endpoint instead of /health
export const checkBackendHealth = async () => {
  try {
    // Try to access the API root or a simple endpoint
    await axiosInstance.get('/', { timeout: 3000 });
    isBackendAvailable = true;
    return true;
  } catch (error) {
    isBackendAvailable = false;
    return false;
  }
};

// Auth Service with fallback
export const authService = {
  // Register new user
  register: async (userData) => {
    if (isUsingLocalStorage()) {
      return localAuthService.register(userData);
    }
    try {
      return await axiosInstance.post('/auth/register', userData);
    } catch (error) {
      if (storageMode === 'auto') {
        console.log('Backend unavailable, switching to local storage');
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
      return await axiosInstance.post('/auth/login', credentials);
    } catch (error) {
      if (storageMode === 'auto') {
        console.log('Backend unavailable, switching to local storage');
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
      return await axiosInstance.get('/auth/me');
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
      return await axiosInstance.put('/auth/profile', userData);
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
      return await axiosInstance.post('/auth/change-password', { currentPassword, newPassword });
    } catch (error) {
      if (storageMode === 'auto') {
        return localAuthService.changePassword(currentPassword, newPassword);
      }
      throw error;
    }
  },
  
  // Logout
  logout: () => {
    if (isUsingLocalStorage()) {
      localAuthService.logout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
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

// Employee Service with fallback
export const employeeService = {
  // Get all employees with pagination and search
  getAll: async (params) => {
    if (isUsingLocalStorage()) {
      return localEmployeeService.getAll(params);
    }
    try {
      return await axiosInstance.get('/employees', { params });
    } catch (error) {
      if (storageMode === 'auto') {
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
      return await axiosInstance.get(`/employees/${id}`);
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
      return await axiosInstance.post('/employees', data);
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
      return await axiosInstance.put(`/employees/${id}`, data);
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
      return await axiosInstance.delete(`/employees/${id}`);
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
      return localEmployeeService.getAll({ search: department });
    }
    try {
      return await axiosInstance.get(`/employees/department/${department}`);
    } catch (error) {
      if (storageMode === 'auto') {
        return localEmployeeService.getAll({ search: department });
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
      return await axiosInstance.get(`/employees/status/${status}`);
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
      return await axiosInstance.get('/employees/statistics');
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
  }
};

// Export the instance for direct use if needed
export default axiosInstance;