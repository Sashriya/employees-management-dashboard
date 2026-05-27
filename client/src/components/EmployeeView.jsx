import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { employeeService } from '../services/api';
import Navbar from './Navbar';

const EmployeeView = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const fetchEmployee = async () => {
    try {
      const response = await employeeService.getById(id);
      setEmployee(response.data);
    } catch (error) {
      toast.error('Failed to fetch employee details');
      navigate('/employees');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading employee details...</div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Employee not found</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700">
            <h1 className="text-2xl font-bold text-white">Employee Details</h1>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500">Full Name</label>
                <p className="mt-1 text-lg font-semibold text-gray-900">
                  {employee.firstName} {employee.lastName}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1 text-gray-900">{employee.email}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Phone</label>
                <p className="mt-1 text-gray-900">{employee.phone}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Department</label>
                <p className="mt-1">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {employee.department}
                  </span>
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Position</label>
                <p className="mt-1 text-gray-900">{employee.position}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Salary</label>
                <p className="mt-1 text-gray-900">${employee.salary.toLocaleString()}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Hire Date</label>
                <p className="mt-1 text-gray-900">
                  {format(new Date(employee.hireDate), 'MMMM dd, yyyy')}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                <p className="mt-1">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    employee.status === 'Active' ? 'bg-green-100 text-green-800' :
                    employee.status === 'Inactive' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {employee.status}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => navigate('/employees')}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Back to List
              </button>
              <button
                onClick={() => navigate(`/employees/edit/${employee.id || employee._id}`)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit Employee
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeView;