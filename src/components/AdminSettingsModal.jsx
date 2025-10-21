import { useEffect, useMemo, useState } from 'react';
import api from '../api.js';

const TABS = [
  { id: 'mapping', label: 'User Mapping' },
  { id: 'access', label: 'Access Control' }
];

const PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'reports', label: 'Reports' },
  { key: 'leadIntake', label: 'Lead Intake' },
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

function buildMappingRows(forthUsers, flashUsers, mappings) {
  const flashLookup = new Map(flashUsers.map((user) => [user.id, user.name]));
  const mappingLookup = new Map(
    mappings.map((entry) => [entry.forthUserId, entry])
  );
  const forthIds = new Set(forthUsers.map((user) => user.id));

  const baseRows = forthUsers.map((user) => {
    const mapping = mappingLookup.get(user.id);
    const flashUserName = mapping ? mapping.flashUser || flashLookup.get(mapping.flashUserId) : '—';

    return {
      id: user.id,
      forthName: user.name,
      flashUserId: mapping?.flashUserId || '',
      flashName: flashUserName || '—',
      status: mapping ? 'mapped' : 'pending'
    };
  });

  const extraRows = mappings
    .filter((entry) => !forthIds.has(entry.forthUserId) && entry.forthUser)
    .map((entry) => ({
      id: entry.forthUserId,
      forthName: entry.forthUser,
      flashUserId: entry.flashUserId,
      flashName: entry.flashUser || flashLookup.get(entry.flashUserId) || '—',
      status: 'mapped'
    }));

  return [...baseRows, ...extraRows].sort((a, b) => a.forthName.localeCompare(b.forthName));
}

