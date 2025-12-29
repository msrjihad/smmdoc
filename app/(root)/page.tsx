import dynamic from 'next/dynamic';
import { Metadata } from 'next';
import { getMetaSettings, getOpenGraphImageUrl } from '@/lib/utils/meta-settings';

const Hero = dynamic(() => import('@/components/frontend/homepage/hero'));
const Statistics = dynamic(() => import('@/components/frontend/homepage/statistics'));
const About = dynamic(() => import('@/components/frontend/homepage/about'));
const Platforms = dynamic(() => import('@/components/frontend/homepage/platforms'));
const WhyChooseUs = dynamic(() => import('@/components/frontend/homepage/why-choose-us'));
const HowItWorks = dynamic(() => import('@/components/frontend/homepage/how-it-works'));
const Testimonials = dynamic(() => import('@/components/frontend/homepage/testimonials'));
const FAQs = dynamic(() => import('@/components/frontend/homepage/faqs'));

export async function generateMetadata(): Promise<Metadata> {
  const metaSettings = await getMetaSettings();
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    throw new Error('NEXT_PUBLIC_APP_URL environment variable is required');
  }
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  const openGraphImage = getOpenGraphImageUrl(metaSettings.thumbnail, baseUrl);

  return {
    title: {
      absolute: metaSettings.googleTitle,
    },
    description: metaSettings.siteDescription,
    keywords: metaSettings.keywords,
    openGraph: {
      title: metaSettings.googleTitle,
      description: metaSettings.siteDescription,
      images: [{
        url: openGraphImage,
        width: 1200,
        height: 630,
        alt: metaSettings.siteTitle,
      }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: metaSettings.googleTitle,
      description: metaSettings.siteDescription,
      images: [openGraphImage],
    },
    other: {
      'og:site_name': metaSettings.siteTitle,
    },
  };
}

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Statistics />
      <About />
      <Platforms />
      <WhyChooseUs />
      <HowItWorks />
      <Testimonials />
      <FAQs />
    </main>
  );
}