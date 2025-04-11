import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { login, isAuthenticated, isLoading, error } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect to home
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/dashboard" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }

    if (!password) {
      setFormError('Password is required');
      return;
    }

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.log("err", err);
      // Error is handled by the auth context
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="flex flex-col items-center mb-10">
          <span className="text-white font-bold text-3xl mb-2">BudgetApp</span>
          <div className="w-16 h-1 bg-darkgreen mb-8"></div>
          <h2 className="text-center text-2xl font-bold text-white">
            Sign in to your account
          </h2>
        </div>
        
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-4 py-3 border-0 bg-gray-800 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-darkgreen focus:border-transparent text-base"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-4 py-3 border-0 bg-gray-800 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-darkgreen focus:border-transparent text-base"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {(formError || error) && (
            <div className="text-red-500 text-sm text-center font-medium">
              {formError || error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-md text-white bg-darkgreen hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-darkgreen transition-colors duration-200 disabled:opacity-50 text-lg font-medium"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
