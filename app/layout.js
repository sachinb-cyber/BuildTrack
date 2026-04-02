'use client';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
      </head>
      <body>
        <AuthProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#1a2235', color: '#fff', fontSize: '14px', borderRadius: '12px', padding: '12px 16px', border: '1px solid rgba(255,255,255,0.08)' } }} />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
