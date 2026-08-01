import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#dc2626',
          hover: '#b91c1c',
          light: '#ef4444',
        },
        sidebar: {
          DEFAULT: '#1e293b',
          hover: '#334155',
          text: '#94a3b8',
        },
        certificate: {
          blue: '#0D47A1',
          light: '#3b82f6',
        },
        status: {
          active: '#22c55e',
          due: '#f59e0b',
          expired: '#ef4444',
        },
        bg: {
          main: '#f8fafc',
          card: '#ffffff',
          dark: '#0f172a',
          dark_card: '#1e293b',
        },
        text: {
          dark: '#0f172a',
          muted: '#64748b',
          light: '#94a3b8',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'card-lg': '0 10px 30px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [],
};

export default config;
