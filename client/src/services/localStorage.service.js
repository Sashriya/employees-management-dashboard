// Local Storage Service for Employee Management

const STORAGE_KEYS = {
  USERS: 'ems_users',
  EMPLOYEES: 'ems_employees',
  CURRENT_USER: 'ems_current_user',
  TOKEN: 'ems_token',
  LAST_BACKUP: 'ems_last_backup'
};

// Initialize default data if empty
const initializeData = () => {
  // Initialize users if empty
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    const defaultUsers = [
      {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123',
        fullName: 'Admin User',
        phone: '+1234567890',
        department: 'IT',
        position: 'System Administrator',
        avatar: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        username: 'john_doe',
        email: 'john@example.com',
        password: 'john123',
        fullName: 'John Doe',
        phone: '+1234567891',
        department: 'IT',
        position: 'Software Developer',
        avatar: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        username: 'jane_smith',
        email: 'jane@example.com',
        password: 'jane123',
        fullName: 'Jane Smith',
        phone: '+1234567892',
        department: 'HR',
        position: 'HR Manager',
        avatar: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(defaultUsers));
  }

  // Initialize employees if empty
  if (!localStorage.getItem(STORAGE_KEYS.EMPLOYEES)) {
    const defaultEmployees = [
      {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        department: 'IT',
        position: 'Senior Developer',
        salary: 75000,
        hireDate: '2023-01-15',
        status: 'Active',
        address: '123 Main St, New York, NY 10001',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567891',
        department: 'HR',
        position: 'HR Manager',
        salary: 65000,
        hireDate: '2023-03-20',
        status: 'Active',
        address: '456 Oak Ave, Los Angeles, CA 90001',
        city: 'Los Angeles',
        state: 'CA',
        zipCode: '90001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        firstName: 'Mike',
        lastName: 'Johnson',
        email: 'mike.j@example.com',
        phone: '+1234567892',
        department: 'Finance',
        position: 'Financial Analyst',
        salary: 70000,
        hireDate: '2023-06-10',
        status: 'Active',
        address: '789 Pine Rd, Chicago, IL 60601',
        city: 'Chicago',
        state: 'IL',
        zipCode: '60601',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        firstName: 'Sarah',
        lastName: 'Williams',
        email: 'sarah.w@example.com',
        phone: '+1234567893',
        department: 'Marketing',
        position: 'Marketing Specialist',
        salary: 60000,
        hireDate: '2023-08-05',
        status: 'Active',
        address: '321 Elm Blvd, Houston, TX 77001',
        city: 'Houston',
        state: 'TX',
        zipCode: '77001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '5',
        firstName: 'Robert',
        lastName: 'Brown',
        email: 'robert.b@example.com',
        phone: '+1234567894',
        department: 'Sales',
        position: 'Sales Executive',
        salary: 55000,
        hireDate: '2023-09-12',
        status: 'Active',
        address: '654 Cedar Ln, Phoenix, AZ 85001',
        city: 'Phoenix',
        state: 'AZ',
        zipCode: '85001',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(defaultEmployees));
  }
};

// Call initialize on service load
initializeData();

// User Services
export const localAuthService = {
  // Register new user
  register: (userData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        
        // Check if user already exists
        const existingUser = users.find(u => u.email === userData.email || u.username === userData.username);
        if (existingUser) {
          reject({ response: { data: { message: 'User already exists' } } });
          return;
        }

        const newUser = {
          id: Date.now().toString(),
          username: userData.username,
          email: userData.email,
          password: userData.password,
          fullName: userData.fullName || '',
          phone: userData.phone || '',
          department: userData.department || '',
          position: userData.position || '',
          avatar: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        
        // Create token
        const token = `local_token_${newUser.id}`;
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        
        const currentUser = {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          fullName: newUser.fullName,
          phone: newUser.phone,
          department: newUser.department,
          position: newUser.position
        };
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
        
        resolve({
          data: {
            message: 'User created successfully',
            token,
            user: currentUser
          }
        });
      }, 500);
    });
  },

  // Login user
  login: (credentials) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const user = users.find(u => u.email === credentials.email && u.password === credentials.password);
        
        if (!user) {
          reject({ response: { data: { message: 'Invalid credentials' } } });
          return;
        }

        const token = `local_token_${user.id}`;
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
        
        const currentUser = {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName || '',
          phone: user.phone || '',
          department: user.department || '',
          position: user.position || ''
        };
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
        
        resolve({
          data: {
            message: 'Login successful',
            token,
            user: currentUser
          }
        });
      }, 500);
    });
  },

  // Get current user
  getMe: () => {
    return new Promise((resolve) => {
      const user = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || '{}');
      resolve({ data: user });
    });
  },

  // Update user profile
  updateProfile: (userData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || '{}');
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        
        if (userIndex === -1) {
          reject({ response: { data: { message: 'User not found' } } });
          return;
        }
        
        // Update user in users array
        users[userIndex] = {
          ...users[userIndex],
          username: userData.username || users[userIndex].username,
          email: userData.email || users[userIndex].email,
          fullName: userData.fullName || users[userIndex].fullName,
          phone: userData.phone || users[userIndex].phone,
          department: userData.department || users[userIndex].department,
          position: userData.position || users[userIndex].position,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        
        // Update current user
        const updatedCurrentUser = {
          id: users[userIndex].id,
          username: users[userIndex].username,
          email: users[userIndex].email,
          fullName: users[userIndex].fullName,
          phone: users[userIndex].phone,
          department: users[userIndex].department,
          position: users[userIndex].position
        };
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedCurrentUser));
        
        resolve({ 
          data: { 
            message: 'Profile updated successfully',
            user: updatedCurrentUser 
          } 
        });
      }, 500);
    });
  },

  // Change password
  changePassword: (currentPassword, newPassword) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || '{}');
        const user = users.find(u => u.id === currentUser.id);
        
        if (!user) {
          reject({ response: { data: { message: 'User not found' } } });
          return;
        }
        
        if (user.password !== currentPassword) {
          reject({ response: { data: { message: 'Current password is incorrect' } } });
          return;
        }
        
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        users[userIndex].password = newPassword;
        users[userIndex].updatedAt = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
        
        resolve({ data: { message: 'Password changed successfully' } });
      }, 500);
    });
  },

  // Logout
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  },

  // Check if logged in
  isAuthenticated: () => {
    return !!localStorage.getItem(STORAGE_KEYS.TOKEN);
  },

  // Get token
  getToken: () => {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },
  
  // Get all users (for admin)
  getAllUsers: () => {
    return new Promise((resolve) => {
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const safeUsers = users.map(u => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
      });
      resolve({ data: safeUsers });
    });
  },
  
  // Delete user (for admin)
  deleteUser: (userId) => {
    return new Promise((resolve, reject) => {
      const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
      const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || '{}');
      
      if (userId === currentUser.id) {
        reject({ response: { data: { message: 'Cannot delete your own account' } } });
        return;
      }
      
      const filteredUsers = users.filter(u => u.id !== userId);
      if (filteredUsers.length === users.length) {
        reject({ response: { data: { message: 'User not found' } } });
        return;
      }
      
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(filteredUsers));
      resolve({ data: { message: 'User deleted successfully' } });
    });
  }
};

