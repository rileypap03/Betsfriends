import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: { deep: '#020F2A', card: '#0A1A3D', hover: '#11244F' },
        text: { primary: '#FFFFFF', muted: '#8A9BBF', dim: '#5A6B8C' },
        gold: { DEFAULT: '#C9A557', bright: '#E5C56E' },
        accent: {
          green: '#00754A',
          'green-bright': '#00C775',
          red: '#E4002B',
          'red-bright': '#FF4D6D',
          irl: '#169B62',
          irl2: '#FF883E',
          eng: '#CE1124',
          eng2: '#7A0F1E',
        },
      },
      fontFamily: {
        display: ['Anton', 'Impact', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
