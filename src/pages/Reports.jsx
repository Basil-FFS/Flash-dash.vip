import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api.js';
import { SimpleBarChart, SimpleLineChart } from '../components/ChartPrimitives.jsx';

const FILTERS = [
  { label: 'Today', value: 'today' },
  { label: 'Yesterday', value: 'yesterday' },
  { label: 'This Week', value: 'this_week' },
  { label: 'This Month', value: 'this_month' }
];

const SECTION_LABELS = {
  company: 'Company Metrics',
  opener: 'Opener Metrics',
  intake: 'Intake Metrics',
  comparison: 'Comparison Charts'
};

function isWithinBusinessHours(date = new Date()) {
  const centralDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const hour = centralDate.getHours();
  return hour >= 10 && hour < 17;
}

function formatTimestamp(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function getVisibleSections(role) {
  if (role === 'opener') return ['opener', 'comparison'];
  if (role === 'intake') return ['intake', 'comparison'];
  return ['company', 'opener', 'intake', 'comparison'];
}

function fallbackSection(section) {
  switch (section) {
    case 'company':
      return {
        columns: [
          { key: 'metric', label: 'Metric' },
          { key: 'value', label: 'Value' },
          { key: 'change', label: 'Change vs. Prior' }
        ],
        rows: [
          { metric: 'Total Leads', value: 0, change: '0%' },
          { metric: 'Qualified Leads', value: 0, change: '0%' },
          { metric: 'Conversion Rate', value: '0%', change: '0%' }
        ]
      };
    case 'opener':
      return {
        columns: [
          { key: 'agent', label: 'Opener' },
          { key: 'transferred', label: 'Transferred' },
          { key: 'appointments', label: 'Appointments' },
          { key: 'conversion', label: 'Conversion %' }
        ],
        rows: []
      };
    case 'intake':
      return {
        columns: [
          { key: 'agent', label: 'Intake' },
          { key: 'enrolled', label: 'Enrolled' },
          { key: 'pending', label: 'Pending' },
          { key: 'conversion', label: 'Conversion %' }
        ],
        rows: []
      };
    case 'comparison':
    default:
      return {
        trend: [],
        agents: []
      };
  }
}

function DataTable({ title, description, dataset }) {
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil((dataset.rows?.length || 0) / pageSize));
  const pageRows = (dataset.rows || []).slice(page * pageSize, page * pageSize + pageSize);

  const exportCsv = () => {
    const header = dataset.columns.map((col) => `"${col.label}"`).join(',');
    const body = (dataset.rows || [])
      .map((row) => dataset.columns.map((col) => {
        const raw = row[col.key] ?? '';
        const value = typeof raw === 'number' ? raw : `${raw}`;
        return `"${value.replace(/"/g, '""')}"`;
      }).join(','))
      .join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="card shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-3 py-1 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            disabled={page === 0}
          >
            Prev
          </button>
          <span className="text-xs text-gray-500">
            Page {totalPages ? page + 1 : 0} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="px-3 py-1 text-sm rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            disabled={page >= totalPages - 1}
          >
            Next
          </button>
          <button
            onClick={exportCsv}
            className="px-3 py-1 text-sm rounded-md bg-white border border-teal-200 text-teal-600 hover:bg-teal-50"
          >
            Export CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {dataset.columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={dataset.columns.length} className="px-4 py-8 text-center text-sm text-gray-500">
                  No data available for the selected filters.
                </td>
              </tr>
            )}
            {pageRows.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {dataset.columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                    {row[column.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function normalizeColumns(columns, fallback) {
  if (!Array.isArray(columns) || !columns.length) {
    return fallback;
  }

  return columns.map((column) => {
    if (typeof column === 'string') {
      const label = column
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
      return { key: column, label };
    }
    return column;
  });
}

export default function Reports() {
  const role = localStorage.getItem('role') || 'admin';
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState(FILTERS[0].value);
  const [lastSynced, setLastSynced] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [datasets, setDatasets] = useState({
    company: fallbackSection('company'),
    opener: fallbackSection('opener'),
    intake: fallbackSection('intake'),
    comparison: fallbackSection('comparison')
  });

  const visibleSections = useMemo(() => getVisibleSections(role), [role]);
  const requestedSection = searchParams.get('section');

  useEffect(() => {
    if (requestedSection && !visibleSections.includes(requestedSection)) {
      setSearchParams((params) => {
        const next = new URLSearchParams(params);
        next.delete('section');
        return next;
      }, { replace: true });
    }
  }, [requestedSection, visibleSections, setSearchParams]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);

    const sectionsToFetch = visibleSections;

    try {
      const responses = await Promise.all(
        sectionsToFetch.map((section) =>
          api
            .get(`/api/reports/${section}`, { params: { range: activeFilter } })
            .then((res) => ({ section, data: res.data }))
            .catch(() => ({ section, data: fallbackSection(section) }))
        )
      );

      setDatasets((prev) => {
        const updated = { ...prev };
        const comparisonFallback = fallbackSection('comparison');
        responses.forEach(({ section, data }) => {
          if (section === 'comparison') {
            updated[section] = {
              trend: data?.trend || comparisonFallback.trend,
              agents: data?.agents || comparisonFallback.agents
            };
          } else {
            const fallback = fallbackSection(section);
            const columns = normalizeColumns(data?.columns, fallback.columns);
            const rows = Array.isArray(data?.rows) ? data.rows : fallback.rows;
            updated[section] = { columns, rows };
          }
        });
        return updated;
      });
      setLastSynced(Date.now());
    } catch (err) {
      setError('Unable to load reports at this time. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [visibleSections, activeFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isWithinBusinessHours()) {
        fetchReports();
      }
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchReports]);

  const handleFilterChange = (value) => {
    setActiveFilter(value);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Reports</h1>
          <p className="text-sm text-gray-500 mt-2">
            Monitor productivity and conversion trends across the FlashDash teams.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            {loading && (
              <span className="inline-flex h-2 w-2 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
            )}
            <span>Last synced: {formatTimestamp(lastSynced)}</span>
          </div>
          <button
            onClick={fetchReports}
            className="px-3 py-2 text-sm font-medium rounded-lg bg-teal-500 text-white hover:bg-teal-600"
          >
            Refresh Now
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-100 rounded-2xl px-4 py-3 shadow-sm">
        {FILTERS.map((filter) => (
          <button
            key={filter.value}
            onClick={() => handleFilterChange(filter.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeFilter === filter.value
                ? 'bg-teal-500 text-white shadow-sm'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-8">
        {visibleSections.includes('company') && (
          <DataTable
            title={SECTION_LABELS.company}
            description="Company-wide performance aggregates across all roles."
            dataset={datasets.company}
          />
        )}

        {visibleSections.includes('opener') && (
          <DataTable
            title={SECTION_LABELS.opener}
            description="Breakdown of opener pipeline activity and transfer ratios."
            dataset={datasets.opener}
          />
        )}

        {visibleSections.includes('intake') && (
          <DataTable
            title={SECTION_LABELS.intake}
            description="Enrollment pipeline metrics for intake specialists."
            dataset={datasets.intake}
          />
        )}

        {visibleSections.includes('comparison') && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Trend Over Time</h3>
              <p className="text-sm text-gray-500 mb-4">
                Tracks aggregate performance for the selected filter window.
              </p>
              <SimpleLineChart data={datasets.comparison.trend || []} dataKey="value" labelKey="label" />
            </div>
            <div className="card">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Agent Comparison</h3>
              <p className="text-sm text-gray-500 mb-4">
                Visualizes opener and intake performance for the selected timeframe.
              </p>
              <SimpleBarChart data={datasets.comparison.agents || []} valueKey="value" labelKey="agent" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
