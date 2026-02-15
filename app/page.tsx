'use client';

import { useState, useEffect } from 'react';
import ThemeToggle from './components/ThemeToggle';

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
  const [phoneNumber, setPhoneNumber] = useState('');
  const [grade, setGrade] = useState('');
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
    if (!fullName || !email || !phoneNumber || !grade || !selectedSession) {
      setMessage('Mohon lengkapi semua field');
      setMessageType('error');
      setLoading(false);
      return;
    }

    if (!phoneNumber.startsWith('+62')) {
      setMessage('Nomor telepon harus dimulai dengan +62');
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
          grade,
          sessionId: selectedSession,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('Pendaftaran berhasil! Kami akan menghubungi Anda segera.');
        setMessageType('success');
        setFullName('');
        setEmail('');
        setPhoneNumber('');
        setGrade('');
        setSelectedSession('');
        fetchSessions(); // Refresh session data
      } else {
        setMessage(data.error || 'Pendaftaran gagal');
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Terjadi kesalahan. Silakan coba lagi.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-violet-700 dark:from-blue-800 dark:via-blue-900 dark:to-violet-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-6">
              <svg className="w-10 h-10 sm:w-12 sm:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
              Kampung Literasi Pancoran
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
              Program pembelajaran Bahasa Inggris gratis untuk siswa SD kelas 1-6 bersama mahasiswa Sampoerna University
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Registration Form */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 p-6 sm:p-8">
              <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Form Pendaftaran
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Lengkapi data berikut untuk mendaftar
                </p>
              </div>

              {message && (
                <div
                  className={`mb-6 p-4 rounded-lg border ${messageType === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      {messageType === 'success' ? (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      ) : (
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      )}
                    </svg>
                    <span className="font-medium">{message}</span>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Masukkan nama lengkap siswa"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Email Orang Tua/Wali <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="contoh@email.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Nomor Telepon Orang Tua/Wali <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+628123456789"
                    required
                  />
                  <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                    Format: +62 diikuti nomor telepon
                  </p>
                  <p className="mt-1.5 text-sm text-yellow-500 dark:text-yellow-400">
                    *Pastikan nomor telepon aktif dan dapat dihubungi melalui WhatsApp, karena kami akan mengirimkan informasi kelas melalui WhatsApp.
                  </p>
                </div>

                <div>
                  <label htmlFor="grade" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Kelas <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="grade"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Pilih kelas</option>
                    <option value="SD 1">SD 1</option>
                    <option value="SD 2">SD 2</option>
                    <option value="SD 3">SD 3</option>
                    <option value="SD 4">SD 4</option>
                    <option value="SD 5">SD 5</option>
                    <option value="SD 6">SD 6</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="session" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Pilih Jadwal Kelas <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="session"
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Pilih jadwal yang tersedia</option>
                    {sessions.map((session) => {
                      const isFull = session.currentRegistrations >= session.limit;
                      const sessionDate = new Date(session.date).toLocaleDateString('id-ID', {
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
                          {session.name} - {sessionDate} jam {session.time} ({session.currentRegistrations}/{session.limit} {isFull ? '- PENUH' : ''})
                        </option>
                      );
                    })}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm w-full py-3 px-6 text-base font-semibold rounded-lg"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Memproses...
                    </span>
                  ) : (
                    'Daftar Sekarang'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Available Sessions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Jadwal Tersedia
              </h3>
              <div className="space-y-3">
                {sessions.length > 0 ? (
                  sessions.slice(0, 4).map((session) => {
                    const isFull = session.currentRegistrations >= session.limit;
                    const spotsLeft = session.limit - session.currentRegistrations;
                    const percentage = (session.currentRegistrations / session.limit) * 100;
                    return (
                      <div
                        key={session._id}
                        className={`p-3 rounded-lg border transition-all ${isFull
                          ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 hover:border-blue-200 dark:hover:border-blue-700'
                          }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                          {session.name}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                          {new Date(session.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })} • {session.time}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className={`font-medium ${isFull ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                            {isFull ? 'Penuh' : `${spotsLeft} tempat tersisa`}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {session.currentRegistrations}/{session.limit}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : 'bg-blue-600 dark:bg-blue-500'
                              }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    Belum ada jadwal tersedia
                  </p>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                Hubungi Kami
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Punya pertanyaan? Hubungi kami!
              </p>
              <div className="space-y-3">
                <a
                  href="https://wa.me/6289627496474"
                  className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <div className="font-medium text-gray-900 dark:text-white text-sm">Grace</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">0896-2749-6474</div>
                </a>
                <a
                  href="https://wa.me/6285211579621"
                  className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <div className="font-medium text-gray-900 dark:text-white text-sm">Geneno</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">0852-1157-9621</div>
                </a>
              </div>
            </div>

            {/* Admin Link */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 p-4 text-center">
              <a
                href="/admin"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium inline-flex items-center gap-2 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z" clipRule="evenodd" />
                </svg>
                Admin Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
