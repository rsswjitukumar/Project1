import type { Metadata } from 'next';
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
      </body>
    </html>
  );
}
