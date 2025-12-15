import React, { useState } from 'react';

const Signup = ({ onSignup, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student'
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Name is required';
    }
    
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
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
    
    setTimeout(() => {
      const user = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        avatar: `https://ui-avatars.com/api/?name=${formData.name}&background=4F46E5&color=fff`,
        joinedDate: new Date().toISOString()
      };
      
      localStorage.setItem('user', JSON.stringify(user));
      onSignup(user);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md border border-white/20 shadow-2xl">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🤟</div>
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-white/70">Join EduSense today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg bg-white/10 border ${
                errors.name ? 'border-red-500' : 'border-white/20'
              } text-white placeholder-white/50 focus:outline-none focus:border-blue-500`}
              placeholder="Enter your name"
            />
            {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>

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
              } text-white placeholder-white/50 focus:outline-none focus:border-blue-500`}
              placeholder="Enter your email"
            />
            {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="student" className="bg-gray-800">Student</option>
              <option value="teacher" className="bg-gray-800">Teacher</option>
              <option value="caregiver" className="bg-gray-800">Caregiver</option>
            </select>
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
              } text-white placeholder-white/50 focus:outline-none focus:border-blue-500`}
              placeholder="Create a password"
            />
            {errors.password && <p className="text-red-400 text-sm mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-white text-sm font-medium mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg bg-white/10 border ${
                errors.confirmPassword ? 'border-red-500' : 'border-white/20'
              } text-white placeholder-white/50 focus:outline-none focus:border-blue-500`}
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && <p className="text-red-400 text-sm mt-1">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-white/70 text-sm mt-6">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-blue-400 hover:text-blue-300 font-semibold"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;
