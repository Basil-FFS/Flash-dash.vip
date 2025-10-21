import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import FlashFinancialForm from './pages/FlashFinancialForm.jsx';
import AdminPanel from './pages/AdminPanel.jsx';
import Reports from './pages/Reports.jsx';
import GlobalNotice from './components/GlobalNotice.jsx';
import RequestStatusRibbon from './components/RequestStatusRibbon.jsx';

const brand = import.meta.env.VITE_BRAND_COLOR || '#14b8a6';
const logo = import.meta.env.VITE_LOGO_URL;

const roleNav = {
  admin: [
    { label: 'Dashboard', to: '/' },
    { label: 'Reports', to: '/reports' },
    { label: 'Lead Intake', to: '/flash-form' },
    { label: 'Admin Panel', to: '/admin' }
  ],
  intake: [
    { label: 'Dashboard', to: '/' },
    { label: 'Intake Metrics', to: '/reports?section=intake' }
  ],
  opener: [
    { label: 'Dashboard', to: '/' },
    { label: 'Opener Metrics', to: '/reports?section=opener' }
  ],
  default: [
    { label: 'Dashboard', to: '/' }
  ]
};

function Protected({ children, allowedRoles }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length) {
    const role = localStorage.getItem('role');
    if (!role || !allowedRoles.includes(role)) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}

function Layout({ children }) {
  const agentName = localStorage.getItem('agentName') || 'Agent';
  const role = localStorage.getItem('role') || 'default';
  const location = useLocation();

  const links = roleNav[role] || roleNav.default;

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-white to-primary-50">
      {/* Modern Header */}
      <header className="gradient-bg text-white shadow-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              {logo && (
                <img src={logo} alt="FlashDash" className="h-10 w-auto" />
              )}
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-white">FlashDash</h1>
                <p className="text-primary-200 text-sm">Flash Financial Solutions</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              {links.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive || location.pathname === item.to.split('?')[0]
                        ? 'bg-white/20 text-white'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:block text-right">
                <p className="text-sm text-white/90 font-medium">{agentName}</p>
                <p className="text-xs text-primary-200 capitalize">
                  {localStorage.getItem('role') || 'user'}
                </p>
              </div>
              <button 
                onClick={() => { 
                  localStorage.clear(); 
                  window.location.href = '/login'; 
                }} 
                className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border border-white/20 hover:border-white/30"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <GlobalNotice />
      <RequestStatusRibbon />
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected allowedRoles={['admin', 'intake', 'opener']}>
            <Layout>
              <Dashboard />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/reports"
        element={
          <Protected allowedRoles={['admin', 'intake', 'opener']}>
            <Layout>
              <Reports />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/flash-form"
        element={
          <Protected allowedRoles={['admin', 'intake']}>
            <Layout>
              <FlashFinancialForm />
            </Layout>
          </Protected>
        }
      />
      <Route
        path="/admin"
        element={
          <Protected allowedRoles={['admin']}>
            <Layout>
              <AdminPanel />
            </Layout>
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
