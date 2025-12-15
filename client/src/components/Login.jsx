import React, { useState } from 'react';

const Login = ({ onLogin, onSwitchToSignup }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const user = {
        id: '1',
        name: formData.email.split('@')[0],
        email: formData.email,
        role: 'student',
        avatar: `https://ui-avatars.com/api/?name=${formData.email.split('@')[0]}&background=4F46E5&color=fff`
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      onLogin(user);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🤟</div>
          <h1 className="text-3xl font-bold text-white mb-2">EduSense</h1>
          <p className="text-white/70">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg bg-white/10 border ${
                errors.email ? 'border-red-500' : 'border-white/20'
              } text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition-colors`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg bg-white/10 border ${
                errors.password ? 'border-red-500' : 'border-white/20'
              } text-white placeholder-white/50 focus:outline-none focus:border-blue-500 transition-colors`}
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-white/20"></div>
          <span className="px-4 text-white/50 text-sm">or</span>
          <div className="flex-1 border-t border-white/20"></div>
        </div>

        {/* Demo Account */}
        <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4 mb-4">
          <p className="text-blue-200 text-sm mb-2">
            <strong>Demo Account:</strong>
          </p>
          <p className="text-blue-300 text-xs">
            Email: demo@edusense.com<br />
            Password: demo123
          </p>
        </div>

        {/* Sign Up Link */}
        <p className="text-center text-white/70 text-sm">
          Don't have an account?{' '}
          <button
            onClick={onSwitchToSignup}
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
