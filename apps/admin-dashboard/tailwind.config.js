/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'salex': {
          'black': '#000000',
          'black-light': '#0A0A0A',
          'black-lighter': '#141414',
          'green': '#00FF00',
          'green-dark': '#00CC00',
          'blue': '#00AAFF',
          'amber': '#FFB800',
          'red': '#FF3333',
          'gray': '#888888',
          'gray-dark': '#555555',
          'gray-darker': '#444444',
          'gray-border': '#333333',
          'gray-variant': '#1A1A1A',
          'white': '#FFFFFF',
        },
      },
      backgroundColor: {
        'salex-primary': '#000000',
        'salex-secondary': '#0A0A0A',
        'salex-tertiary': '#141414',
      },
      textColor: {
        'salex-primary': '#FFFFFF',
        'salex-secondary': '#888888',
        'salex-tertiary': '#555555',
      },
      fontSize: {
        'salex-xs': '12px',
        'salex-sm': '14px',
        'salex-base': '16px',
        'salex-lg': '20px',
        'salex-xl': '28px',
        'salex-2xl': '34px',
        'salex-calc-sm': '32px',
        'salex-calc-md': '48px',
        'salex-calc-lg': '64px',
      },
      fontWeight: {
        'salex-normal': 400,
        'salex-medium': 600,
        'salex-bold': 700,
        'salex-calc': 900,
      },
      borderRadius: {
        'salex-sm': '6px',
        'salex-md': '10px',
        'salex-lg': '14px',
        'salex-xl': '20px',
      },
      spacing: {
        'salex-xs': '4px',
        'salex-sm': '8px',
        'salex-md': '12px',
        'salex-lg': '16px',
        'salex-xl': '24px',
        'salex-xxl': '32px',
      },
      boxShadow: {
        'salex-sm': '0 0 0 1px rgba(0, 255, 0, 0.1)',
        'salex-md': '0 2px 4px rgba(0, 255, 0, 0.1)',
        'salex-lg': '0 4px 8px rgba(0, 255, 0, 0.15)',
        'salex-xl': '0 8px 16px rgba(0, 255, 0, 0.2)',
      },
      minHeight: {
        'touch': '44px',
      },
      minWidth: {
        'touch': '44px',
      },
    },
  },
  plugins: [],
};