export default function AdminSettingsModal({ open, onClose, initialTab = 'mapping' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Mapping state
  const [forthUsers, setForthUsers] = useState([]);
  const [flashUsers, setFlashUsers] = useState([]);
  const [mappingRows, setMappingRows] = useState([]);
  const [mappingLoading, setMappingLoading] = useState(false);
  const [mappingSaving, setMappingSaving] = useState(false);
  const [mappingDeletingId, setMappingDeletingId] = useState('');
  const [mappingError, setMappingError] = useState('');
  const [mappingInfo, setMappingInfo] = useState('');
  const [selectedForth, setSelectedForth] = useState('');
  const [selectedFlash, setSelectedFlash] = useState('');

  // Access control state
  const [accessRules, setAccessRules] = useState(DEFAULT_RULES);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessSaving, setAccessSaving] = useState(false);
  const [accessMessage, setAccessMessage] = useState('');
  const [accessError, setAccessError] = useState('');

  useEffect(() => {
    if (!open) return;

    setActiveTab(initialTab);
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;

    const fetchMapping = async () => {
      setMappingLoading(true);
      setMappingError('');
      setMappingInfo('');

      try {
        const [forthRes, flashRes, mappingRes] = await Promise.all([
          api.get('/api/forthcrm/users'),
          api.get('/api/users'),
          api.get('/api/forthcrm/mapping/get').catch(() => api.get('/api/forthcrm/mapping'))
        ]);

        const forthRecords = (forthRes.data || []).map((user) => ({
          id: user.id || user.userId || user.uuid,
          name: user.name || user.fullName || user.email || 'Forth User'
        })).filter((user) => user.id);

        const flashRecords = (flashRes.data || []).map((user) => ({
          id: user.id || user.userId || user.uuid,
          name: user.name || user.fullName || user.email || 'FlashDash User'
        })).filter((user) => user.id);

        const mappingRecords = (mappingRes.data || []).map((entry) => ({
          id: entry.id || `${entry.forthUserId}-${entry.flashUserId || 'unmapped'}`,
          forthUserId: entry.forthUserId || entry.forth_id || entry.forthUser?.id,
          flashUserId: entry.flashUserId || entry.flash_id || entry.flashUser?.id,
          forthUser: entry.forthUser || entry.forthUserName || entry.forth_name || entry.forthUserEmail,
          flashUser: entry.flashUser || entry.flashUserName || entry.flash_name || entry.flashUserEmail
        })).filter((entry) => entry.forthUserId);

        setForthUsers(forthRecords);
        setFlashUsers(flashRecords);
        setMappingRows(buildMappingRows(forthRecords, flashRecords, mappingRecords));

        if (!mappingRecords.length) {
          setMappingInfo('No mappings found yet. Use the form below to connect users.');
        }
      } catch (err) {
        setMappingError('Unable to load mapping data. Showing cached placeholders.');
        const fallbackForth = [
          { id: 'forth-1', name: 'Bella Sterling' },
          { id: 'forth-2', name: 'Kayden Young' }
        ];
        const fallbackFlash = [
          { id: 'flash-1', name: 'Bella' }
        ];
        const fallbackMappings = [
          {
            id: 'forth-1-flash-1',
            forthUserId: 'forth-1',
            flashUserId: 'flash-1',
            forthUser: 'Bella Sterling',
            flashUser: 'Bella'
          }
        ];
        setForthUsers(fallbackForth);
        setFlashUsers(fallbackFlash);
        setMappingRows(buildMappingRows(fallbackForth, fallbackFlash, fallbackMappings));
      } finally {
        setMappingLoading(false);
      }
    };

    const fetchAccess = async () => {
      setAccessLoading(true);
      setAccessError('');
      setAccessMessage('');

      try {
        const { data } = await api.get('/api/admin/access');
        if (data && typeof data === 'object') {
          setAccessRules((prev) => ({
            ...prev,
            ...data
          }));
        }
      } catch (err) {
        setAccessError('Using default access rules until the API responds.');
      } finally {
        setAccessLoading(false);
      }
    };

    fetchMapping();
    fetchAccess();
  }, [open]);

  const activeMapping = useMemo(() => {
    if (!selectedForth) return null;
    return mappingRows.find((row) => row.id === selectedForth) || null;
  }, [mappingRows, selectedForth]);

  const beginMapping = (forthId) => {
    setSelectedForth(forthId);
    const current = mappingRows.find((row) => row.id === forthId);
    setSelectedFlash(current?.flashUserId || '');
    setMappingInfo('');
    setMappingError('');
  };

  const saveMapping = async () => {
    if (!selectedForth || !selectedFlash) return;

    setMappingSaving(true);
    setMappingError('');
    setMappingInfo('');

    try {
      await api.post('/api/forthcrm/mapping/set', {
        forthUserId: selectedForth,
        flashUserId: selectedFlash
      });

      const flashName = flashUsers.find((user) => user.id === selectedFlash)?.name || 'FlashDash User';

      setMappingRows((prev) => {
        const existing = prev.find((row) => row.id === selectedForth);
        const updatedRow = {
          id: selectedForth,
          forthName: existing?.forthName || forthUsers.find((user) => user.id === selectedForth)?.name || 'Forth User',
          flashUserId: selectedFlash,
          flashName,
          status: 'mapped'
        };

        const others = prev.filter((row) => row.id !== selectedForth);
        return [...others, updatedRow].sort((a, b) => a.forthName.localeCompare(b.forthName));
      });

      setMappingInfo('Mapping saved.');
      setSelectedForth('');
      setSelectedFlash('');
    } catch (err) {
      setMappingError('Unable to save mapping right now. Please retry shortly.');
    } finally {
      setMappingSaving(false);
    }
  };

  const deleteMapping = async (forthId) => {
    if (!forthId) return;

    setMappingDeletingId(forthId);
    setMappingError('');
    setMappingInfo('');

    try {
      await api.post('/api/forthcrm/mapping/delete', { forthUserId: forthId });

      setMappingRows((prev) => {
        const row = prev.find((item) => item.id === forthId);
        const forthRecord = forthUsers.find((user) => user.id === forthId);

        if (!forthRecord && row) {
          return prev
            .filter((item) => item.id !== forthId)
            .sort((a, b) => a.forthName.localeCompare(b.forthName));
        }

        if (!forthRecord && !row) {
          return prev;
        }

        const updated = prev.map((item) => {
          if (item.id !== forthId) {
            return item;
          }

          const forthName = forthRecord?.name || row?.forthName || 'Forth User';

          return {
            id: forthId,
            forthName,
            flashUserId: '',
            flashName: '—',
            status: 'pending'
          };
        });

        return updated.sort((a, b) => a.forthName.localeCompare(b.forthName));
      });

      if (selectedForth === forthId) {
        setSelectedForth('');
        setSelectedFlash('');
      }

      setMappingInfo('Mapping removed.');
    } catch (err) {
      setMappingError('Unable to remove mapping right now. Please retry shortly.');
    } finally {
      setMappingDeletingId('');
    }
  };

  const toggleRule = (role, permission) => {
    setAccessRules((prev) => ({
      ...prev,
      [role]: {
        ...(prev[role] || {}),
        [permission]: !prev[role]?.[permission]
      }
    }));
    setAccessMessage('');
  };

  const saveAccess = async () => {
    setAccessSaving(true);
    setAccessError('');
    setAccessMessage('');

    try {
      await api.post('/api/admin/access/update', accessRules);
      setAccessMessage('Access policies updated.');
    } catch (err) {
      setAccessError('Unable to persist access changes. Please retry.');
    } finally {
      setAccessSaving(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-6">
      <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Admin Settings</h2>
            <p className="text-sm text-gray-500">Manage mappings and access in one place.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center gap-3 border-b border-gray-100 px-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative -mb-px px-4 py-3 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'text-teal-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute inset-x-2 -bottom-[1px] h-0.5 bg-teal-500" aria-hidden />
              )}
            </button>
          ))}
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          {activeTab === 'mapping' && (
            <div className="space-y-6">
              {mappingError && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
                  {mappingError}
                </p>
              )}
              {mappingInfo && (
                <p className="text-sm text-gray-500">{mappingInfo}</p>
              )}

              <div className="overflow-x-auto rounded-2xl border border-gray-100">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Forth User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Flash User
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {mappingLoading ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500">
                          Loading mapping data...
                        </td>
                      </tr>
                    ) : mappingRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-500">
                          No ForthCRM users found.
                        </td>
                      </tr>
                    ) : (
                      mappingRows.map((row) => (
                        <tr key={row.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.forthName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{row.flashName}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {row.status === 'mapped' ? (
                              <span className="inline-flex items-center gap-2 text-emerald-600">
                                <span aria-hidden>✅</span> Mapped
                              </span>
                            ) : (
                              <span className="text-gray-500">Set User</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {row.status === 'mapped' ? (
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  disabled
                                  className="inline-flex items-center rounded-lg border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-500"
                                >
                                  Mapped
                                </button>
                                <button
                                  onClick={() => beginMapping(row.id)}
                                  className="inline-flex items-center rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-600 transition hover:border-teal-200 hover:text-teal-600"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => deleteMapping(row.id)}
                                  disabled={mappingDeletingId === row.id}
                                  className="inline-flex items-center rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                                >
                                  {mappingDeletingId === row.id ? 'Removing…' : 'Remove'}
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => beginMapping(row.id)}
                                className="inline-flex items-center rounded-lg border border-teal-200 px-3 py-1 text-xs font-semibold text-teal-600 transition hover:bg-teal-50"
                              >
                                Set User
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-5">
                <h3 className="text-sm font-semibold text-gray-700">Link ForthCRM to FlashDash</h3>
                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <label className="text-sm text-gray-600">
                    <span className="mb-2 block font-medium">Forth User</span>
                    <select
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      value={selectedForth}
                      onChange={(event) => setSelectedForth(event.target.value)}
                    >
                      <option value="">Select user...</option>
                      {mappingRows
                        .slice()
                        .sort((a, b) => a.forthName.localeCompare(b.forthName))
                        .map((row) => (
                          <option key={row.id} value={row.id}>
                            {row.forthName}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label className="text-sm text-gray-600">
                    <span className="mb-2 block font-medium">FlashDash User</span>
                    <select
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      value={selectedFlash}
                      onChange={(event) => setSelectedFlash(event.target.value)}
                    >
                      <option value="">Select user...</option>
                      {flashUsers
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                    </select>
                  </label>
                  <div className="flex items-end">
                    <button
                      onClick={saveMapping}
                      disabled={!selectedForth || !selectedFlash || mappingSaving}
                      className="w-full rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 disabled:opacity-50"
                    >
                      {mappingSaving ? 'Saving…' : 'Save Mapping'}
                    </button>
                  </div>
                </div>
                {activeMapping && (
                  <p className="mt-3 text-xs text-gray-500">
                    Updating mapping for <span className="font-semibold">{activeMapping.forthName}</span>.
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'access' && (
            <div className="space-y-6">
              {accessError && (
                <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-700">
                  {accessError}
                </p>
              )}
              {accessMessage && (
                <p className="text-sm text-emerald-600">{accessMessage}</p>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(accessRules).map(([role, permissions]) => (
                  <div key={role} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-base font-semibold text-gray-800 capitalize">{role}</h3>
                      {accessLoading && (
                        <span className="inline-flex h-2 w-2 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" aria-hidden />
                      )}
                    </div>
                    <div className="space-y-3">
                      {PERMISSIONS.map((permission) => (
                        <label
                          key={permission.key}
                          className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 text-sm text-gray-600 transition hover:bg-gray-50"
                        >
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

              <div className="flex justify-end">
                <button
                  onClick={saveAccess}
                  disabled={accessSaving}
                  className="inline-flex items-center rounded-xl bg-teal-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 disabled:opacity-50"
                >
                  {accessSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
