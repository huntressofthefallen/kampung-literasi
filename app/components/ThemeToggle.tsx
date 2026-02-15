'use client';

import { useTheme } from './ThemeProvider';

export default function ThemeToggle() {
  const { theme, setTheme, mounted } = useTheme();

  // Prevent rendering until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="relative inline-flex items-center gap-2 bg-gray-200 dark:bg-gray-700 rounded-lg p-1 shadow-sm">
      <button
        onClick={() => {
          console.log('Setting theme to light');
          setTheme('light');
        }}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${theme === 'light'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        title="Light mode"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
        </svg>
      </button>
      <button
        onClick={() => {
          console.log('Setting theme to system');
          setTheme('system');
        }}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${theme === 'system'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        title="System preference"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
        </svg>
      </button>
      <button
        onClick={() => {
          console.log('Setting theme to dark');
          setTheme('dark');
        }}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${theme === 'dark'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
          }`}
        title="Dark mode"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      </button>
    </div>
  );
}
