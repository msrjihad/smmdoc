import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const term = searchParams.get('term');
    
    if (!term || term.trim() === '') {
      return NextResponse.json({
        success: false,
        error: 'Search term is required',
        data: []
      }, { status: 400 });
    }

    const searchResults = await db.blogPosts.findMany({
      where: {
        status: 'published',
        publishedAt: { lte: new Date() },
        OR: [
          { title: { contains: term.trim() } },
          { excerpt: { contains: term.trim() } }
        ]
      },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        views: true,
        publishedAt: true,
        readingTime: true,
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
      data: searchResults,
      count: searchResults.length
    });
  } catch (error) {
    console.error('Error searching blog posts:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to search blog posts',
        data: []
      },
      { status: 500 }
    );
  }
}
