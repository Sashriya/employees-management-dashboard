// client/src/pages/Dashboard.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { employeeService, assignmentService, notificationService, departmentService } from '../services/api.js';
import Navbar from '../components/Navbar.jsx';
import toast from 'react-hot-toast';
import io from 'socket.io-client';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    departments: [],
  });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [recentEmployees, setRecentEmployees] = useState([]);
  const [employeeData, setEmployeeData] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    assignedTo: '',
    assignedToName: '',
    assignedDepartment: '',
    priority: 'Medium',
    deadline: ''
  });
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [notificationList, setNotificationList] = useState([]);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  
  // Leave summary states
  const [leaveSummary, setLeaveSummary] = useState({ pending: 0, approved: 0, rejected: 0 });
  
  // Popup states
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState({ title: '', content: [], type: '' });
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const [activeCard, setActiveCard] = useState(null);
  
  // WebSocket state
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);
  const cacheRef = useRef({});
  const popupTimeoutRef = useRef(null);
  const notificationCheckInterval = useRef(null);

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
    getEmployeeData(userData);
    
    Promise.all([
      loadCachedOrFetchData(),
      loadCachedOrFetchAssignments(userData, role),
      loadNotifications()
    ]).finally(() => setLoading(false));
    
    loadLeaveSummary();
    
    setTimeout(() => {
      initializeSocket(userData, role);
    }, 1000);
    
    notificationCheckInterval.current = setInterval(() => {
      if (!socketConnected) {
        loadNotifications();
        loadLeaveSummary();
        loadCachedOrFetchAssignments(userData, role);
      }
    }, 5000);
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (popupTimeoutRef.current) {
        clearTimeout(popupTimeoutRef.current);
      }
      if (notificationCheckInterval.current) {
        clearInterval(notificationCheckInterval.current);
      }
    };
  }, [navigate]);

  const getEmployeeData = (userData) => {
    const employees = JSON.parse(localStorage.getItem('ems_employees') || '[]');
    const users = JSON.parse(localStorage.getItem('ems_users') || '[]');
    
    let empData = employees.find(emp => emp.email === userData?.email);
    
    if (!empData && userData) {
      const userDataFromUsers = users.find(u => u.email === userData.email);
      if (userDataFromUsers) {
        empData = {
          id: userDataFromUsers.id,
          employeeId: userDataFromUsers.employeeId,
          name: userDataFromUsers.fullName,
          fullName: userDataFromUsers.fullName,
          email: userDataFromUsers.email,
          gender: userDataFromUsers.gender,
          department: userDataFromUsers.department,
          position: userDataFromUsers.position,
          phoneNumber: userDataFromUsers.phoneNumber,
          location: userDataFromUsers.location,
          address: userDataFromUsers.address,
          status: 'Active'
        };
      }
    }
    
    setEmployeeData(empData);
  };

  const loadLeaveSummary = () => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const allRequests = JSON.parse(localStorage.getItem('ems_leave_requests') || '[]');
    const userRequests = allRequests.filter(req => req.employeeEmail === currentUser?.email);
    
    setLeaveSummary({
      pending: userRequests.filter(r => r.status === 'Pending').length,
      approved: userRequests.filter(r => r.status === 'Approved').length,
      rejected: userRequests.filter(r => r.status === 'Rejected').length
    });
  };

  const loadCachedOrFetchData = async () => {
    const cachedStats = localStorage.getItem('dashboard_stats_cache');
    const cachedTime = localStorage.getItem('dashboard_stats_time');
    
    if (cachedStats && cachedTime && (Date.now() - parseInt(cachedTime) < 30000)) {
      setStats(JSON.parse(cachedStats));
      return;
    }
    
    try {
      const [statsRes, employeesRes, deptsRes] = await Promise.allSettled([
        employeeService.getStats(),
        employeeService.getAll({ limit: 5 }),
        departmentService.getAll()
      ]);
      
      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        const newStats = {
          totalEmployees: statsRes.value.data.total || statsRes.value.data.totalEmployees || 0,
          activeEmployees: statsRes.value.data.active || statsRes.value.data.activeEmployees || 0,
          departments: statsRes.value.data.departments || [],
        };
        setStats(newStats);
        localStorage.setItem('dashboard_stats_cache', JSON.stringify(newStats));
        localStorage.setItem('dashboard_stats_time', Date.now().toString());
      } else {
        loadFromLocalStorage();
      }
      
      if (employeesRes.status === 'fulfilled' && employeesRes.value?.data?.employees) {
        setRecentEmployees(employeesRes.value.data.employees);
      } else {
        const employees = JSON.parse(localStorage.getItem('ems_employees') || '[]');
        setRecentEmployees(employees.slice(0, 5));
      }
      
      if (deptsRes.status === 'fulfilled' && deptsRes.value?.data?.departments) {
        setDepartments(deptsRes.value.data.departments);
      } else {
        const allEmployees = JSON.parse(localStorage.getItem('ems_employees') || '[]');
        const uniqueDepts = [...new Set(allEmployees.map(emp => emp.department).filter(Boolean))];
        setDepartments(uniqueDepts);
      }
      
      const allEmployeesRes = await employeeService.getAll({ limit: 1000 });
      if (allEmployeesRes?.data?.employees) {
        setEmployees(allEmployeesRes.data.employees);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      loadFromLocalStorage();
    }
  };

  const loadFromLocalStorage = () => {
    const employees = JSON.parse(localStorage.getItem('ems_employees') || '[]');
    const departmentCount = {};
    let activeCount = 0;
    
    employees.forEach(emp => {
      if (emp.status === 'Active' || emp.status === 'active') activeCount++;
      const dept = emp.department || 'Unassigned';
      departmentCount[dept] = (departmentCount[dept] || 0) + 1;
    });
    
    setStats({
      totalEmployees: employees.length,
      activeEmployees: activeCount,
      departments: Object.entries(departmentCount).map(([name, count]) => ({ name, count })),
    });
    setEmployees(employees);
    setRecentEmployees(employees.slice(0, 5));
    
    const uniqueDepts = [...new Set(employees.map(emp => emp.department).filter(Boolean))];
    setDepartments(uniqueDepts);
  };

  const handleMouseEnter = (e, type) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveCard(type);
    setPopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10
    });
    showPopupData(type);
  };

  const handleMouseLeave = () => {
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }
    popupTimeoutRef.current = setTimeout(() => {
      setShowPopup(false);
      setActiveCard(null);
    }, 200);
  };

  const handleClick = (e, type) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveCard(type);
    setPopupPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10
    });
    showPopupData(type);
  };

  const handlePopupMouseEnter = () => {
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }
  };

  const handlePopupMouseLeave = () => {
    setShowPopup(false);
    setActiveCard(null);
  };

  const showPopupData = (type) => {
    let title = '';
    let content = [];
    
    switch(type) {
      case 'total':
        title = '📊 Total Employees Details';
        const maleCount = employees.filter(e => e.gender === 'Male').length;
        const femaleCount = employees.filter(e => e.gender === 'Female').length;
        const otherCount = employees.filter(e => e.gender === 'Other').length;
        const newThisMonth = employees.filter(e => {
          const joinDate = new Date(e.joinDate);
          const now = new Date();
          return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
        }).length;
        
        content = [
          { label: 'Total Count', value: stats.totalEmployees, color: '#3B82F6', icon: '👥' },
          { label: 'Male Employees', value: maleCount, color: '#2563EB', icon: '👨' },
          { label: 'Female Employees', value: femaleCount, color: '#EC4899', icon: '👩' },
          { label: 'Other', value: otherCount, color: '#8B5CF6', icon: '👤' },
          { label: 'New This Month', value: newThisMonth, color: '#10B981', icon: '✨' },
          { label: 'Departments', value: stats.departments.length, color: '#8B5CF6', icon: '🏢' }
        ];
        break;
      case 'active':
        title = '✅ Active Employees Details';
        const activeList = employees.filter(e => e.status === 'Active' || e.status === 'active');
        const inactiveCount = stats.totalEmployees - stats.activeEmployees;
        const activePercentage = stats.totalEmployees > 0 ? ((stats.activeEmployees / stats.totalEmployees) * 100).toFixed(1) : 0;
        const onLeaveCount = employees.filter(e => e.status === 'On Leave').length;
        
        content = [
          { label: 'Active Count', value: stats.activeEmployees, color: '#10B981', icon: '✅' },
          { label: 'Inactive Count', value: inactiveCount, color: '#EF4444', icon: '❌' },
          { label: 'Active Percentage', value: `${activePercentage}%`, color: '#059669', icon: '📊' },
          { label: 'Currently Working', value: activeList.length, color: '#3B82F6', icon: '💼' },
          { label: 'On Leave', value: onLeaveCount, color: '#F59E0B', icon: '🏖️' }
        ];
        break;
      case 'departments':
        title = '🏢 Department Details';
        if (stats.departments.length > 0) {
          content = stats.departments.map(dept => ({
            label: dept.name,
            value: `${dept.count} employees`,
            color: '#8B5CF6',
            icon: '🏢'
          }));
        } else {
          content = [{ label: 'No departments found', value: 'Add departments', color: '#9CA3AF', icon: 'ℹ️' }];
        }
        break;
      default:
        return;
    }
    
    setPopupData({ title, content, type });
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
    setActiveCard(null);
    if (popupTimeoutRef.current) {
      clearTimeout(popupTimeoutRef.current);
    }
  };

  const createAdminNotification = async (message, type, assignmentId, leaveRequestId) => {
    const notification = {
      id: Date.now().toString(),
      message,
      type,
      assignmentId: assignmentId || null,
      leaveRequestId: leaveRequestId || null,
      targetRole: 'admin',
      read: false,
      createdAt: new Date().toISOString()
    };
    
    try {
      await notificationService.create(notification);
      if (socketRef.current && socketConnected) {
        socketRef.current.emit('new-notification', notification);
      }
      if (userRole === 'admin') {
        await loadNotifications();
      }
    } catch (error) {
      console.error('Error creating admin notification:', error);
      const existing = JSON.parse(localStorage.getItem('ems_notifications') || '[]');
      existing.unshift(notification);
      localStorage.setItem('ems_notifications', JSON.stringify(existing));
      if (userRole === 'admin') {
        await loadNotifications();
      }
    }
  };

  const createEmployeeNotification = async (message, type, targetUser, targetDepartment, assignmentId, leaveRequestId) => {
    const notification = {
      id: Date.now().toString(),
      message,
      type,
      targetUser: targetUser,
      targetDepartment: targetDepartment || null,
      assignmentId: assignmentId || null,
      leaveRequestId: leaveRequestId || null,
      read: false,
      createdAt: new Date().toISOString()
    };
    
    try {
      await notificationService.create(notification);
      if (socketRef.current && socketConnected) {
        socketRef.current.emit('new-notification', notification);
      }
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser.email === targetUser && userRole !== 'admin') {
        await loadNotifications();
        if (type === 'assignment') {
          toast.success(message, { duration: 5000, icon: '📋' });
        } else if (type === 'leave_response') {
          toast.success(message, { duration: 5000, icon: '✅' });
        } else if (type === 'update') {
          toast.info(message, { duration: 4000, icon: '🔄' });
        }
      }
    } catch (error) {
      console.error('Error creating employee notification:', error);
      const existing = JSON.parse(localStorage.getItem('ems_notifications') || '[]');
      existing.unshift(notification);
      localStorage.setItem('ems_notifications', JSON.stringify(existing));
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      if (currentUser.email === targetUser && userRole !== 'admin') {
        await loadNotifications();
      }
    }
  };

  const loadCachedOrFetchAssignments = async (userData, role) => {
    const cacheKey = `assignments_${role}_${userData?.email}`;
    const cached = cacheRef.current[cacheKey];
    if (cached && (Date.now() - cached.time < 15000)) {
      setAssignments(cached.data);
      return;
    }
    
    try {
      let assignmentsData = [];
      
      if (role === 'admin') {
        const response = await assignmentService.getAll();
        if (response?.data?.assignments) {
          assignmentsData = response.data.assignments;
          if (selectedDepartment) {
            assignmentsData = assignmentsData.filter(a => a.assignedDepartment === selectedDepartment);
          }
        }
      } else {
        const userEmail = userData?.email;
        const userDepartment = employeeData?.department;
        
        const [employeeRes, departmentRes] = await Promise.allSettled([
          assignmentService.getByEmployee(userEmail),
          assignmentService.getByDepartment(userDepartment)
        ]);
        
        if (employeeRes.status === 'fulfilled' && employeeRes.value?.data?.assignments) {
          assignmentsData.push(...employeeRes.value.data.assignments);
        }
        if (departmentRes.status === 'fulfilled' && departmentRes.value?.data?.assignments) {
          assignmentsData.push(...departmentRes.value.data.assignments);
        }
      }
      
      assignmentsData = assignmentsData.filter((a, index, self) => 
        index === self.findIndex(b => b.id === a.id)
      );
      
      setAssignments(assignmentsData);
      cacheRef.current[cacheKey] = { data: assignmentsData, time: Date.now() };
    } catch (error) {
      console.error('Error loading assignments:', error);
      const savedAssignments = JSON.parse(localStorage.getItem('ems_assignments') || '[]');
      setAssignments(savedAssignments);
    }
  };

  const loadNotifications = async () => {
    try {
      const role = userRole;
      let response;
      
      if (role === 'admin') {
        response = await notificationService.getAll({ role: 'admin' });
      } else {
        response = await notificationService.getAll({ 
          role: 'employee', 
          targetUser: user?.email,
          department: employeeData?.department 
        });
      }
      
      if (response?.data?.notifications) {
        setNotificationList(response.data.notifications);
        const unread = response.data.notifications.filter(n => !n.read).length;
        setUnreadNotifications(unread);
        localStorage.setItem('ems_last_notification_check', Date.now().toString());
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      const savedNotifications = JSON.parse(localStorage.getItem('ems_notifications') || '[]');
      let filtered = [];
      
      if (userRole === 'admin') {
        filtered = savedNotifications.filter(n => 
          n.type === 'leave_request' || n.type === 'completion' || n.type === 'assignment'
        );
      } else {
        filtered = savedNotifications.filter(n => 
          n.targetUser === user?.email || 
          n.targetDepartment === employeeData?.department ||
          (n.type === 'assignment' && (n.assignedTo === user?.email || n.assignedDepartment === employeeData?.department))
        );
      }
      
      setNotificationList(filtered);
      setUnreadNotifications(filtered.filter(n => !n.read).length);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification:', error);
      const updated = notificationList.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      );
      setNotificationList(updated);
      setUnreadNotifications(updated.filter(n => !n.read).length);
      localStorage.setItem('ems_notifications', JSON.stringify(updated));
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(userRole, user?.email);
      await loadNotifications();
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all:', error);
      const updated = notificationList.map(n => ({ ...n, read: true }));
      setNotificationList(updated);
      setUnreadNotifications(0);
      localStorage.setItem('ems_notifications', JSON.stringify(updated));
      toast.success('All notifications marked as read');
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm('Clear all notifications?')) return;
    try {
      await notificationService.clearAll(userRole, user?.email);
      setNotificationList([]);
      setUnreadNotifications(0);
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing:', error);
      localStorage.setItem('ems_notifications', JSON.stringify([]));
      setNotificationList([]);
      setUnreadNotifications(0);
      toast.success('All notifications cleared');
    }
  };

  const initializeSocket = (userData, role) => {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    
    socketRef.current = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      timeout: 10000
    });

    socketRef.current.on('connect', () => {
      console.log('🔌 WebSocket connected');
      setSocketConnected(true);
      socketRef.current.emit('user-connected', {
        userId: userData.id,
        employeeId: userData.employeeId,
        email: userData.email,
        role: role,
        department: employeeData?.department,
        fullName: userData.fullName
      });
    });

    socketRef.current.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected');
      setSocketConnected(false);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setSocketConnected(false);
    });

    socketRef.current.on('assignment-created', (data) => {
      console.log('📋 New assignment received:', data);
      loadCachedOrFetchAssignments(userData, role);
      loadNotifications();
      if (role !== 'admin' && (data.assignedTo === userData.email || data.assignedDepartment === employeeData?.department)) {
        toast.success(`📋 New task assigned: ${data.title}`, { duration: 5000 });
      }
    });

    socketRef.current.on('assignment-updated', (data) => {
      console.log('🔄 Assignment updated:', data);
      loadCachedOrFetchAssignments(userData, role);
      loadNotifications();
      if (role !== 'admin' && (data.assignment?.assignedTo === userData.email || data.assignment?.assignedDepartment === employeeData?.department)) {
        toast.info(data.message, { duration: 4000 });
      }
    });

    socketRef.current.on('new-notification', (notification) => {
      console.log('🔔 New notification received:', notification);
      loadNotifications();
      loadLeaveSummary();
      
      if (role === 'admin' && notification.targetRole === 'admin') {
        if (notification.type === 'leave_request') {
          toast.success(notification.message, { duration: 5000, icon: '📋' });
        } else if (notification.type === 'completion') {
          toast.success(notification.message, { duration: 6000, icon: '🎉' });
        }
      } else if (role !== 'admin' && (notification.targetUser === userData.email || notification.targetDepartment === employeeData?.department)) {
        if (notification.type === 'assignment') {
          toast.success(notification.message, { duration: 5000, icon: '📋' });
        } else if (notification.type === 'leave_response') {
          toast.success(notification.message, { duration: 5000, icon: '✅' });
          loadLeaveSummary();
        } else if (notification.type === 'update') {
          toast.info(notification.message, { duration: 4000, icon: '🔄' });
        }
      }
    });
    
    socketRef.current.on('leave-status-updated', (data) => {
      console.log('📋 Leave status updated:', data);
      loadLeaveSummary();
      loadNotifications();
      if (role !== 'admin' && data.employeeEmail === userData.email) {
        toast.success(data.message, { duration: 5000, icon: '✅' });
      }
    });
  };

  const getEmployeeNameByEmail = (email) => {
    if (!email) return 'Unknown';
    const employee = employees.find(emp => emp.email === email);
    return employee?.fullName || employee?.name || email.split('@')[0];
  };

  const addAssignment = async () => {
    if (!newAssignment.title || !newAssignment.description) {
      toast.error('Please fill all required fields');
      return;
    }

    const assignment = {
      id: Date.now().toString(),
      ...newAssignment,
      assignedBy: user?.fullName || user?.username,
      assignedByEmail: user?.email,
      status: 'Not Started',
      createdAt: new Date().toISOString(),
      deadline: newAssignment.deadline || null
    };

    try {
      await assignmentService.create(assignment);
      
      await createAdminNotification(
        `📋 New task "${newAssignment.title}" created by ${user?.fullName || user?.username}`,
        'assignment',
        assignment.id,
        null
      );
      
      if (newAssignment.assignedDepartment) {
        await createEmployeeNotification(
          `📋 New task "${newAssignment.title}" assigned to your department (${newAssignment.assignedDepartment})`,
          'assignment',
          null,
          newAssignment.assignedDepartment,
          assignment.id,
          null
        );
      } else if (newAssignment.assignedTo) {
        await createEmployeeNotification(
          `📋 New task "${newAssignment.title}" assigned to you by ${user?.fullName || user?.username}`,
          'assignment',
          newAssignment.assignedTo,
          null,
          assignment.id,
          null
        );
      }
      
      if (socketRef.current && socketConnected) {
        socketRef.current.emit('new-assignment', assignment);
      }
      
      await loadCachedOrFetchAssignments(user, userRole);
      
      setNewAssignment({
        title: '',
        description: '',
        assignedTo: '',
        assignedToName: '',
        assignedDepartment: '',
        priority: 'Medium',
        deadline: ''
      });
      setShowAssignmentForm(false);
      toast.success('Work assigned successfully!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to create assignment');
    }
  };

  const updateAssignmentStatus = async (assignmentId, newStatus) => {
    try {
      const assignment = assignments.find(a => a.id === assignmentId);
      const employeeFullName = user?.fullName || user?.username;
      
      await assignmentService.updateStatus(assignmentId, newStatus);
      
      if (newStatus === 'In Progress') {
        await createAdminNotification(
          `🔄 "${assignment.title}" has been started by ${employeeFullName}`,
          'update',
          assignmentId,
          null
        );
        
        await createEmployeeNotification(
          `🔄 You started working on "${assignment.title}"`,
          'update',
          user?.email,
          employeeData?.department,
          assignmentId,
          null
        );
      } else if (newStatus === 'Completed') {
        await createAdminNotification(
          `✅ Task "${assignment.title}" has been completed by ${employeeFullName} 🎉`,
          'completion',
          assignmentId,
          null
        );
        
        await createEmployeeNotification(
          `✅ Congratulations! You completed "${assignment.title}"! 🎉`,
          'completion',
          user?.email,
          employeeData?.department,
          assignmentId,
          null
        );
        
        toast.success(`🎉 Great job! You completed "${assignment.title}"! 🏆`, { 
          duration: 6000, 
          icon: '🏆'
        });
      }
      
      if (socketRef.current && socketConnected) {
        socketRef.current.emit('update-assignment-status', {
          assignmentId,
          status: newStatus,
          updatedBy: employeeFullName
        });
      }
      
      await loadCachedOrFetchAssignments(user, userRole);
      await loadNotifications();
      
      if (newStatus !== 'Completed') {
        toast.success(`Task marked as ${newStatus}`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to update status');
    }
  };

  const deleteAssignment = async (assignmentId) => {
    if (!window.confirm('Delete this assignment?')) return;
    try {
      await assignmentService.delete(assignmentId);
      await loadCachedOrFetchAssignments(user, userRole);
      toast.success('Deleted successfully');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to delete');
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'High': return 'bg-red-100 text-red-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Low': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusDetails = (status) => {
    const statusMap = {
      'Not Started': { color: 'bg-gray-100 text-gray-700', icon: '⭕', label: 'Not Started' },
      'In Progress': { color: 'bg-blue-100 text-blue-700', icon: '🔄', label: 'In Progress' },
      'Completed': { color: 'bg-green-100 text-green-700', icon: '✅', label: 'Completed' }
    };
    return statusMap[status] || statusMap['Not Started'];
  };

  const isAdmin = userRole === 'admin';

  const Popup = () => {
    if (!showPopup) return null;
    
    return (
      <div 
        className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-100 animate-fade-in overflow-hidden"
        style={{
          left: `${popupPosition.x}px`,
          top: `${popupPosition.y}px`,
          transform: 'translateX(-50%)',
          minWidth: '320px',
          maxWidth: '380px',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
        }}
        onMouseEnter={handlePopupMouseEnter}
        onMouseLeave={handlePopupMouseLeave}
      >
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-t border-l border-gray-100 rotate-45"></div>
        
        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-800 text-sm">{popupData.title}</h3>
            <button onClick={handleClosePopup} className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-full hover:bg-gray-200">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="py-1">
          {popupData.content.map((item, index) => (
            <div key={index} className="flex justify-between items-center px-4 py-2.5 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-600 flex items-center gap-2">
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </span>
              <span className="text-sm font-semibold" style={{ color: item.color }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const NotificationPanel = () => {
    if (!showNotificationPanel) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
        <div className="bg-white w-full max-w-md h-full shadow-xl flex flex-col">
          <div className="p-4 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">Notifications</h2>
                <p className="text-xs text-blue-100">{unreadNotifications} unread • {notificationList.length} total</p>
              </div>
              <div className="flex gap-2">
                {unreadNotifications > 0 && (
                  <button onClick={markAllAsRead} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded">Mark all read</button>
                )}
                <button onClick={() => setShowNotificationPanel(false)} className="text-white hover:bg-white/20 p-1 rounded">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {notificationList.length === 0 ? (
              <div className="text-center py-12">
                <svg className="h-16 w-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y">
                {notificationList.map(notification => {
                  const getIcon = () => {
                    switch(notification.type) {
                      case 'assignment': return '📋';
                      case 'completion': return '✅';
                      case 'update': return '🔄';
                      case 'leave_request': return '📋';
                      case 'leave_response': return '✅';
                      default: return '🔔';
                    }
                  };
                  const getBgColor = () => {
                    if (notification.read) return 'bg-white';
                    switch(notification.type) {
                      case 'assignment': return 'bg-blue-50';
                      case 'completion': return 'bg-green-50';
                      case 'update': return 'bg-yellow-50';
                      case 'leave_request': return 'bg-purple-50';
                      case 'leave_response': return 'bg-teal-50';
                      default: return 'bg-gray-50';
                    }
                  };
                  return (
                    <div 
                      key={notification.id} 
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition ${getBgColor()}`} 
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">{getIcon()}</div>
                        <div className="flex-1">
                          <p className={`text-sm ${!notification.read ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(notification.createdAt).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {notificationList.length > 0 && (
            <div className="p-3 border-t bg-gray-50">
              <button onClick={clearAllNotifications} className="w-full text-center text-sm text-red-600 hover:text-red-700 py-2">
                Clear All Notifications
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1,2,3].map(i => <div key={i} className="bg-gray-200 rounded-lg h-32"></div>)}
            </div>
            <div className="bg-gray-200 rounded-lg h-64"></div>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  if (isAdmin) {
    return (
      <div>
        <Navbar />
        <Popup />
        <div className="fixed bottom-4 left-4 z-50">
          <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full shadow-lg ${
            socketConnected ? 'bg-green-500' : 'bg-red-500'
          } text-white text-xs`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${socketConnected ? 'bg-white' : 'bg-gray-300'}`}></div>
            <span>{socketConnected ? '🟢 Live Updates Active' : '🔴 Reconnecting...'}</span>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-500 text-sm">Welcome back, {user?.fullName || user?.username}</p>
                <div className="mt-2 flex gap-2">
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">Admin</span>
                  {socketConnected && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">● Live</span>}
                </div>
              </div>
              
              <div className="relative">
                <button onClick={() => setShowNotificationPanel(!showNotificationPanel)} className="relative p-2 hover:bg-gray-100 rounded-full">
                  <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className={`bg-white rounded-xl shadow-md p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${activeCard === 'total' ? 'ring-2 ring-blue-400 shadow-xl' : ''}`}
              onMouseEnter={(e) => handleMouseEnter(e, 'total')} onMouseLeave={handleMouseLeave} onClick={(e) => handleClick(e, 'total')}>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-full p-3">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500">Total Employees</h2>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalEmployees}</p>
                </div>
              </div>
            </div>
            
            <div className={`bg-white rounded-xl shadow-md p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${activeCard === 'active' ? 'ring-2 ring-green-400 shadow-xl' : ''}`}
              onMouseEnter={(e) => handleMouseEnter(e, 'active')} onMouseLeave={handleMouseLeave} onClick={(e) => handleClick(e, 'active')}>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500">Active Employees</h2>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeEmployees}</p>
                </div>
              </div>
            </div>
            
            <div className={`bg-white rounded-xl shadow-md p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${activeCard === 'departments' ? 'ring-2 ring-purple-400 shadow-xl' : ''}`}
              onMouseEnter={(e) => handleMouseEnter(e, 'departments')} onMouseLeave={handleMouseLeave} onClick={(e) => handleClick(e, 'departments')}>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-full p-3">
                  <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h2 className="text-sm font-medium text-gray-500">Departments</h2>
                  <p className="text-3xl font-bold text-gray-900">{stats.departments.length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <button onClick={() => setShowAssignmentForm(!showAssignmentForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
              + New Assignment
            </button>
          </div>

          {showAssignmentForm && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <h3 className="font-semibold mb-3">Create New Assignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" name="title" value={newAssignment.title} onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                  className="border rounded-lg px-3 py-2 text-sm" placeholder="Task Title *" />
                <select name="assignedDepartment" value={newAssignment.assignedDepartment} onChange={(e) => setNewAssignment({...newAssignment, assignedDepartment: e.target.value, assignedTo: ''})}
                  className="border rounded-lg px-3 py-2 text-sm">
                  <option value="">Select Department</option>
                  {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>
                <select name="assignedTo" value={newAssignment.assignedTo} onChange={(e) => setNewAssignment({...newAssignment, assignedTo: e.target.value})}
                  className="border rounded-lg px-3 py-2 text-sm" disabled={!newAssignment.assignedDepartment}>
                  <option value="">Select Employee (Optional)</option>
                  {employees.filter(emp => emp.department === newAssignment.assignedDepartment).map(emp => (
                    <option key={emp.id} value={emp.email}>{emp.fullName || emp.name}</option>
                  ))}
                </select>
                <select name="priority" value={newAssignment.priority} onChange={(e) => setNewAssignment({...newAssignment, priority: e.target.value})}
                  className="border rounded-lg px-3 py-2 text-sm">
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
                <textarea name="description" value={newAssignment.description} onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                  className="border rounded-lg px-3 py-2 text-sm md:col-span-2" rows="2" placeholder="Task Description *"></textarea>
                <div className="md:col-span-2 flex justify-end gap-2">
                  <button onClick={() => setShowAssignmentForm(false)} className="px-3 py-1 border rounded-lg text-sm">Cancel</button>
                  <button onClick={addAssignment} className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm">Assign Task</button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="font-semibold">Recent Assignments</h2>
              <p className="text-xs text-gray-500 mt-1">Showing all tasks assigned to employees</p>
            </div>
            <div className="divide-y">
              {assignments.slice(0, 10).map(assignment => {
                const statusDetails = getStatusDetails(assignment.status);
                return (
                  <div key={assignment.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="font-medium text-sm">{assignment.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(assignment.priority)}`}>{assignment.priority}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusDetails.color}`}>{statusDetails.icon} {statusDetails.label}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          <span>📋 Assigned by: <span className="font-medium text-gray-700">{assignment.assignedBy}</span></span>
                          {assignment.assignedDepartment && <span>🏢 Department: <span className="font-medium text-gray-700">{assignment.assignedDepartment}</span></span>}
                          {assignment.assignedTo && <span>👤 Assigned to: <span className="font-medium text-gray-700">{getEmployeeNameByEmail(assignment.assignedTo)}</span></span>}
                          {assignment.completedAt && <span className="text-green-600">✅ Completed on: {new Date(assignment.completedAt).toLocaleString()}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        {assignment.status !== 'Completed' && (
                          <button onClick={() => updateAssignmentStatus(assignment.id, 'Completed')} className="text-green-600 text-xs hover:text-green-800 px-2 py-1 rounded border transition">
                            Mark Complete
                          </button>
                        )}
                        <button onClick={() => deleteAssignment(assignment.id)} className="text-red-500 hover:text-red-700 transition">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {assignments.length === 0 && <div className="p-8 text-center text-gray-500 text-sm">No assignments yet. Create one above.</div>}
            </div>
          </div>
        </div>
        <NotificationPanel />
      </div>
    );
  }

  // Employee Dashboard
  return (
    <div>
      <Navbar />
      <Popup />
      <div className="fixed bottom-4 left-4 z-50">
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full shadow-lg ${
          socketConnected ? 'bg-green-500' : 'bg-red-500'
        } text-white text-xs`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${socketConnected ? 'bg-white' : 'bg-gray-300'}`}></div>
          <span>{socketConnected ? '🟢 Live Updates Active' : '🔴 Reconnecting...'}</span>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">Employee Dashboard</h1>
              <p className="text-gray-500 text-sm">Welcome back, {employeeData?.name || user?.fullName}</p>
              <div className="mt-2 flex gap-2">
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Employee</span>
                {socketConnected && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">● Live</span>}
              </div>
            </div>
            <div className="relative">
              <button onClick={() => setShowNotificationPanel(!showNotificationPanel)} className="relative p-2 hover:bg-gray-100 rounded-full">
                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 animate-pulse">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Leave Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-yellow-50 rounded-lg p-3 text-center cursor-pointer hover:bg-yellow-100 transition" onClick={() => navigate('/my-leaves')}>
            <p className="text-2xl font-bold text-yellow-600">{leaveSummary.pending}</p>
            <p className="text-xs text-gray-600">Pending Leaves</p>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center cursor-pointer hover:bg-green-100 transition" onClick={() => navigate('/my-leaves')}>
            <p className="text-2xl font-bold text-green-600">{leaveSummary.approved}</p>
            <p className="text-xs text-gray-600">Approved Leaves</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center cursor-pointer hover:bg-red-100 transition" onClick={() => navigate('/my-leaves')}>
            <p className="text-2xl font-bold text-red-600">{leaveSummary.rejected}</p>
            <p className="text-xs text-gray-600">Rejected Leaves</p>
          </div>
        </div>

        {/* Employee Info Card with Employee ID */}
        {employeeData && (
          <div className="bg-white rounded-lg shadow p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs">Employee ID</p>
                <p className="font-mono font-bold text-blue-600">{employeeData.employeeId || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Full Name</p>
                <p className="font-medium">{employeeData.fullName || employeeData.name || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Gender</p>
                <p className="font-medium flex items-center gap-1">
                  <span>{employeeData.gender === 'Male' ? '👨' : employeeData.gender === 'Female' ? '👩' : '👤'}</span>
                  <span>{employeeData.gender || '-'}</span>
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Department</p>
                <p className="font-medium">{employeeData.department || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Position</p>
                <p className="font-medium">{employeeData.position || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Email</p>
                <p className="font-medium text-sm">{employeeData.email}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Phone</p>
                <p className="font-medium">{employeeData.phoneNumber || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Location</p>
                <p className="font-medium">{employeeData.location || '-'}</p>
              </div>
              <div className="col-span-2">
                <Link to="/profile" className="text-blue-600 text-xs mt-2 inline-block">Edit Profile →</Link>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link to="/apply-leave" className="bg-green-50 p-3 rounded-lg hover:bg-green-100 transition text-center">
            <span className="text-xl mr-2">📋</span>
            <span className="text-green-700 font-medium text-sm">Apply Leave</span>
          </Link>
          <Link to="/my-leaves" className="bg-blue-50 p-3 rounded-lg hover:bg-blue-100 transition text-center">
            <span className="text-xl mr-2">📅</span>
            <span className="text-blue-700 font-medium text-sm">My Leaves</span>
          </Link>
        </div>

        {/* My Tasks */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="font-semibold">My Tasks</h2>
            <p className="text-xs text-gray-500 mt-1">Tasks assigned to you or your department</p>
            {socketConnected && (
              <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                Real-time updates active
              </p>
            )}
          </div>
          <div className="divide-y">
            {assignments.length > 0 ? (
              assignments.map(assignment => {
                const statusDetails = getStatusDetails(assignment.status);
                return (
                  <div key={assignment.id} className="p-4 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="font-medium text-sm">{assignment.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(assignment.priority)}`}>{assignment.priority} Priority</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusDetails.color}`}>{statusDetails.icon} {statusDetails.label}</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{assignment.description}</p>
                        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                          <span>📋 Assigned by: {assignment.assignedBy}</span>
                          {assignment.deadline && <span>📅 Deadline: {new Date(assignment.deadline).toLocaleDateString()}</span>}
                        </div>
                      </div>
                      {assignment.status !== 'Completed' && (
                        <div className="flex gap-2 ml-4">
                          {assignment.status === 'Not Started' && (
                            <button onClick={() => updateAssignmentStatus(assignment.id, 'In Progress')} className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-700 transition">
                              Start Task
                            </button>
                          )}
                          {assignment.status === 'In Progress' && (
                            <button onClick={() => updateAssignmentStatus(assignment.id, 'Completed')} className="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700 transition">
                              Complete Task
                            </button>
                          )}
                        </div>
                      )}
                      {assignment.status === 'Completed' && (
                        <div className="ml-4"><span className="text-green-600 text-xs flex items-center gap-1">✅ Completed</span></div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm">
                <svg className="h-12 w-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>No tasks assigned yet</p>
                <p className="text-xs mt-1">Tasks will appear here in real-time when assigned by admin</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <NotificationPanel />
    </div>
  );
};

export default Dashboard;