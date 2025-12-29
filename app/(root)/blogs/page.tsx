import BlogPage from '@/components/frontend/blogs/page';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Explore insights and trends on our SMMDOC blog. Stay informed with our latest articles on social media strategies and digital marketing excellence.',
  keywords:
    'SMMDOC Blog, Social Media Strategies, Digital Marketing Tips, SMM Panel Bangladesh, TikTok Marketing, Instagram Growth, Twitter SMM, Social Media Trends 2025, B2B Marketing, Personal Branding',
  openGraph: {
    title: 'Latest Articles on Social Media Strategies - SMMDOC',
    description:
      'Explore insights and trends on our SMMDOC blog. Stay informed with our latest articles on social media strategies and digital marketing excellence.',
    type: 'website',
    url: 'https://www.smmdoc.com/blog',
    images: [
      {
        url: '/images/blog-og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SMMDOC Blog - Social Media Marketing Insights',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Latest Articles on Social Media Strategies - SMMDOC',
    description:
      'Explore insights and trends on our SMMDOC blog. Stay informed with our latest articles on social media strategies and digital marketing excellence.',
    images: ['/images/blog-og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://smmdoc.com/blog',
  },
};

export default function BlogPageWrapper() {
  return <BlogPage />;
}
