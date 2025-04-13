import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { useAuth, RegisterData } from '../context/AuthContext';

const Register: React.FC = () => {
  const [formData, setFormData] = useState<RegisterData>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    currency: 'USD'
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { register, isAuthenticated, isLoading, error } = useAuth();
  const navigate = useNavigate();

  // Supported currencies
  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'NZD', 'CHF', 'JPY', 'CNY', 'INR', 'BRL', 'ARS', 'CLP', 'COP', 'MXN', 'PEN', 'PYG', 'UYU', 'VND', 'ZAR'];

  // If already logged in, redirect to home
  if (isAuthenticated && !isLoading) {
    return <Navigate to="/dashboard" />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const { username, firstName, lastName, email, password, currency } = formData;

    // Form validation
    if (!username.trim()) {
      setFormError('Username is required');
      return;
    }

    if (username.length < 3) {
      setFormError('Username must be at least 3 characters');
      return;
    }

    if (!firstName.trim()) {
      setFormError('First name is required');
      return;
    }

    if (!lastName.trim()) {
      setFormError('Last name is required');
      return;
    }

    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setFormError('Password is required');
      return;
    }

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    if (!currency) {
      setFormError('Currency is required');
      return;
    }

    try {
      await register(formData);
      navigate('/dashboard');
    } catch (err) {
      console.log("Registration error:", err);
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
            Create your account
          </h2>
          <p className="text-gray-400 text-center mt-2">
            Fill in your details to create an account. You'll be automatically logged in.
          </p>
        </div>
        
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              className="w-full px-4 py-3 border-0 bg-gray-800 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-darkgreen focus:border-transparent text-base"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                First Name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                className="w-full px-4 py-3 border-0 bg-gray-800 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-darkgreen focus:border-transparent text-base"
                placeholder="First Name"
                value={formData.firstName}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                Last Name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                className="w-full px-4 py-3 border-0 bg-gray-800 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-darkgreen focus:border-transparent text-base"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
          </div>
          
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
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-300 mb-2">
              Preferred Currency
            </label>
            <select
              id="currency"
              name="currency"
              required
              className="w-full px-4 py-3 border-0 bg-gray-800 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-darkgreen focus:border-transparent text-base"
              value={formData.currency}
              onChange={handleChange}
            >
              {currencies.map((curr) => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="w-full px-4 py-3 border-0 bg-gray-800 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-darkgreen focus:border-transparent text-base"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="w-full px-4 py-3 border-0 bg-gray-800 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-darkgreen focus:border-transparent text-base"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
          
          <div className="text-center text-gray-400 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-darkgreen hover:text-darkgreen-light font-medium">
              Sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register; 