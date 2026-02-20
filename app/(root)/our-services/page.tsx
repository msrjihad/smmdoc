import { auth } from '@/auth';
import { db } from '@/lib/db';
import { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';

const Hero = dynamic(() => import('@/components/frontend/our-services/hero'));
const Services = dynamic(() => import('@/components/frontend/our-services/services'));

export const metadata: Metadata = {
  title: 'Our Services',
  description: 'Explore our comprehensive social media marketing services.',
};

export default async function OurServicesPage() {

  const moduleSettings = await db.moduleSettings.findFirst();
  const servicesListPublic = moduleSettings?.servicesListPublic ?? true;

  if (!servicesListPublic) {
    const session = await auth();
    if (!session?.user) {
      redirect('/sign-in?callbackUrl=/our-services&reason=services-restricted');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
      <Hero />
      <Services />
    </div>
  );
}
