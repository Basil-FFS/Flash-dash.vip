import { Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import FlashFinancialForm from './pages/FlashFinancialForm.jsx';
import AdminPanel from './pages/AdminPanel.jsx';

const brand = import.meta.env.VITE_BRAND_COLOR || '#14b8a6';
const logo = import.meta.env.VITE_LOGO_URL;

function Protected({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function AdminOnly({ children }) {
  const role = localStorage.getItem('role');
  return role === 'admin' ? children : <Navigate to="/" replace />;
}

function Layout({ children }) {
  const agentName = localStorage.getItem('agentName') || 'Agent';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-50 via-white to-primary-50">
      {/* Modern Header */}
      <header className="gradient-bg text-white shadow-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              {logo && (
                <img src={logo} alt="FLASH DASH" className="h-10 w-auto" />
              )}
              <div className="hidden md:block">
                <h1 className="text-xl font-bold text-white">FLASH DASH</h1>
                <p className="text-primary-200 text-sm">Premium CRM Platform</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                to="/" 
                className="text-white/80 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/10"
              >
                Dashboard
              </Link>
              <Link 
                to="/flash-form" 
                className="text-white/80 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/10"
              >
                Lead Intake
              </Link>
              {localStorage.getItem('role') === 'admin' && (
                <Link 
                  to="/admin" 
                  className="text-white/80 hover:text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/10"
                >
                  Admin Panel
                </Link>
              )}
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
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protected><Layout><Dashboard /></Layout></Protected>} />
      <Route path="/flash-form" element={<Protected><Layout><FlashFinancialForm /></Layout></Protected>} />
      <Route path="/admin" element={<Protected><AdminOnly><Layout><AdminPanel /></Layout></AdminOnly></Protected>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
