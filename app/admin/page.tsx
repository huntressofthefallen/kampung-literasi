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
  phoneNumber: string;
  grade: string;
  sessionId: string;
  sessionName: string;
  sessionDate: string;
  sessionTime: string;
  createdAt: string;
}

interface Alert {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [showAddSession, setShowAddSession] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedExportSession, setSelectedExportSession] = useState('all');
  const [selectedRegistrationSession, setSelectedRegistrationSession] = useState('all');

  // Registration modal state
  const [showAddRegistration, setShowAddRegistration] = useState(false);
  const [editingRegistration, setEditingRegistration] = useState<Registration | null>(null);
  const [regFullName, setRegFullName] = useState('');
  const [regPhoneNumber, setRegPhoneNumber] = useState('');
  const [regGrade, setRegGrade] = useState('');
  const [regSessionId, setRegSessionId] = useState('');

  // Alert state
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertIdCounter, setAlertIdCounter] = useState(0);

  // Sorting state
  const [sessionSortKey, setSessionSortKey] = useState<keyof Session | ''>('');
  const [sessionSortDirection, setSessionSortDirection] = useState<'asc' | 'desc'>('asc');
  const [registrationSortKey, setRegistrationSortKey] = useState<keyof Registration | ''>('');
  const [registrationSortDirection, setRegistrationSortDirection] = useState<'asc' | 'desc'>('asc');

  // Form state for session
  const [sessionName, setSessionName] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [sessionLimit, setSessionLimit] = useState('');

  // Alert functions
  const addAlert = (type: 'success' | 'error' | 'info', message: string) => {
    const newAlert: Alert = {
      id: alertIdCounter,
      type,
      message,
    };
    setAlerts((prev) => [...prev, newAlert]);
    setAlertIdCounter((prev) => prev + 1);

    // Auto-remove alert after 5 seconds
    setTimeout(() => {
      removeAlert(newAlert.id);
    }, 5000);
  };

  const removeAlert = (id: number) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  // Phone number normalization
  const normalizePhoneNumber = (phone: string): string => {
    if (!phone || !phone.trim()) return phone;

    // Remove all spaces, dashes, parentheses, and other non-numeric characters except +
    let cleaned = phone.replace(/[\s\-()]/g, '');

    // If already in correct format, return as is
    if (cleaned.match(/^\+628\d+$/)) {
      return cleaned;
    }

    // Remove any + symbols and leading zeros to work with just numbers
    cleaned = cleaned.replace(/\+/g, '');

    // Handle different starting patterns
    if (cleaned.startsWith('62')) {
      // Already has country code (62xxx...)
      return '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      // Starts with 0 (08xxx...) - remove the 0 and add +62
      return '+62' + cleaned.substring(1);
    } else if (cleaned.startsWith('8')) {
      // Starts with 8 (8xxx...) - add +62
      return '+62' + cleaned;
    }

    // If it doesn't match expected patterns, return original
    return phone;
  };

  const handlePhoneNumberBlur = () => {
    // Only normalize when user leaves the field
    if (regPhoneNumber.trim()) {
      const normalized = normalizePhoneNumber(regPhoneNumber);
      setRegPhoneNumber(normalized);
    }
  };

  // Sorting functions
  const handleSessionSort = (key: keyof Session) => {
    if (sessionSortKey === key) {
      setSessionSortDirection(sessionSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSessionSortKey(key);
      setSessionSortDirection('asc');
    }
  };

  const handleRegistrationSort = (key: keyof Registration) => {
    if (registrationSortKey === key) {
      setRegistrationSortDirection(registrationSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setRegistrationSortKey(key);
      setRegistrationSortDirection('asc');
    }
  };

  const getSortedSessions = () => {
    if (!sessionSortKey) return sessions;

    return [...sessions].sort((a, b) => {
      let aValue = a[sessionSortKey];
      let bValue = b[sessionSortKey];

      // Convert to lowercase for case-insensitive comparison if strings
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return sessionSortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sessionSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const getSortedRegistrations = () => {
    const filtered = registrations.filter((reg) => {
      if (selectedRegistrationSession === 'all') return true;
      const selectedSession = sessions.find(s => s._id === selectedRegistrationSession);
      return reg.sessionName === selectedSession?.name;
    });

    if (!registrationSortKey) return filtered;

    return [...filtered].sort((a, b) => {
      let aValue = a[registrationSortKey];
      let bValue = b[registrationSortKey];

      // Convert to lowercase for case-insensitive comparison if strings
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (aValue < bValue) return registrationSortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return registrationSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const SortIcon = ({ active, direction }: { active: boolean; direction: 'asc' | 'desc' }) => {
    if (!active) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    if (direction === 'asc') {
      return (
        <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      );
    }

    return (
      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('adminToken');
    if (token) {
      setIsAuthenticated(true);
      fetchData();
    }
  }, []);

  useEffect(() => {
    // Setup SSE connection for real-time updates via MongoDB Change Streams
    if (!isAuthenticated) return;

    console.log('[Admin] Connecting to SSE...');
    const eventSource = new EventSource('/api/sse');

    eventSource.onopen = () => {
      console.log('[Admin] SSE connection established');
    };

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('[Admin] SSE message:', data);

      // Refresh data when we receive database change notifications
      if (data.type === 'sessions' || data.type === 'registrations') {
        console.log('[Admin] Refreshing data due to', data.type, 'change');
        fetchData();

        // Show alert based on the event type
        if (data.type === 'registrations') {
          addAlert('info', 'Data pendaftaran telah diperbarui');
        }
      }
    };

    eventSource.onerror = (error) => {
      console.error('[Admin] SSE error:', error);
      // EventSource automatically reconnects
    };

    return () => {
      console.log('[Admin] Closing SSE connection');
      eventSource.close();
    };
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const [sessionsRes, registrationsRes] = await Promise.all([
        fetch('/api/sessions'),
        fetch('/api/registrations'),
      ]);

      const sessionsData = await sessionsRes.json();
      const registrationsData = await registrationsRes.json();

      if (sessionsData.success) setSessions(sessionsData.sessions);
      if (registrationsData.success) {
        // Ensure registrations have sessionId field
        const mappedRegistrations = registrationsData.registrations.map((reg: any) => ({
          ...reg,
          sessionId: reg.sessionId || reg._id,
        }));
        setRegistrations(mappedRegistrations);
      }
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

  // Registration management functions
  const handleAddRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          students: [{
            fullName: regFullName,
            grade: regGrade,
          }],
          phoneNumber: regPhoneNumber,
          sessionId: regSessionId,
          bypassLimit: true, // Allow admin to exceed session limit
        }),
      });

      const data = await response.json();

      if (data.success) {
        addAlert('success', 'Pendaftaran berhasil ditambahkan');
        setShowAddRegistration(false);
        resetRegistrationForm();
        fetchData();
      } else {
        addAlert('error', data.error || 'Gagal menambahkan pendaftaran');
      }
    } catch (error) {
      addAlert('error', 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRegistration) return;

    setLoading(true);

    try {
      const response = await fetch(`/api/registrations/${editingRegistration._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: regFullName,
          phoneNumber: regPhoneNumber,
          grade: regGrade,
          sessionId: regSessionId,
          bypassLimit: true, // Allow admin to exceed session limit
        }),
      });

      const data = await response.json();

      if (data.success) {
        addAlert('success', 'Pendaftaran berhasil diperbarui');
        setEditingRegistration(null);
        resetRegistrationForm();
        fetchData();
      } else {
        addAlert('error', data.error || 'Gagal memperbarui pendaftaran');
      }
    } catch (error) {
      addAlert('error', 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const startEditRegistration = (registration: Registration) => {
    setEditingRegistration(registration);
    setRegFullName(registration.fullName);
    setRegPhoneNumber(registration.phoneNumber);
    setRegGrade(registration.grade);
    setRegSessionId(registration.sessionId);
    setShowAddRegistration(false);
  };

  const resetRegistrationForm = () => {
    setRegFullName('');
    setRegPhoneNumber('');
    setRegGrade('');
    setRegSessionId('');
  };

  const cancelRegistrationEdit = () => {
    setEditingRegistration(null);
    setShowAddRegistration(false);
    resetRegistrationForm();
  };

  const handleDeleteRegistration = async (id: string) => {
    if (!confirm('Are you sure you want to delete this registration?')) return;

    try {
      const response = await fetch(`/api/registrations/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        addAlert('success', 'Pendaftaran berhasil dihapus');
        fetchData();
      } else {
        addAlert('error', data.error || 'Gagal menghapus pendaftaran');
      }
    } catch (error) {
      addAlert('error', 'Terjadi kesalahan');
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
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Admin Login
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Masukkan password untuk mengakses dashboard
              </p>
            </div>

            {loginError && (
              <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-700">
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
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-12 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan password admin"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
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
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
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

        {/* Alerts */}
        <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg shadow-lg border flex items-start gap-3 animate-slide-in ${alert.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700'
                : alert.type === 'error'
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700'
                  : 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700'
                }`}
            >
              <div className="flex-shrink-0">
                {alert.type === 'success' && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
                {alert.type === 'error' && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
                {alert.type === 'info' && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="flex-1 font-medium text-sm">{alert.message}</div>
              <button
                onClick={() => removeAlert(alert.id)}
                className="flex-shrink-0 hover:opacity-70 transition-opacity"
                aria-label="Tutup"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>

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
                  <th
                    className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                    onClick={() => handleSessionSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      <SortIcon active={sessionSortKey === 'name'} direction={sessionSortDirection} />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                    onClick={() => handleSessionSort('date')}
                  >
                    <div className="flex items-center gap-2">
                      Date
                      <SortIcon active={sessionSortKey === 'date'} direction={sessionSortDirection} />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                    onClick={() => handleSessionSort('time')}
                  >
                    <div className="flex items-center gap-2">
                      Time
                      <SortIcon active={sessionSortKey === 'time'} direction={sessionSortDirection} />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                    onClick={() => handleSessionSort('currentRegistrations')}
                  >
                    <div className="flex items-center gap-2">
                      Capacity
                      <SortIcon active={sessionSortKey === 'currentRegistrations'} direction={sessionSortDirection} />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getSortedSessions().map((session) => (
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
              Registrations ({selectedRegistrationSession === 'all' ? registrations.length : registrations.filter(r => r.sessionName === sessions.find(s => s._id === selectedRegistrationSession)?.name).length})
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                onClick={() => {
                  setShowAddRegistration(true);
                  setEditingRegistration(null);
                  resetRegistrationForm();
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Add Registration
              </button>
              <button
                onClick={handleResetAllRegistrations}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Reset All
              </button>
            </div>
          </div>

          {/* Registration Modal */}
          {(showAddRegistration || editingRegistration) && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    {editingRegistration ? 'Edit Registration' : 'Add New Registration'}
                  </h3>
                  <form onSubmit={editingRegistration ? handleUpdateRegistration : handleAddRegistration} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={regPhoneNumber}
                        onChange={(e) => setRegPhoneNumber(e.target.value)}
                        onBlur={handlePhoneNumberBlur}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="+628XXXXXXXXXX"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Grade
                      </label>
                      <select
                        value={regGrade}
                        onChange={(e) => setRegGrade(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      >
                        <option value="">Select Grade</option>
                        <option value="SD 1">SD 1</option>
                        <option value="SD 2">SD 2</option>
                        <option value="SD 3">SD 3</option>
                        <option value="SD 4">SD 4</option>
                        <option value="SD 5">SD 5</option>
                        <option value="SD 6">SD 6</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Session
                      </label>
                      <select
                        value={regSessionId}
                        onChange={(e) => setRegSessionId(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        required
                      >
                        <option value="">Select Session</option>
                        {sessions.map((session) => {
                          const sessionDate = new Date(session.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          });
                          return (
                            <option key={session._id} value={session._id}>
                              {session.name} - {sessionDate} • {session.time} ({session.currentRegistrations}/{session.limit})
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
                      >
                        {loading ? 'Saving...' : editingRegistration ? 'Update' : 'Add'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelRegistrationEdit}
                        className="flex-1 px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="registrationSessionFilter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Session
            </label>
            <select
              id="registrationSessionFilter"
              value={selectedRegistrationSession}
              onChange={(e) => setSelectedRegistrationSession(e.target.value)}
              className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="all">All Sessions</option>
              {sessions.map((session) => {
                const sessionDate = new Date(session.date).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                });
                const sessionRegistrations = registrations.filter(r => r.sessionName === session.name).length;
                return (
                  <option key={session._id} value={session._id}>
                    {session.name} - {sessionDate} • {session.time} ({sessionRegistrations} registrations)
                  </option>
                );
              })}
            </select>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                    onClick={() => handleRegistrationSort('fullName')}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      <SortIcon active={registrationSortKey === 'fullName'} direction={registrationSortDirection} />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                    onClick={() => handleRegistrationSort('phoneNumber')}
                  >
                    <div className="flex items-center gap-2">
                      Phone
                      <SortIcon active={registrationSortKey === 'phoneNumber'} direction={registrationSortDirection} />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                    onClick={() => handleRegistrationSort('grade')}
                  >
                    <div className="flex items-center gap-2">
                      Grade
                      <SortIcon active={registrationSortKey === 'grade'} direction={registrationSortDirection} />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                    onClick={() => handleRegistrationSort('sessionName')}
                  >
                    <div className="flex items-center gap-2">
                      Session
                      <SortIcon active={registrationSortKey === 'sessionName'} direction={registrationSortDirection} />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                    onClick={() => handleRegistrationSort('sessionDate')}
                  >
                    <div className="flex items-center gap-2">
                      Date/Time
                      <SortIcon active={registrationSortKey === 'sessionDate'} direction={registrationSortDirection} />
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                    onClick={() => handleRegistrationSort('createdAt')}
                  >
                    <div className="flex items-center gap-2">
                      Registered
                      <SortIcon active={registrationSortKey === 'createdAt'} direction={registrationSortDirection} />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {getSortedRegistrations().map((reg) => (
                  <tr key={reg._id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-4 py-3 text-gray-900 dark:text-white text-sm font-medium">{reg.fullName}</td>
                    <td className="px-4 py-3 text-sm">
                      <a
                        href={`https://wa.me/${reg.phoneNumber.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                      >
                        {reg.phoneNumber}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white text-sm font-medium">{reg.grade}</td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white text-sm">{reg.sessionName}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(reg.sessionDate).toLocaleDateString('id-ID')} {reg.sessionTime}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 text-sm">
                      {new Date(reg.createdAt).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <button
                        onClick={() => startEditRegistration(reg)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium text-sm"
                      >
                        Edit
                      </button>
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
