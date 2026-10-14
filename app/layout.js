import './globals.css';
import Script from 'next/script';

export const metadata = {
  title: 'Blogbio Social Planner — Facebook & Social Media Manager',
  description: 'Schedule, automate, and manage posts across Facebook & social channels with live feed previews.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-brand-blue selection:text-white">
        {children}
      </body>
    </html>
  );
}
