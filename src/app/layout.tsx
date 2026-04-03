import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import Script from 'next/script'; // Import Script
import './globals.css';

export const metadata: Metadata = {
  title: 'LuckSpin Arena | Real-Money Digital Gaming',
  description: 'Play Luck Ludo, Spin Wheel, and fast-paced contests to win real money instantly.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Script 
          src="https://checkout.razorpay.com/v1/checkout.js" 
          strategy="beforeInteractive" 
        />
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
