import { useState, useEffect } from 'react';
import api from '../api.js';

export default function AdminPanel() {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resettingEmployee, setResettingEmployee] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'agent',
    agentName: '',
    firstName: '',
    lastName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Fetching employees from /admin/employees...');
      const response = await api.get('/admin/employees');
      console.log('📡 API Response:', response);
      console.log('📊 Response data:', response.data);
      console.log('🔢 Response status:', response.status);
      
      // Ensure employees is always an array
      if (response.data && Array.isArray(response.data)) {
        console.log('✅ Setting employees array:', response.data);
        setEmployees(response.data);
      } else if (response.data && response.data.employees && Array.isArray(response.data.employees)) {
        console.log('✅ Setting employees from nested property:', response.data.employees);
        setEmployees(response.data.employees);
      } else {
        console.warn('⚠️ API returned non-array data:', response.data);
        console.warn('📝 Data type:', typeof response.data);
        console.warn('🔍 Data structure:', response.data);
        setEmployees([]);
      }
    } catch (err) {
      console.error('❌ Failed to fetch employees:', err);
      console.error('🚨 Error response:', err.response);
      console.error('📊 Error status:', err.response?.status);
      console.error('📝 Error data:', err.response?.data);
      setError('Failed to load employees. Please try again.');
      setEmployees([]); // Ensure it's always an array
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/admin/employees', formData);
      setSuccess('Employee created successfully!');
      setFormData({ email: '', password: '', role: 'agent', agentName: '', firstName: '', lastName: '' });
      setShowForm(false);
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      email: employee.email,
      password: '', // Don't pre-fill password
      role: employee.role,
      agentName: employee.agentName || '',
      firstName: employee.firstName || '',
      lastName: employee.lastName || ''
    });
    setShowEditForm(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const updateData = { ...formData };
      if (!updateData.password) {
        delete updateData.password; // Don't send empty password
      }
      await api.put(`/admin/employees/${editingEmployee.id}`, updateData);
      setSuccess('Employee updated successfully!');
      setShowEditForm(false);
      setEditingEmployee(null);
      setFormData({ email: '', password: '', role: 'agent', agentName: '', firstName: '', lastName: '' });
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.put(`/admin/employees/${resettingEmployee.id}/reset-password`, {
        newPassword: newPassword
      });
      setSuccess('Password reset successfully!');
      setShowResetPassword(false);
      setResettingEmployee(null);
      setNewPassword('');
      fetchEmployees();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (employeeId) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await api.delete(`/admin/employees/${employeeId}`);
        setSuccess('Employee deleted successfully!');
        fetchEmployees();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete employee');
      }
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await api.get('/admin/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'submissions.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="gradient-bg rounded-3xl p-8 text-white shadow-2xl">
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Admin Panel 🛠️
          </h1>
          <p className="text-xl text-teal-100 mb-6">
            Manage your team, monitor performance, and export data from your FlashDash CRM.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setShowForm(true)}
              className="btn-primary"
            >
              👥 Add New Employee
            </button>
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="btn-secondary"
            >
              {isExporting ? '⏳ Exporting...' : '📊 Export Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="card border-l-4 border-emerald-500 bg-emerald-50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-emerald-800">{success}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setSuccess('')}
                className="text-emerald-500 hover:text-emerald-700"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="card border-l-4 border-red-500 bg-red-50">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError('')}
                className="text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Employee List */}
        <div className="lg:col-span-2">
          <div className="card">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Employee Management</h3>
            
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading employees...</p>
              </div>
            ) : employees.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">👥</div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Employees Yet</h4>
                <p className="text-gray-600 mb-4">Get started by adding your first team member.</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-primary"
                >
                  Add First Employee
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div
                    key={employee.id}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                          <span className="text-teal-600 font-semibold text-sm">
                            {employee.agentName ? employee.agentName.charAt(0).toUpperCase() : 
                             employee.firstName ? employee.firstName.charAt(0).toUpperCase() : 
                             employee.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {employee.agentName || employee.firstName || 'N/A'}
                            {employee.lastName && ` ${employee.lastName}`}
                          </h4>
                          <p className="text-sm text-gray-600">{employee.email}</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            employee.role === 'admin' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {employee.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(employee)}
                        className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit employee"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          setResettingEmployee(employee);
                          setShowResetPassword(true);
                        }}
                        className="p-2 text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors"
                        title="Reset password"
                      >
                        🔑
                      </button>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete employee"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Agents</span>
                <span className="font-semibold text-gray-900">
                  {employees.filter(e => e.role === 'agent').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Admins</span>
                <span className="font-semibold text-gray-900">
                  {employees.filter(e => e.role === 'admin').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Active Users</span>
                <span className="font-semibold text-emerald-600">
                  {employees.length}
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => setShowForm(true)}
                className="w-full btn-primary text-sm py-2"
              >
                ➕ Add Employee
              </button>
              <button 
                onClick={handleExport}
                disabled={isExporting}
                className="w-full btn-secondary text-sm py-2"
              >
                📊 Export Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full mx-4 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Add New Employee</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Agent First Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.agentName}
                  onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                  placeholder="Enter agent's first name"
                  className="input-field"
                />
              </div>

              {/* First Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Enter first name"
                  className="input-field"
                />
              </div>

              {/* Last Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Enter last name"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="employee@company.com"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input-field"
                >
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary"
                >
                  {isSubmitting ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full mx-4 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Edit Employee</h3>
              <button
                onClick={() => setShowEditForm(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              {/* Agent First Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.agentName}
                  onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                  placeholder="Enter agent's first name"
                  className="input-field"
                />
              </div>

              {/* First Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Enter first name"
                  className="input-field"
                />
              </div>

              {/* Last Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Enter last name"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="employee@company.com"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Leave blank to keep current password"
                  className="input-field"
                />
                <p className="text-xs text-gray-500 mt-1">Leave blank to keep current password</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input-field"
                >
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary"
                >
                  {isSubmitting ? 'Updating...' : 'Update Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPassword && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full mx-4 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Reset Password</h3>
              <button
                onClick={() => setShowResetPassword(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="input-field"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowResetPassword(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 btn-primary"
                >
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
