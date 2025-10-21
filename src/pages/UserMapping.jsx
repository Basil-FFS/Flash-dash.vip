import { useEffect, useMemo, useState } from 'react';
import api from '../api.js';

const sorters = {
  forth: (a, b) => a.forthUser.localeCompare(b.forthUser),
  flash: (a, b) => a.flashUser.localeCompare(b.flashUser)
};

export default function UserMapping() {
  const [forthUsers, setForthUsers] = useState([]);
  const [flashUsers, setFlashUsers] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [selectedForth, setSelectedForth] = useState('');
  const [selectedFlash, setSelectedFlash] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [sortKey, setSortKey] = useState('forth');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [forthRes, flashRes, mappingRes] = await Promise.all([
          api.get('/api/forthcrm/users'),
          api.get('/api/users'),
          api.get('/api/forthcrm/mapping')
        ]);

        const forthRecords = (forthRes.data || []).map((user) => ({
          id: user.id || user.userId || user.uuid,
          name: user.name || user.fullName || user.email || 'Unknown Forth User'
        })).filter((user) => user.id);

        const flashRecords = (flashRes.data || []).map((user) => ({
          id: user.id || user.userId || user.uuid,
          name: user.name || user.fullName || user.email || 'Unknown FlashDash User'
        })).filter((user) => user.id);

        const mappingRecords = (mappingRes.data || []).map((entry) => ({
          id: entry.id || `${entry.forthUserId}-${entry.flashUserId}`,
          forthUserId: entry.forthUserId,
          flashUserId: entry.flashUserId,
          forthUser: entry.forthUser || entry.forthUserName || entry.forthName || 'Unknown Forth User',
          flashUser: entry.flashUser || entry.flashUserName || entry.flashName || 'Unknown FlashDash User'
        })).filter((entry) => entry.forthUserId && entry.flashUserId);

        setForthUsers(forthRecords);
        setFlashUsers(flashRecords);
        setMappings(mappingRecords);
      } catch (err) {
        setError('Unable to load mapping data. Using cached placeholders.');
        setForthUsers([
          { id: 'f-1', name: 'Forth User 1' },
          { id: 'f-2', name: 'Forth User 2' }
        ]);
        setFlashUsers([
          { id: 'fd-1', name: 'FlashDash User 1' },
          { id: 'fd-2', name: 'FlashDash User 2' }
        ]);
        setMappings([
          {
            id: 'm-1',
            forthUserId: 'f-1',
            flashUserId: 'fd-1',
            forthUser: 'Forth User 1',
            flashUser: 'FlashDash User 1'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const sortedMappings = useMemo(() => {
    const sorter = sorters[sortKey] || sorters.forth;
    return [...mappings].sort(sorter);
  }, [mappings, sortKey]);

  const handleSave = async () => {
    if (!selectedForth || !selectedFlash) return;

    setSaving(true);
    setError(null);

    try {
      await api.post('/api/forthcrm/mapping/set', {
        forthUserId: selectedForth,
        flashUserId: selectedFlash
      });

      const forthName = forthUsers.find((user) => user.id === selectedForth)?.name || 'Forth User';
      const flashName = flashUsers.find((user) => user.id === selectedFlash)?.name || 'FlashDash User';

      setMappings((prev) => {
        const others = prev.filter((entry) => entry.forthUserId !== selectedForth);
        return [
          ...others,
          {
            id: `${selectedForth}-${selectedFlash}`,
            forthUserId: selectedForth,
            flashUserId: selectedFlash,
            forthUser: forthName,
            flashUser: flashName
          }
        ];
      });

      setSelectedForth('');
      setSelectedFlash('');
    } catch (err) {
      setError('We could not save the mapping. Please try again later.');
    } finally {
      setSaving(false);
    }
  };

  const beginEdit = (mapping) => {
    setSelectedForth(mapping.forthUserId);
    setSelectedFlash(mapping.flashUserId);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Mapping</h1>
          <p className="text-sm text-gray-500 mt-2">
            Link ForthCRM agents to FlashDash accounts to drive role-based reporting.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          {saving && (
            <span className="inline-flex h-2 w-2 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
          )}
          <span>{saving ? 'Saving...' : 'Mappings synced with backend'}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          {error}
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Create Mapping</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-gray-600 font-medium">ForthCRM User</span>
            <select
              value={selectedForth}
              onChange={(event) => setSelectedForth(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">Select user...</option>
              {forthUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-gray-600 font-medium">FlashDash User</span>
            <select
              value={selectedFlash}
              onChange={(event) => setSelectedFlash(event.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              <option value="">Select user...</option>
              {flashUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={handleSave}
            disabled={!selectedForth || !selectedFlash || saving}
            className="inline-flex items-center justify-center rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-600 disabled:opacity-50"
          >
            Save Mapping
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Existing Mappings</h2>
            <p className="text-sm text-gray-500">Edit or review connected accounts.</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>Sort by</span>
            <div className="inline-flex rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setSortKey('forth')}
                className={`px-3 py-1 rounded-md ${sortKey === 'forth' ? 'bg-teal-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                ForthCRM
              </button>
              <button
                onClick={() => setSortKey('flash')}
                className={`px-3 py-1 rounded-md ${sortKey === 'flash' ? 'bg-teal-500 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                FlashDash
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">ForthCRM</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">FlashDash</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-sm text-gray-500">
                    Loading mappings...
                  </td>
                </tr>
              )}
              {!loading && sortedMappings.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-sm text-gray-500">
                    No mappings found yet.
                  </td>
                </tr>
              )}
              {!loading && sortedMappings.map((mapping) => (
                <tr key={mapping.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-700">{mapping.forthUser}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{mapping.flashUser}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => beginEdit(mapping)}
                      className="inline-flex items-center rounded-md border border-teal-200 px-3 py-1 text-teal-600 hover:bg-teal-50"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
