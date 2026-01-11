import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import BlogPostDetailClient from '../blog-details/page';
import { getAppName, getSiteDescription, getGeneralSettings } from '@/lib/utils/general-settings';

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;

    const [appName, siteDescription, generalSettings] = await Promise.all([
      getAppName(),
      getSiteDescription(),
      getGeneralSettings()
    ]);

    const siteUrl = generalSettings.siteUrl;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
    
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL or NEXTAUTH_URL environment variable is required');
    }

    let metaKeywords = '';
    try {
      const metaResponse = await fetch(`${baseUrl}/api/public/meta-settings`, {
        cache: 'no-store'
      });
      if (metaResponse.ok) {
        const metaData = await metaResponse.json();
        if (metaData.success && metaData.metaSettings?.keywords) {
          metaKeywords = metaData.metaSettings.keywords;
        }
      }
    } catch (error) {
      // Silently handle meta keywords error - not critical
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error fetching meta keywords:', error);
      }
    }

    const response = await fetch(`${baseUrl}/api/blogs/${slug}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      return {
        title: `Blog Post Not Found - ${appName}`,
        description: 'The requested blog post could not be found.'
      };
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      return {
        title: `Blog Post Not Found`,
        description: 'The requested blog post could not be found.'
      };
    }

    const post = data.data;

    return {
      title: post.seoTitle || `${post.title}`,
      description: post.seoDescription || post.excerpt || siteDescription,
      keywords: metaKeywords,
      openGraph: {
        title: post.seoTitle || post.title,
        description: post.seoDescription || post.excerpt,
        type: 'article',
        url: `${siteUrl}/blog/${post.slug}`,
        siteName: appName,
        images: post.featuredImage ? [
          {
            url: post.featuredImage,
            width: 1200,
            height: 630,
            alt: post.title
          }
        ] : [],
        publishedTime: post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined,
        modifiedTime: post.updatedAt ? new Date(post.updatedAt).toISOString() : undefined,
        authors: [post.author?.name || `${appName} Team`]
      },
      twitter: {
        card: 'summary_large_image',
        title: post.seoTitle || post.title,
        description: post.seoDescription || post.excerpt,
        images: post.featuredImage ? [post.featuredImage] : []
      },
      alternates: {
        canonical: `${siteUrl}/blog/${post.slug}`
      }
    };
  } catch (error) {
    // Log in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('Error generating metadata:', error);
    }

    const [appName, siteDescription] = await Promise.all([
      getAppName().catch(() => ''),
      getSiteDescription().catch(() => '')
    ]);

    return {
      title: `Blog Post`,
      description: siteDescription
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  try {
    const { slug } = await params;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
    
    if (!baseUrl) {
      throw new Error('NEXT_PUBLIC_APP_URL or NEXTAUTH_URL environment variable is required');
    }
    const response = await fetch(`${baseUrl}/api/blogs/${slug}`, {
      cache: 'no-store'
    });

    if (!response.ok) {
      notFound();
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      notFound();
    }

    return <BlogPostDetailClient post={data.data} />;
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      console.error('Error fetching blog post:', error);
    }
    notFound();
  }
}