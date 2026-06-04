import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1D9E75',
          light: '#E1F5EE',
          dark: '#085041',
        },
        warn: {
          DEFAULT: '#EF9F27',
          light: '#FAEEDA',
        },
        danger: '#E24B4A',
        surface: '#FFFFFF',
        bg: '#F4F6F5',
        border: 'rgba(0,0,0,0.08)',
        'text-primary': '#1A1A1A',
        'text-secondary': '#6B7280',
        'text-tertiary': '#9CA3AF',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '8px',
        inline: '4px',
      },
      boxShadow: {
        focus: '0 0 0 2px #1D9E75',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
