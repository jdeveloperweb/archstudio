import type { Config } from 'tailwindcss';

/* Tokens em variáveis CSS (globals.css): tema escuro por padrão (o estúdio),
   escopo .light para a entrada (landing/auth) clara e colorida. */
const v = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: v('--c-void'),
        bg: v('--c-bg'),
        panel: v('--c-panel'),
        panel2: v('--c-panel2'),
        border: v('--c-border'),
        ink: v('--c-ink'),
        dim: v('--c-dim'),
        // Acentos com papel: violeta = IA/conversa, ciano = dados, âmbar = infra
        accent: v('--c-accent'),
        pulse: v('--c-pulse'),
        aws: v('--c-aws'),
        sless: v('--c-sless'),
        red: v('--c-red'),
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
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(3%, -4%) scale(1.06)' },
          '66%': { transform: 'translate(-3%, 3%) scale(0.97)' },
        },
      },
      animation: {
        rise: 'rise 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both',
        caret: 'caret 1s step-end infinite',
        dash: 'dash 1.2s linear infinite',
        floaty: 'floaty 7s ease-in-out infinite',
        blob: 'blob 16s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
