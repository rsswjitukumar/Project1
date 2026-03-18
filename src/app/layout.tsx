import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'SkillSpin Arena | Real-Money Digital Gaming',
  description: 'Play Skill Ludo, Spin Wheel, and fast-paced contests to win real money instantly.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <main className="app-main">
          {children}
        </main>
        <Toaster 
          position="top-center" 
          toastOptions={{ 
            style: { 
              background: 'var(--surface)', 
              color: '#fff', 
              border: '1px solid var(--border)' 
            } 
          }} 
        />
      </body>
    </html>
  );
}
