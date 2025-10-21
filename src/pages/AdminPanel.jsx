import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api.js';
import AdminSettingsModal from '../components/AdminSettingsModal.jsx';

const FORM_DEFAULTS = {
  email: '',
  password: '',
  role: 'opener',
  agentName: '',
  firstName: '',
  lastName: ''
};

const ROLE_BADGES = {
  admin: 'bg-rose-100 text-rose-700',
  intake: 'bg-sky-100 text-sky-700',
  opener: 'bg-amber-100 text-amber-700',
  agent: 'bg-slate-100 text-slate-600'
};

export default function AdminPanel() {
  const [employees, setEmployees] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resettingEmployee, setResettingEmployee] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [formData, setFormData] = useState(FORM_DEFAULTS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('mapping');
  const [searchParams, setSearchParams] = useSearchParams();

  const settingsParam = searchParams.get('settings');

  const roleCounts = useMemo(() => {
    return employees.reduce(
      (acc, employee) => {
        const role = employee.role || 'agent';
        acc.total += 1;
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      },
      { total: 0, admin: 0, intake: 0, opener: 0, agent: 0 }
    );
  }, [employees]);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (!settingsParam) return;

    setSettingsTab(settingsParam === 'access' ? 'access' : 'mapping');
    setShowSettings(true);
  }, [settingsParam]);

  const closeSettings = () => {
    setShowSettings(false);
    const next = new URLSearchParams(searchParams);
    next.delete('settings');
    setSearchParams(next, { replace: true });
  };

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/admin/employees');
      if (Array.isArray(data)) {
        setEmployees(data);
      } else if (Array.isArray(data?.employees)) {
        setEmployees(data.employees);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      setError('Failed to load employees. Please try again.');
      setEmployees([]);
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
      setFormData(FORM_DEFAULTS);
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
        password: '',
        role: employee.role || 'opener',
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
      setFormData(FORM_DEFAULTS);
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
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl md:text-5xl font-bold">
                Admin Panel
              </h1>
              <button
                onClick={() => {
                  setSettingsTab('mapping');
                  setShowSettings(true);
                  const next = new URLSearchParams(searchParams);
                  next.set('settings', 'mapping');
                  setSearchParams(next, { replace: true });
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl transition hover:bg-white/20"
                aria-label="Open admin settings"
              >
                ⚙️
              </button>
            </div>
            <p className="mt-4 text-xl text-teal-100">
              Manage your team, monitor performance, and export data from your FlashDash CRM.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
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
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              ROLE_BADGES[employee.role] || ROLE_BADGES.agent
                            }`}
                          >
                            {employee.role || 'agent'}
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
                <span className="text-gray-600">Active Users</span>
                <span className="font-semibold text-emerald-600">{roleCounts.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Admins</span>
                <span className="font-semibold text-gray-900">{roleCounts.admin}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Intake Specialists</span>
                <span className="font-semibold text-gray-900">{roleCounts.intake}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Openers</span>
                <span className="font-semibold text-gray-900">{roleCounts.opener + roleCounts.agent}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur">
          <div className="w-full max-w-3xl rounded-3xl border border-gray-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Add New Team Member</h3>
                <p className="text-sm text-gray-500">Capture the basics so we can provision the right access.</p>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-gray-700">
                  <span>Agent Display Name *</span>
                  <input
                    type="text"
                    required
                    value={formData.agentName}
                    onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                    placeholder="e.g. Bella"
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <span className="mt-1 block text-xs text-gray-500">Appears on dashboards and call scripts.</span>
                </label>
                <label className="text-sm font-medium text-gray-700">
                  <span>Role *</span>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {!['admin', 'intake', 'opener'].includes(formData.role) && (
                      <option value={formData.role}>{formData.role}</option>
                    )}
                    <option value="admin">Admin</option>
                    <option value="intake">Intake</option>
                    <option value="opener">Opener</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-gray-700">
                  <span>First Name *</span>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  <span>Last Name *</span>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  <span>Email *</span>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="agent@flashdash.com"
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  <span>Temporary Password *</span>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 6 characters"
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </label>
              </div>
              <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-xl bg-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating…' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Employee Modal */}
      {showEditForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur">
          <div className="w-full max-w-3xl rounded-3xl border border-gray-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Edit Team Member</h3>
                <p className="text-sm text-gray-500">Update roles or details without disrupting access.</p>
              </div>
              <button
                onClick={() => setShowEditForm(false)}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdate} className="px-6 py-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="text-sm font-medium text-gray-700">
                  <span>Agent Display Name *</span>
                  <input
                    type="text"
                    required
                    value={formData.agentName}
                    onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  <span>Role *</span>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {!['admin', 'intake', 'opener'].includes(formData.role) && (
                      <option value={formData.role}>{formData.role}</option>
                    )}
                    <option value="admin">Admin</option>
                    <option value="intake">Intake</option>
                    <option value="opener">Opener</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-gray-700">
                  <span>First Name *</span>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  <span>Last Name *</span>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700 md:col-span-2">
                  <span>Email *</span>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </label>
                <label className="text-sm font-medium text-gray-700 md:col-span-2">
                  <span>Update Password</span>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Leave blank to keep current password"
                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </label>
              </div>
              <div className="mt-6 flex flex-col gap-3 md:flex-row md:justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="rounded-xl border border-gray-200 px-5 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-xl bg-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving…' : 'Update Employee'}
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
      <AdminSettingsModal open={showSettings} onClose={closeSettings} initialTab={settingsTab} />
    </div>
  );
}
