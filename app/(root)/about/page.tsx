import { Metadata } from 'next';
import dynamic from 'next/dynamic';

const Hero = dynamic(() => import('@/components/frontend/about/hero'));
const Mission = dynamic(() => import('@/components/frontend/about/mission'));
const Vision = dynamic(() => import('@/components/frontend/about/vision'));
const Team = dynamic(() => import('@/components/frontend/about/team'));
const Services = dynamic(() => import('@/components/frontend/about/services'));
const CTA = dynamic(() => import('@/components/frontend/about/cta'));
const WhyDifferent = dynamic(() => import('@/components/frontend/about/why-different'));

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Founded in 2018, SMMDOC is a leading provider of affordable and effective social media marketing services in Bangladesh. Discover our mission, vision, and comprehensive SMM solutions.',
  keywords:
    'About SMMDOC, SMM Panel Bangladesh, Social Media Marketing Company, Affordable SMM Services, Digital Marketing Bangladesh, Facebook Instagram Twitter YouTube LinkedIn TikTok',
};

export default function AboutPage() {
  return (
    <main>
      <Hero />
      <Mission />
      <Vision />
      <Team />
      <Services />
      <CTA />
      <WhyDifferent />
    </main>
  );
}
