import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api.js';
import { SimpleLineChart } from '../components/ChartPrimitives.jsx';

const businessHours = { start: 10, end: 17 };

function withinBusinessHours() {
  const central = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  const hour = central.getHours();
  return hour >= businessHours.start && hour < businessHours.end;
}

const fallbackSummary = (role) => ({
  totalLeads: 0,
  pendingLeads: 0,
  conversionRate: 0,
  weeklyPerformance: [
    { label: 'Mon', value: 0 },
    { label: 'Tue', value: 0 },
    { label: 'Wed', value: 0 },
    { label: 'Thu', value: 0 },
    { label: 'Fri', value: 0 }
  ],
  dailyMetrics: [
    {
      day: 'Mon',
      opener: { transferred: 0, conversion: '0%' },
      intake: { enrolled: 0, conversion: '0%' }
    },
    {
      day: 'Tue',
      opener: { transferred: 0, conversion: '0%' },
      intake: { enrolled: 0, conversion: '0%' }
    },
    {
      day: 'Wed',
      opener: { transferred: 0, conversion: '0%' },
      intake: { enrolled: 0, conversion: '0%' }
    },
    {
      day: 'Thu',
      opener: { transferred: 0, conversion: '0%' },
      intake: { enrolled: 0, conversion: '0%' }
    },
    {
      day: 'Fri',
      opener: { transferred: 0, conversion: '0%' },
      intake: { enrolled: 0, conversion: '0%' }
    }
  ],
  pendingLabel: role === 'opener' ? 'Transferred Leads' : 'Enrolled Leads'
});

