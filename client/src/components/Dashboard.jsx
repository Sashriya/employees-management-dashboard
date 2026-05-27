import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { employeeService } from '../services/api.js';
import Navbar from './Navbar.jsx';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    departments: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await employeeService.getAll({ limit: 100 });
      const employees = response.data.employees;
      
      const departmentCount = {};
      let activeCount = 0;
      
      employees.forEach(emp => {
        if (emp.status === 'Active') activeCount++;
        departmentCount[emp.department] = (departmentCount[emp.department] || 0) + 1;
      });
      
      setStats({
        totalEmployees: response.data.total,
        activeEmployees: activeCount,
        departments: Object.entries(departmentCount).map(([name, count]) => ({ name, count })),
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="card hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 rounded-full p-3">
                <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-medium text-gray-600">Total Employees</h2>
                <p className="text-3xl font-bold text-gray-900">{stats.totalEmployees}</p>
              </div>
            </div>
          </div>
          
          <div className="card hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-full p-3">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-medium text-gray-600">Active Employees</h2>
                <p className="text-3xl font-bold text-gray-900">{stats.activeEmployees}</p>
              </div>
            </div>
          </div>
          
          <div className="card hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-full p-3">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="ml-4">
                <h2 className="text-lg font-medium text-gray-600">Departments</h2>
                <p className="text-3xl font-bold text-gray-900">{stats.departments.length}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Department Distribution</h2>
          <div className="space-y-3">
            {stats.departments.map((dept, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">{dept.name}</span>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 rounded-full h-2 transition-all duration-500"
                      style={{ width: `${(dept.count / stats.totalEmployees) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-gray-600">{dept.count} employees</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;