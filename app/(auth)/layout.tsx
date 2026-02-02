import AuthLayoutClient from '@/components/auth/auth-layout-client';

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AuthLayoutClient>{children}</AuthLayoutClient>;
}