export default function Dashboard() {
  const [summary, setSummary] = useState(fallbackSummary(localStorage.getItem('role')));
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const role = localStorage.getItem('role') || 'admin';
  const agentName = localStorage.getItem('agentName') || 'Agent';
  const currentTime = new Date();
  const greeting = currentTime.getHours() < 12 ? 'Good morning' :
                  currentTime.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get('/api/dashboard/summary', { params: { role } });
      const fallback = fallbackSummary(role);
      setSummary({
        totalLeads: data?.totalLeads ?? fallback.totalLeads,
        pendingLeads: data?.pendingLeads ?? fallback.pendingLeads,
        conversionRate: data?.conversionRate ?? fallback.conversionRate,
        weeklyPerformance: Array.isArray(data?.weeklyPerformance) && data.weeklyPerformance.length ? data.weeklyPerformance : fallback.weeklyPerformance,
        dailyMetrics: Array.isArray(data?.dailyMetrics) && data.dailyMetrics.length ? data.dailyMetrics : fallback.dailyMetrics,
        pendingLabel: data?.pendingLabel || (role === 'opener' ? 'Transferred Leads' : 'Enrolled Leads')
      });
      setLastUpdated(Date.now());
    } catch (err) {
      setError('Unable to refresh dashboard metrics. Showing cached results.');
      setSummary(fallbackSummary(role));
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (withinBusinessHours()) {
        fetchSummary();
      }
    }, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchSummary]);

  const quickActions = useMemo(() => {
    if (role === 'admin') {
      return [
        {
          title: 'View Reports',
          description: 'Analytics and performance metrics',
          icon: '📊',
          link: '/reports',
          color: 'from-blue-500 to-indigo-500'
        },
        {
          title: 'Manage Access',
          description: 'Configure roles and permissions',
          icon: '🔐',
          link: '/admin/access-control',
          color: 'from-purple-500 to-pink-500'
        },
        {
          title: 'User Mapping',
          description: 'Sync ForthCRM to FlashDash',
          icon: '👥',
          link: '/admin/user-mapping',
          color: 'from-teal-500 to-emerald-500'
        }
      ];
    }

    if (role === 'intake') {
      return [
        {
          title: 'Intake Metrics',
          description: 'Review enrollment performance',
          icon: '📈',
          link: '/reports?section=intake',
          color: 'from-teal-500 to-emerald-500'
        },
        {
          title: 'Lead Intake Form',
          description: 'Capture a new enrollment',
          icon: '📝',
          link: '/flash-form',
          color: 'from-blue-500 to-cyan-500'
        }
      ];
    }

    return [
      {
        title: 'Opener Metrics',
        description: 'Monitor transfer pipeline',
        icon: '🎯',
        link: '/reports?section=opener',
        color: 'from-orange-500 to-amber-500'
      }
    ];
  }, [role]);

  const filterLabel = summary.pendingLabel || (role === 'opener' ? 'Transferred Leads' : 'Enrolled Leads');

  return (
    <div className="space-y-8">
      <div className="gradient-bg rounded-3xl p-8 text-white shadow-2xl">
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {greeting}, {agentName}! 👋
          </h1>
          <p className="text-xl text-teal-100 mb-6 max-w-2xl">
            Your personalized performance overview is ready below.
          </p>
          <div className="flex flex-wrap gap-4">
            {(role === 'admin' || role === 'intake') && (
              <Link to="/flash-form" className="btn-primary">
                🚀 Start New Lead
              </Link>
            )}
            <Link to="/reports" className="btn-secondary">
              📊 View Reports
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card group hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Leads (Assigned)</p>
              <p className="text-3xl font-bold text-gray-900">{Number(summary.totalLeads).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-teal-100 rounded-xl group-hover:bg-teal-200 transition-colors">
              <span className="text-2xl">📈</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Updated {lastUpdated ? new Date(lastUpdated).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '—'}
          </div>
        </div>

        <div className="card group hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">{filterLabel}</p>
              <p className="text-3xl font-bold text-gray-900">{Number(summary.pendingLeads).toLocaleString()}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl group-hover:bg-yellow-200 transition-colors">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            {role === 'opener' ? 'Awaiting intake handoff' : 'Awaiting enrollment completion'}
          </div>
        </div>

        <div className="card group hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
              <p className="text-3xl font-bold text-gray-900">{summary.conversionRate}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Based on this week&apos;s closed opportunities.
          </div>
        </div>

        <div className="card group hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="text-3xl font-bold text-gray-900">{loading ? 'Syncing' : 'Live'}</p>
            </div>
            <div className="p-3 bg-sky-100 rounded-xl group-hover:bg-sky-200 transition-colors">
              <span className="text-2xl">🕒</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            {withinBusinessHours() ? 'Auto-refreshing each hour.' : 'Auto-refresh paused until 10AM CST.'}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              to={action.link}
              className="card group hover:scale-105 transition-all duration-200 cursor-pointer"
            >
              <div className="text-center">
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${action.color} text-white text-3xl mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  {action.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{action.title}</h3>
                <p className="text-gray-600 text-sm">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Daily Metrics</h3>
              <p className="text-sm text-gray-500">Last five weekdays by role</p>
            </div>
            {loading && (
              <span className="inline-flex h-2 w-2 animate-spin rounded-full border-2 border-teal-400 border-t-transparent" />
            )}
          </div>
          <div className="space-y-4">
            {summary.dailyMetrics.map((metric, index) => {
              const openerTransfers = metric.opener?.transferred ?? metric.opener?.leads ?? metric.opener?.count ?? 0;
              const intakeEnrollments = metric.intake?.enrolled ?? metric.intake?.leads ?? metric.intake?.count ?? 0;
              const openerConversion = metric.opener?.conversion ?? metric.opener?.conversionRate ?? '0%';
              const intakeConversion = metric.intake?.conversion ?? metric.intake?.conversionRate ?? '0%';

              return (
                <div key={index} className="border border-gray-100 rounded-xl px-4 py-3 flex flex-col gap-2 bg-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">{metric.day}</span>
                    <span className="text-xs text-gray-500">vs prior day</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                    <div className="rounded-lg bg-teal-50 px-3 py-2">
                      <p className="text-xs uppercase text-teal-600">Opener</p>
                    <p className="font-semibold text-gray-900">Transfers: {openerTransfers}</p>
                    <p className="text-xs text-gray-500">Conversion: {openerConversion}</p>
                    </div>
                    <div className="rounded-lg bg-sky-50 px-3 py-2">
                      <p className="text-xs uppercase text-sky-600">Intake</p>
                    <p className="font-semibold text-gray-900">Enrolled: {intakeEnrollments}</p>
                    <p className="text-xs text-gray-500">Conversion: {intakeConversion}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Weekly Performance</h3>
          <SimpleLineChart data={summary.weeklyPerformance} dataKey="value" labelKey="label" color="#0ea5e9" />
        </div>
      </div>
    </div>
  );
}
