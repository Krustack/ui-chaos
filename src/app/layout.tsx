import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'User Inyerface Clone',
  description: 'A browser multiplayer challenge game built from the project spec.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
