'use client';

import { useState, useEffect } from 'react';

interface Session {
  _id: string;
  name: string;
  date: string;
  time: string;
  limit: number;
  currentRegistrations: number;
}

export default function Home() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+62');
  const [selectedSession, setSelectedSession] = useState('');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch('/api/sessions');
      const data = await response.json();
      if (data.success) {
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validation
    if (!fullName || !email || !phoneNumber || !selectedSession) {
      setMessage('Please fill in all fields');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (!phoneNumber.startsWith('+62')) {
      setMessage('Phone number must start with +62');
      setMessageType('error');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email,
          phoneNumber,
          sessionId: selectedSession,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Registration successful!');
        setMessageType('success');
        setFullName('');
        setEmail('');
        setPhoneNumber('+62');
        setSelectedSession('');
        fetchSessions(); // Refresh session data
      } else {
        setMessage(data.error || 'Registration failed');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Kampung Literasi
          </h1>
          <p className="text-gray-600">Session Registration</p>
        </div>

        {message && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              messageType === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              placeholder="your.email@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              placeholder="+62812345678"
              required
            />
          </div>

          <div>
            <label htmlFor="session" className="block text-sm font-medium text-gray-700 mb-2">
              Choose Session
            </label>
            <select
              id="session"
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              required
            >
              <option value="">Select a session</option>
              {sessions.map((session) => {
                const isFull = session.currentRegistrations >= session.limit;
                const sessionDate = new Date(session.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                });
                return (
                  <option
                    key={session._id}
                    value={session._id}
                    disabled={isFull}
                  >
                    {session.name} - {sessionDate} at {session.time} ({session.currentRegistrations}/{session.limit} {isFull ? '- FULL' : ''})
                  </option>
                );
              })}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <a
            href="/admin"
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            Admin Access
          </a>
        </div>
      </div>
    </main>
  );
}
