import { useState } from 'react';
import api from '../api.js';

const logo = import.meta.env.VITE_LOGO_URL;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setIsLoading(true);
    
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      
      // Store agent name - must be set in database
      if (data.user.agentName) {
        localStorage.setItem('agentName', data.user.agentName);
      } else {
        // No agent name set - this should not happen if admin properly configured users
        localStorage.setItem('agentName', 'Agent');
        console.warn('User has no agentName set. Please set agentName in admin panel.');
      }
      
      window.location.href = '/';
    } catch (e) {
      setErr(e.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-primary-900 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          {logo && (
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6 border border-white/20">
              <img src={logo} alt="FlashDash" className="h-12 w-auto" />
            </div>
          )}
          <h1 className="text-4xl font-bold text-white mb-2">FlashDash</h1>
          <p className="text-primary-200 text-lg">Employee Log In Only</p>
        </div>

        {/* Login Form */}
        <div className="card backdrop-blur-sm bg-white/10 border border-white/20">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary-500 to-emerald-500 rounded-full mb-4">
              <span className="text-2xl">🔐</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Employee Login</h2>
            <p className="text-primary-100 mt-2">Access FlashDash</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Email Address
              </label>
              <input
                type="email"
                placeholder="employee@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-field bg-white/20 border-white/30 text-white placeholder-white/60 focus:bg-white/30 focus:border-white/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-field bg-white/20 border-white/30 text-white placeholder-white/60 focus:bg-white/30 focus:border-white/50"
              />
            </div>

            {err && (
              <div className="bg-red-500/20 border border-red-400/30 rounded-xl p-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⚠️</span>
                  <p className="text-red-200 font-medium">{err}</p>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center space-x-2">
                  <span className="animate-spin">⏳</span>
                  <span>Signing In...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <span>🚀</span>
                  <span>Sign In</span>
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-8 text-center">
            <p className="text-primary-200 text-sm">
              Secure access to your FlashDash
            </p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}
