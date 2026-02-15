'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Session {
  _id: string;
  name: string;
  date: string;
  time: string;
  limit: number;
  currentRegistrations: number;
}

interface Registration {
  _id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  sessionName: string;
  sessionDate: string;
  sessionTime: string;
  createdAt: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [showAddSession, setShowAddSession] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Form state for session
  const [sessionName, setSessionName] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [sessionLimit, setSessionLimit] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {
      const [sessionsRes, registrationsRes] = await Promise.all([
        fetch('/api/sessions'),
        fetch('/api/registrations'),
      ]);

      const sessionsData = await sessionsRes.json();
      const registrationsData = await registrationsRes.json();

      if (sessionsData.success) setSessions(sessionsData.sessions);
      if (registrationsData.success) setRegistrations(registrationsData.registrations);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        setIsAuthenticated(true);
        fetchData();
      } else {
        setLoginError(data.error || 'Invalid password');
      }
    } catch (error) {
      setLoginError('Login failed. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setPassword('');
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      const response = await fetch(`/api/admin/export?format=${format}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `registrations-${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting:', error);
      setMessage('Export failed');
    }
  };

  const handleAddSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: sessionName,
          date: sessionDate,
          time: sessionTime,
          limit: sessionLimit,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Session added successfully');
        setShowAddSession(false);
        resetSessionForm();
        fetchData();
      } else {
        setMessage(data.error || 'Failed to add session');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(`/api/sessions/${editingSession._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: sessionName,
          date: sessionDate,
          time: sessionTime,
          limit: sessionLimit,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Session updated successfully');
        setEditingSession(null);
        resetSessionForm();
        fetchData();
      } else {
        setMessage(data.error || 'Failed to update session');
      }
    } catch (error) {
      setMessage('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      const response = await fetch(`/api/sessions/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Session deleted successfully');
        fetchData();
      } else {
        setMessage(data.error || 'Failed to delete session');
      }
    } catch (error) {
      setMessage('An error occurred');
    }
  };

  const startEditSession = (session: Session) => {
    setEditingSession(session);
    setSessionName(session.name);
    setSessionDate(new Date(session.date).toISOString().split('T')[0]);
    setSessionTime(session.time);
    setSessionLimit(session.limit.toString());
    setShowAddSession(false);
  };

  const resetSessionForm = () => {
    setSessionName('');
    setSessionDate('');
    setSessionTime('');
    setSessionLimit('');
  };

  const cancelEdit = () => {
    setEditingSession(null);
    setShowAddSession(false);
    resetSessionForm();
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Admin Login
          </h1>

          {loginError && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
                placeholder="Enter admin password"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Login
            </button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Back to Registration
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="space-x-4">
            <a
              href="/"
              className="px-4 py-2 text-indigo-600 hover:text-indigo-800"
            >
              Registration Page
            </a>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
        </div>

        {message && (
          <div className="mb-4 p-4 rounded-lg bg-blue-50 text-blue-800 border border-blue-200">
            {message}
          </div>
        )}

        {/* Export Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Export Data</h2>
          <div className="space-x-4">
            <button
              onClick={() => handleExport('csv')}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Export as CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Export as Excel
            </button>
          </div>
        </div>

        {/* Sessions Management */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Sessions</h2>
            <button
              onClick={() => {
                setShowAddSession(true);
                setEditingSession(null);
                resetSessionForm();
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Add Session
            </button>
          </div>

          {(showAddSession || editingSession) && (
            <form
              onSubmit={editingSession ? handleUpdateSession : handleAddSession}
              className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50"
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                {editingSession ? 'Edit Session' : 'Add New Session'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Name
                  </label>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Person Limit
                  </label>
                  <input
                    type="number"
                    value={sessionLimit}
                    onChange={(e) => setSessionLimit(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="mt-4 space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {loading ? 'Saving...' : editingSession ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-900">Name</th>
                  <th className="px-4 py-3 text-left text-gray-900">Date</th>
                  <th className="px-4 py-3 text-left text-gray-900">Time</th>
                  <th className="px-4 py-3 text-left text-gray-900">Capacity</th>
                  <th className="px-4 py-3 text-left text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session._id} className="border-t border-gray-200">
                    <td className="px-4 py-3 text-gray-900">{session.name}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {new Date(session.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-900">{session.time}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {session.currentRegistrations}/{session.limit}
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <button
                        onClick={() => startEditSession(session)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Registrations List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Registrations ({registrations.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-900">Full Name</th>
                  <th className="px-4 py-3 text-left text-gray-900">Email</th>
                  <th className="px-4 py-3 text-left text-gray-900">Phone</th>
                  <th className="px-4 py-3 text-left text-gray-900">Session</th>
                  <th className="px-4 py-3 text-left text-gray-900">Date/Time</th>
                  <th className="px-4 py-3 text-left text-gray-900">Registered At</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg._id} className="border-t border-gray-200">
                    <td className="px-4 py-3 text-gray-900">{reg.fullName}</td>
                    <td className="px-4 py-3 text-gray-900">{reg.email}</td>
                    <td className="px-4 py-3 text-gray-900">{reg.phoneNumber}</td>
                    <td className="px-4 py-3 text-gray-900">{reg.sessionName}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {new Date(reg.sessionDate).toLocaleDateString()} {reg.sessionTime}
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {new Date(reg.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
