export const runtime = 'edge';

export const metadata = {
  title: 'Rel — Morning Briefing',
  description: 'OpenClaw daily operations briefing',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
