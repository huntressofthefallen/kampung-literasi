'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '../components/ThemeToggle';

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
  grade: string;
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
  const [selectedExportSession, setSelectedExportSession] = useState('all');

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
      const sessionParam = selectedExportSession !== 'all' ? `&sessionId=${selectedExportSession}` : '';
      const response = await fetch(`/api/admin/export?format=${format}${sessionParam}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Get session name for filename
      const sessionName = selectedExportSession !== 'all'
        ? sessions.find(s => s._id === selectedExportSession)?.name.replace(/\s+/g, '-') || 'session'
        : 'all';

      a.download = `registrations-${sessionName}-${Date.now()}.${format === 'excel' ? 'xlsx' : 'csv'}`;
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

  const handleDeleteRegistration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this registration?')) return;

    try {
      const response = await fetch(`/api/registrations/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Registration deleted successfully');
        fetchData();
      } else {
        setMessage(data.error || 'Failed to delete registration');
      }
    } catch (error) {
      setMessage('An error occurred');
    }
  };

  const handleResetAllRegistrations = async () => {
    if (!confirm('⚠️ WARNING: This will delete ALL registrations and reset session counts. This action cannot be undone. Are you absolutely sure?')) return;

    try {
      const response = await fetch('/api/registrations', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`All registrations deleted successfully (${data.deletedCount} registrations removed)`);
        fetchData();
      } else {
        setMessage(data.error || 'Failed to delete registrations');
      }
    } catch (error) {
      setMessage('An error occurred');
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Admin Login
              </h1>
              <p className="text-gray-600 text-sm">
                Masukkan password untuk mengakses dashboard
              </p>
            </div>

            {loginError && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{loginError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Masukkan password admin"
                  required
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm w-full py-3 font-semibold rounded-lg"
              >
                Login
              </button>
            </form>

            <div className="mt-6 text-center">
              <a
                href="/"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                ← Kembali ke Halaman Pendaftaran
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 lg:p-8">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center sm:text-left">
              <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">Kampung Literasi Bahasa Inggris</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <a
                href="/"
                className="px-4 sm:px-6 py-2 sm:py-3 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium text-center border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Back to Registration
              </a>
              <button
                onClick={handleLogout}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div className="mb-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 font-medium">
            {message}
          </div>
        )}

        {/* Export Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8 mb-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            Export Data
          </h2>

          <div className="mb-4">
            <label htmlFor="exportSessionFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Session
            </label>
            <select
              id="exportSessionFilter"
              value={selectedExportSession}
              onChange={(e) => setSelectedExportSession(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="all">All Sessions</option>
              {sessions.map((session) => {
                const sessionDate = new Date(session.date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                return (
                  <option key={session._id} value={session._id}>
                    {session.name} - {sessionDate} • {session.time} ({session.currentRegistrations} registrations)
                  </option>
                );
              })}
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleExport('csv')}
              className="flex-1 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 font-medium transition-colors"
            >
              Export to CSV
            </button>
            <button
              onClick={() => handleExport('excel')}
              className="flex-1 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 font-medium transition-colors"
            >
              Export to Excel
            </button>
          </div>
        </div>

        {/* Sessions Management */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8 mb-6 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
              Manage Sessions
            </h2>
            <button
              onClick={() => {
                setShowAddSession(true);
                setEditingSession(null);
                resetSessionForm();
              }}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Add New Session
            </button>
          </div>

          {(showAddSession || editingSession) && (
            <form
              onSubmit={editingSession ? handleUpdateSession : handleAddSession}
              className="mb-6 p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50"
            >
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                {editingSession ? 'Edit Session' : 'Add New Session'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Session Name
                  </label>
                  <input
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Participant Limit
                  </label>
                  <input
                    type="number"
                    value={sessionLimit}
                    onChange={(e) => setSessionLimit(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {loading ? 'Saving...' : editingSession ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm">Name</th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm">Date</th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm">Time</th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm">Capacity</th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr key={session._id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-gray-900 dark:text-white text-sm font-medium">{session.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(session.date).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">{session.time}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white text-sm font-medium">
                      {session.currentRegistrations}/{session.limit}
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <button
                        onClick={() => startEditSession(session)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session._id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium text-sm"
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
              Registrations ({registrations.length})
            </h2>
            <button
              onClick={handleResetAllRegistrations}
              className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
            >
              Reset All
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm">Name</th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm">Email</th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm">Phone</th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm">Grade</th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm">Session</th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm">Date/Time</th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm">Registered</th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr key={reg._id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-gray-900 dark:text-white text-sm font-medium">{reg.fullName}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">{reg.email}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">{reg.phoneNumber}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white text-sm font-medium">{reg.grade}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white text-sm">{reg.sessionName}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(reg.sessionDate).toLocaleDateString('id-ID')} {reg.sessionTime}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(reg.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteRegistration(reg._id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium text-sm"
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
      </div>
    </main>
  );
}
