import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalLeads: 0,
    pendingLeads: 0,
    completedLeads: 0,
    conversionRate: 0
  });

  const agentName = localStorage.getItem('agentName') || 'Agent';
  const currentTime = new Date();
  const greeting = currentTime.getHours() < 12 ? 'Good morning' : 
                  currentTime.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  useEffect(() => {
    // Simulate fetching stats - replace with actual API call
    setStats({
      totalLeads: 1247,
      pendingLeads: 23,
      completedLeads: 1189,
      conversionRate: 95.3
    });
  }, []);

  const quickActions = [
    {
      title: 'New Lead Intake',
      description: 'Start a new lead application',
      icon: '📝',
      link: '/flash-form',
      color: 'from-teal-500 to-emerald-500'
    },
    {
      title: 'View Reports',
      description: 'Analytics and performance metrics',
      icon: '📊',
      link: '/admin',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      title: 'Manage Team',
      description: 'Employee and agent management',
      icon: '👥',
      link: '/admin',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  const recentActivity = [
    { id: 1, action: 'New lead submitted', time: '2 minutes ago', type: 'lead' },
    { id: 2, action: 'Application completed', time: '15 minutes ago', type: 'success' },
    { id: 3, action: 'Follow-up scheduled', time: '1 hour ago', type: 'reminder' },
    { id: 4, action: 'Payment received', time: '2 hours ago', type: 'payment' }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Hero Section */}
      <div className="gradient-bg rounded-3xl p-8 text-white shadow-2xl">
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            {greeting}, {agentName}! 👋
          </h1>
          <p className="text-xl text-teal-100 mb-6 max-w-2xl">
            Welcome to FlashDash!
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/flash-form" className="btn-primary">
              🚀 Start New Lead
            </Link>
            <button className="btn-secondary">
              📊 View Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card group hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Leads</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalLeads.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-teal-100 rounded-xl group-hover:bg-teal-200 transition-colors">
              <span className="text-2xl">📈</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-emerald-600">
              <span className="mr-1">↗</span>
              +12% from last month
            </div>
          </div>
        </div>

        <div className="card group hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Pending Leads</p>
              <p className="text-3xl font-bold text-gray-900">{stats.pendingLeads}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl group-hover:bg-yellow-200 transition-colors">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-yellow-600">
              <span className="mr-1">↗</span>
              +5 new today
            </div>
          </div>
        </div>

        <div className="card group hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-3xl font-bold text-gray-900">{stats.completedLeads.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl group-hover:bg-emerald-200 transition-colors">
              <span className="text-2xl">✅</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-emerald-600">
              <span className="mr-1">↗</span>
              +8% this week
            </div>
          </div>
        </div>

        <div className="card group hover:scale-105 transition-transform duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
              <p className="text-3xl font-bold text-gray-900">{stats.conversionRate}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-purple-600">
              <span className="mr-1">↗</span>
              +2.1% improvement
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
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

      {/* Recent Activity & Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'lead' ? 'bg-teal-500' :
                  activity.type === 'success' ? 'bg-emerald-500' :
                  activity.type === 'reminder' ? 'bg-yellow-500' :
                  'bg-purple-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Chart Placeholder */}
        <div className="card">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Weekly Performance</h3>
          <div className="h-64 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-600 font-medium">Performance Chart</p>
              <p className="text-sm text-gray-500">Coming soon with detailed analytics</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="text-center py-8">
        <div className="card max-w-2xl mx-auto">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Need Help?</h3>
          <p className="text-gray-600 mb-6">
            Our support team is here to help you maximize your lead conversion rates.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <button className="btn-primary">
              📞 Contact Support
            </button>
            <button className="btn-secondary">
              📚 View Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
