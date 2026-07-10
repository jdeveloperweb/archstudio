import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ArchStudio — Arquitetura com IA',
  description:
    'Desenhe arquitetura de software no navegador, com um assistente de IA que projeta e desenha junto. Projetos privados, export PNG/SVG, sua própria chave de API.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-bg text-ink font-sans">{children}</body>
    </html>
  );
}
