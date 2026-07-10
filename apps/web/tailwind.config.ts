import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0e1017',
        panel: '#151824',
        panel2: '#1c2032',
        border: '#2a2f47',
        ink: '#e6e8f2',
        dim: '#8f94ad',
        accent: '#a679ff',
        aws: '#ff9900',
        sless: '#4ade80',
        red: '#f87171',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Cascadia Code', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
