import { useEffect, useState } from 'react';
import api from '../api.js';

const PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'reports', label: 'Reports' },
  { key: 'leadIntake', label: 'Lead Intake Form' },
  { key: 'userMapping', label: 'User Mapping' },
  { key: 'accessControl', label: 'Access Control' }
];

const DEFAULT_RULES = {
  admin: {
    dashboard: true,
    reports: true,
    leadIntake: true,
    userMapping: true,
    accessControl: true
  },
  opener: {
    dashboard: true,
    reports: true,
    leadIntake: false,
    userMapping: false,
    accessControl: false
  },
  intake: {
    dashboard: true,
    reports: true,
    leadIntake: true,
    userMapping: false,
    accessControl: false
  }
};

export default function AccessControl() {
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchAccess = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get('/api/admin/access');
        if (data && typeof data === 'object') {
          setRules((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        setError('Falling back to default access rules until the API responds.');
      } finally {
        setLoading(false);
      }
    };

    fetchAccess();
  }, []);

  const toggleRule = (role, permission) => {
    setRules((prev) => ({
      ...prev,
      [role]: {
        ...((DEFAULT_RULES[role]) || {}),
        ...prev[role],
        [permission]: !prev[role]?.[permission]
      }
    }));
    setSuccess(false);
  };

  const saveChanges = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      await api.post('/api/admin/access', rules);
      setSuccess(true);
    } catch (err) {
      setError('Unable to persist access changes. Please retry.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Access Control</h1>
          <p className="text-sm text-gray-500 mt-2">
            Configure which routes are available to each role across the FlashDash platform.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={saveChanges}
            disabled={saving}
            className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Access policies updated successfully.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {Object.entries(rules).map(([role, permissions]) => (
          <div key={role} className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 capitalize">{role}</h2>
              {loading && (
                <span className="inline-flex h-2 w-2 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
              )}
            </div>
            <div className="space-y-3">
              {PERMISSIONS.map((permission) => (
                <label key={permission.key} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50">
                  <span>{permission.label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(permissions?.[permission.key])}
                    onChange={() => toggleRule(role, permission.key)}
                    className="h-4 w-4 rounded border-gray-300 text-teal-500 focus:ring-teal-400"
                  />
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
