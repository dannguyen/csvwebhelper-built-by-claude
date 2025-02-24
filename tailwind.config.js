/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: '#4361ee',
        'primary-light': '#4895ef',
        'primary-dark': '#3f37c9',
        success: '#4cc9f0',
        danger: '#f72585',
        'bg-light': '#f8f9fa',
        'bg-dark': '#212529',
        text: '#212529',
        'text-light': '#495057',
        border: '#dee2e6',
      },
      boxShadow: {
        DEFAULT: '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        DEFAULT: '8px',
      },
    },
  },
  plugins: [],
};