// Employee Services with Local Storage
export const localEmployeeService = {
  // Get all employees with pagination and search
  getAll: (params = {}) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        let employees = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
        
        // Apply search filter
        const { page = 1, limit = 10, search = '' } = params;
        if (search) {
          employees = employees.filter(emp =>
            emp.firstName.toLowerCase().includes(search.toLowerCase()) ||
            emp.lastName.toLowerCase().includes(search.toLowerCase()) ||
            emp.email.toLowerCase().includes(search.toLowerCase()) ||
            emp.department.toLowerCase().includes(search.toLowerCase()) ||
            emp.position.toLowerCase().includes(search.toLowerCase())
          );
        }
        
        // Sort by createdAt descending
        employees.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        const total = employees.length;
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedEmployees = employees.slice(start, end);
        
        resolve({
          data: {
            employees: paginatedEmployees,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
          }
        });
      }, 300);
    });
  },

  // Get employee by ID
  getById: (id) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const employees = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
        const employee = employees.find(emp => emp.id === id);
        
        if (!employee) {
          reject({ response: { data: { message: 'Employee not found' } } });
          return;
        }
        
        resolve({ data: employee });
      }, 300);
    });
  },

  // Create employee
  create: (employeeData) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const employees = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
        
        // Check if email already exists
        const existingEmployee = employees.find(emp => emp.email === employeeData.email);
        if (existingEmployee) {
          reject({ response: { data: { message: 'Email already exists' } } });
          return;
        }
        
        const newEmployee = {
          id: Date.now().toString(),
          ...employeeData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        employees.push(newEmployee);
        localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
        
        resolve({ data: newEmployee });
      }, 500);
    });
  },

  // Update employee
  update: (id, employeeData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let employees = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
        const index = employees.findIndex(emp => emp.id === id);
        
        if (index === -1) {
          reject({ response: { data: { message: 'Employee not found' } } });
          return;
        }
        
        // Check if email already exists for another employee
        const existingEmployee = employees.find(emp => emp.email === employeeData.email && emp.id !== id);
        if (existingEmployee) {
          reject({ response: { data: { message: 'Email already exists' } } });
          return;
        }
        
        employees[index] = {
          ...employees[index],
          ...employeeData,
          updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
        resolve({ data: employees[index] });
      }, 500);
    });
  },

  // Delete employee
  delete: (id) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        let employees = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
        const filteredEmployees = employees.filter(emp => emp.id !== id);
        
        if (filteredEmployees.length === employees.length) {
          reject({ response: { data: { message: 'Employee not found' } } });
          return;
        }
        
        localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(filteredEmployees));
        resolve({ data: { message: 'Employee deleted successfully' } });
      }, 500);
    });
  },
  
  // Get employees by department
  getByDepartment: (department) => {
    return new Promise((resolve) => {
      const employees = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
      const filtered = employees.filter(emp => emp.department === department);
      resolve({ data: filtered });
    });
  },
  
  // Get employees by status
  getByStatus: (status) => {
    return new Promise((resolve) => {
      const employees = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
      const filtered = employees.filter(emp => emp.status === status);
      resolve({ data: filtered });
    });
  },
  
  // Get employee statistics
  getStatistics: () => {
    return new Promise((resolve) => {
      const employees = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
      const departmentCount = {};
      let activeCount = 0;
      let totalSalary = 0;
      
      employees.forEach(emp => {
        if (emp.status === 'Active') activeCount++;
        departmentCount[emp.department] = (departmentCount[emp.department] || 0) + 1;
        totalSalary += emp.salary || 0;
      });
      
      resolve({
        data: {
          total: employees.length,
          active: activeCount,
          inactive: employees.filter(emp => emp.status === 'Inactive').length,
          onLeave: employees.filter(emp => emp.status === 'On Leave').length,
          totalSalary: totalSalary,
          averageSalary: employees.length > 0 ? totalSalary / employees.length : 0,
          departments: Object.entries(departmentCount).map(([name, count]) => ({ name, count }))
        }
      });
    });
  },
  
  // Bulk import employees
  bulkImport: (employeesData) => {
    return new Promise((resolve) => {
      const existingEmployees = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
      const newEmployees = employeesData.map(emp => ({
        ...emp,
        id: Date.now().toString() + Math.random(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      
      const allEmployees = [...existingEmployees, ...newEmployees];
      localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(allEmployees));
      
      resolve({ data: { message: `${newEmployees.length} employees imported successfully` } });
    });
  },
  
  // Export all employees
  exportAll: () => {
    return new Promise((resolve) => {
      const employees = JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]');
      resolve({ data: employees });
    });
  }
};

// Backup and restore services
export const backupService = {
  // Create backup of all data
  createBackup: () => {
    const data = {
      users: JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),
      employees: JSON.parse(localStorage.getItem(STORAGE_KEYS.EMPLOYEES) || '[]'),
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    localStorage.setItem(STORAGE_KEYS.LAST_BACKUP, JSON.stringify(new Date().toISOString()));
    return data;
  },
  
  // Restore from backup
  restoreBackup: (backupData) => {
    return new Promise((resolve, reject) => {
      try {
        if (backupData.users) {
          localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(backupData.users));
        }
        if (backupData.employees) {
          localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(backupData.employees));
        }
        resolve({ message: 'Backup restored successfully' });
      } catch (error) {
        reject({ message: 'Failed to restore backup' });
      }
    });
  },
  
  // Clear all data
  clearAllData: () => {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.EMPLOYEES);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    initializeData(); // Re-initialize with default data
  },
  
  // Get storage statistics
  getStorageStats: () => {
    let totalSize = 0;
    const keys = Object.keys(localStorage);
    
    keys.forEach(key => {
      if (key.startsWith('ems_')) {
        totalSize += localStorage[key].length;
      }
    });
    
    return {
      totalKeys: keys.filter(k => k.startsWith('ems_')).length,
      totalSizeBytes: totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(4)
    };
  }
};

// Export storage keys for debugging
export { STORAGE_KEYS };

// Export a flag to indicate if using local storage
export const useLocalStorage = true;