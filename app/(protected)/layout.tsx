import ProtectedLayoutClient from '@/components/protected/protected-layout-client';

export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <ProtectedLayoutClient>{children}</ProtectedLayoutClient>;
}
