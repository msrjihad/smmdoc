import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const trendingPosts = await db.blogPosts.findMany({
      where: {
        status: 'published'
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        views: true,
        publishedAt: true,
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      },
      orderBy: {
        views: 'desc'
      },
      take: 3
    });

    return NextResponse.json({
      success: true,
      posts: trendingPosts
    });
  } catch (error) {
    console.error('Error fetching trending posts:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trending posts',
        posts: []
      },
      { status: 500 }
    );
  }
}
