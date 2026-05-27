// client/src/components/EmployeeList.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { employeeService } from '../services/api';
import Navbar from './Navbar.jsx';
import toast from 'react-hot-toast';

const EmployeeList = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await employeeService.getAll({ limit: 1000 });
      if (response.data && response.data.employees) {
        setEmployees(response.data.employees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      // Fallback to localStorage directly
      const employees = JSON.parse(localStorage.getItem('ems_employees') || '[]');
      setEmployees(employees);
      toast.error('Failed to fetch employees from API, using local data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const employees = JSON.parse(localStorage.getItem('ems_employees') || '[]');
      const uniqueDepts = [...new Set(employees.map(emp => emp.department).filter(Boolean))];
      setDepartments(uniqueDepts);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const handleDelete = async (id, email) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        // Delete from employees
        let employees = JSON.parse(localStorage.getItem('ems_employees') || '[]');
        const updatedEmployees = employees.filter(emp => emp.id !== id);
        localStorage.setItem('ems_employees', JSON.stringify(updatedEmployees));
        
        // Delete from users
        let users = JSON.parse(localStorage.getItem('ems_users') || '[]');
        const updatedUsers = users.filter(u => u.email !== email);
        localStorage.setItem('ems_users', JSON.stringify(updatedUsers));
        
        // Delete from assignments if any
        let assignments = JSON.parse(localStorage.getItem('ems_assignments') || '[]');
        const updatedAssignments = assignments.filter(a => a.assignedTo !== email);
        localStorage.setItem('ems_assignments', JSON.stringify(updatedAssignments));
        
        toast.success('Employee deleted successfully');
        fetchEmployees(); // Refresh the list
      } catch (error) {
        console.error('Error deleting employee:', error);
        toast.error('Failed to delete employee');
      }
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Active': return 'bg-green-100 text-green-800';
      case 'Inactive': return 'bg-red-100 text-red-800';
      case 'On Leave': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGenderIcon = (gender) => {
    switch(gender) {
      case 'Male': return '👨';
      case 'Female': return '👩';
      case 'Other': return '👤';
      default: return '❓';
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      (emp.employeeId || '').toLowerCase().includes(search.toLowerCase()) ||
      (emp.name || emp.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
      (emp.email || '').toLowerCase().includes(search.toLowerCase());
    const matchesDepartment = !departmentFilter || emp.department === departmentFilter;
    const matchesStatus = !statusFilter || emp.status === statusFilter;
    return matchesSearch && matchesDepartment && matchesStatus;
  });

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

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
            <p className="text-sm text-gray-500 mt-1">Manage all employee records</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              to="/employees/add"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              + Add Employee
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by ID, name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="On Leave">On Leave</option>
          </select>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Emp ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-blue-600">
                      {employee.employeeId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.fullName || employee.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        {getGenderIcon(employee.gender)} {employee.gender || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{employee.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{employee.department || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{employee.position || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{employee.phoneNumber || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(employee.status)}`}>
                        {employee.status || 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link to={`/employees/edit/${employee.id}`} className="text-blue-600 hover:text-blue-900 mr-3">
                        Edit
                      </Link>
                      <button onClick={() => handleDelete(employee.id, employee.email)} className="text-red-600 hover:text-red-900">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredEmployees.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No employees found
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeList;