import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Superfícies — azul-tinta profundo (prancheta), nunca preto puro
        void: '#06070d',
        bg: '#0b0e1a',
        panel: '#121628',
        panel2: '#1a1f38',
        border: '#272e52',
        ink: '#edeffa',
        dim: '#8d93b8',
        // Acentos com papel: violeta = IA/conversa, ciano = dados em movimento,
        // âmbar = infraestrutura gerada
        accent: '#a679ff',
        pulse: '#5ee7ff',
        aws: '#ffb454',
        sless: '#4ade80',
        red: '#f87171',
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['"Bricolage Grotesque"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Cascadia Code', 'Consolas', 'monospace'],
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        drift: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
        caret: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        dash: {
          to: { strokeDashoffset: '-24' },
        },
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      animation: {
        rise: 'rise 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        caret: 'caret 1s step-end infinite',
        dash: 'dash 1.2s linear infinite',
        floaty: 'floaty 7s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
