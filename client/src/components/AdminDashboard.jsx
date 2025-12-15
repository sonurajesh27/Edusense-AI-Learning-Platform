import React, { useState, useEffect } from 'react';

const AdminDashboard = ({ user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState([
    { id: 1, name: 'John Doe', email: 'john@example.com', progress: 75, lastActive: '2 hours ago', status: 'active' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', progress: 92, lastActive: '30 min ago', status: 'active' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', progress: 45, lastActive: '1 day ago', status: 'inactive' },
    { id: 4, name: 'Sarah Wilson', email: 'sarah@example.com', progress: 88, lastActive: '1 hour ago', status: 'active' },
  ]);

  const [stats, setStats] = useState({
    totalStudents: 24,
    activeToday: 18,
    averageProgress: 76,
    completionRate: 68,
    totalSessions: 342,
    averageSessionTime: '24 min'
  });

  const [recentActivity, setRecentActivity] = useState([
    { id: 1, user: 'John Doe', action: 'Completed Sign Quiz', time: '5 min ago', icon: '📝' },
    { id: 2, user: 'Jane Smith', action: 'Achieved 7-day streak', time: '15 min ago', icon: '🔥' },
    { id: 3, user: 'Mike Johnson', action: 'Started TouchRead session', time: '1 hour ago', icon: '📖' },
    { id: 4, user: 'Sarah Wilson', action: 'Earned "Speed Demon" badge', time: '2 hours ago', icon: '⚡' },
  ]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'students', label: 'Students', icon: '👥' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {user?.role === 'admin' ? '🎛️ Admin Dashboard' : '👨‍👩‍👧 Caregiver Dashboard'}
              </h1>
              <p className="text-white/70">Welcome back, {user?.name || 'Admin'}</p>
            </div>
            <div className="flex items-center gap-4">
              <button className="bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg transition-colors">
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notifications
              </button>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                Export Report
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }`}
            >
              <span className="text-xl mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">👥</span>
                  <span className="text-green-400 text-sm font-semibold">+12%</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.totalStudents}</div>
                <p className="text-white/70 text-sm">Total Students</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">✅</span>
                  <span className="text-green-400 text-sm font-semibold">+8%</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.activeToday}</div>
                <p className="text-white/70 text-sm">Active Today</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">📈</span>
                  <span className="text-green-400 text-sm font-semibold">+5%</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.averageProgress}%</div>
                <p className="text-white/70 text-sm">Average Progress</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">🎯</span>
                  <span className="text-yellow-400 text-sm font-semibold">-3%</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.completionRate}%</div>
                <p className="text-white/70 text-sm">Completion Rate</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">🎮</span>
                  <span className="text-green-400 text-sm font-semibold">+15%</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.totalSessions}</div>
                <p className="text-white/70 text-sm">Total Sessions</p>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">⏱️</span>
                  <span className="text-green-400 text-sm font-semibold">+2 min</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stats.averageSessionTime}</div>
                <p className="text-white/70 text-sm">Avg Session Time</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="bg-white/5 rounded-lg p-4 flex items-center gap-4">
                    <span className="text-4xl">{activity.icon}</span>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{activity.user}</p>
                      <p className="text-white/70 text-sm">{activity.action}</p>
                    </div>
                    <span className="text-white/50 text-sm">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Charts Placeholder */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">📊 Weekly Activity</h3>
                <div className="h-64 flex items-end justify-around gap-2">
                  {[65, 75, 85, 70, 90, 80, 95].map((height, idx) => (
                    <div key={idx} className="flex-1 bg-blue-500 rounded-t-lg" style={{ height: `${height}%` }}>
                      <div className="text-white text-xs text-center mt-2">{height}</div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-around mt-4 text-white/70 text-sm">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                  <span>Sun</span>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">🎯 Module Usage</h3>
                <div className="space-y-4">
                  {[
                    { name: 'Sign Language', usage: 85, color: 'bg-blue-500' },
                    { name: 'TouchRead', usage: 72, color: 'bg-purple-500' },
                    { name: 'Sign2Talk', usage: 68, color: 'bg-green-500' },
                    { name: 'Gamified Learning', usage: 91, color: 'bg-yellow-500' },
                  ].map((module, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between text-white mb-2">
                        <span className="text-sm font-medium">{module.name}</span>
                        <span className="text-sm">{module.usage}%</span>
                      </div>
                      <div className="bg-white/10 rounded-full h-3 overflow-hidden">
                        <div
                          className={`${module.color} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${module.usage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Student Management</h2>
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                + Add Student
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/20">
                    <th className="text-left text-white py-3 px-4">Student</th>
                    <th className="text-left text-white py-3 px-4">Email</th>
                    <th className="text-left text-white py-3 px-4">Progress</th>
                    <th className="text-left text-white py-3 px-4">Last Active</th>
                    <th className="text-left text-white py-3 px-4">Status</th>
                    <th className="text-left text-white py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {student.name.charAt(0)}
                          </div>
                          <span className="text-white font-medium">{student.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-white/70">{student.email}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white/10 rounded-full h-2 w-24">
                            <div
                              className="bg-blue-500 h-full rounded-full"
                              style={{ width: `${student.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-white text-sm">{student.progress}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-white/70 text-sm">{student.lastActive}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            student.status === 'active'
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-gray-500/20 text-gray-300'
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button className="text-blue-400 hover:text-blue-300 text-sm font-medium">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">📈 Detailed Analytics</h2>
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">📊</span>
              <p className="text-white/70 text-lg">Advanced analytics coming soon...</p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-6">⚙️ Dashboard Settings</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">Notification Preferences</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 text-white/70 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5" defaultChecked />
                    Email notifications for new student registrations
                  </label>
                  <label className="flex items-center gap-3 text-white/70 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5" defaultChecked />
                    Daily progress reports
                  </label>
                  <label className="flex items-center gap-3 text-white/70 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5" />
                    Weekly summary emails
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Report Generation</label>
                <select className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white">
                  <option className="bg-gray-800">Daily</option>
                  <option className="bg-gray-800">Weekly</option>
                  <option className="bg-gray-800">Monthly</option>
                </select>
              </div>

              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
                Save Settings
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
