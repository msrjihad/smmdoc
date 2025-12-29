import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import PublicContactSystemGuard from '@/components/public-contact-system-guard';

const Hero = dynamic(() => import('@/components/frontend/contact/hero'), {
  loading: () => null,
});
const HowToContact = dynamic(() => import('@/components/frontend/contact/how-to-contact'), {
  loading: () => null,
});

export const metadata: Metadata = {
  title: 'Contact Us - SMMDOC',
  description: 'Get in touch with SMMDOC for all your social media marketing needs. We\'re here to help you grow your online presence.',
};

export default function ContactPage() {
  return (
    <PublicContactSystemGuard>
      <Hero />
      <HowToContact />
    </PublicContactSystemGuard>
  );
}
