import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: { deep: '#0A0A0A', card: '#141414', hover: '#1E1E1E' },
        text: { primary: '#FFFFFF', muted: '#9A9A9A', dim: '#5A5A5A' },
        gold: { DEFAULT: '#C9A84C', bright: '#E8C86A' },
        accent: {
          green: '#3CAC3B',
          'green-bright': '#3CAC3B',
          red: '#E61D25',
          'red-bright': '#E61D25',
          usa: '#2A398D',
          can: '#E61D25',
          mex: '#3CAC3B',
        },
      },
      fontFamily: {
        display: ['Bebas Neue', 'Impact', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
