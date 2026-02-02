import Footer from '@/components/frontend/footer';
import Header from '@/components/frontend/header';
import LiveChatWidget from '@/components/frontend/live-chat-widget';
import ScrollToTop from '@/components/frontend/scroll-to-top';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <LiveChatWidget />
      <ScrollToTop />
    </div>
  );
}
