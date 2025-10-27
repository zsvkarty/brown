/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./*.html', './js/*.js'],
  theme: {
    extend: {
      colors: {
        'primary-dark': '#0f0f23',
        'primary-medium': '#1a1a2e',
        'accent-gold': '#c9a96e',
        'accent-copper': '#b08d57',
        'text-light': '#fafafa',
        'text-gray': '#64748b',
        'text-dark': '#1e293b',
        'error-red': '#ef4444',
        'success-green': '#10b981',
        'surface-light': '#f8fafc',
        'surface-dark': '#0f172a',
      },
      fontFamily: {
        'serif': ['Eczar', 'Georgia', 'serif'],
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'display': ['Eczar', 'Georgia', 'serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionDuration: {
        '200': '200ms',
        '300': '300ms',
      },
    },
  },
  plugins: [],
}