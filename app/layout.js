import './globals.css';

export const metadata = {
  title: 'Blogbio Social Planner — Facebook & Social Media Manager',
  description: 'Schedule, automate, and manage posts across Facebook & social channels with live feed previews.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-brand-blue selection:text-white">
        {children}
      </body>
    </html>
  );
}
