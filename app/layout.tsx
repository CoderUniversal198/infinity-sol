import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: { default: 'NovaWorks CRM', template: '%s · NovaWorks CRM' },
  description: 'Projects, people, and clear next steps for NovaWorks Technologies.',
  robots: { index: false, follow: false },
  icons: { icon: '/icon.svg' }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
