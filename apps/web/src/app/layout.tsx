import './globals.css';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'ArchStudio — a arquitetura se desenha enquanto você conversa',
  description:
    'Descreva o sistema em português e veja o diagrama de arquitetura ser desenhado na hora por um assistente de IA. Projetos privados, sua própria chave de API, export PNG/SVG e geração de infra (CDK/Terraform) a partir do desenho.',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut: ['/favicon.svg'],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f9f9fe' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0e1a' },
  ],
};

// Aplica o tema salvo antes da primeira pintura, evitando flash de tema errado.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('as-theme')||'light';if(t==='system'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark'||t==='midnight'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-bg font-sans text-ink">{children}</body>
    </html>
  );
}
