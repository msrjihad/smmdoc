import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const allBlogs = await db.blogPosts.findMany({
      select: {
        id: true,
        status: true,
        views: true,
        readingTime: true,
        publishedAt: true,
        createdAt: true,
      },
    });

    const statusCounts: Record<string, number> = {
      published: 0,
      draft: 0,
      scheduled: 0,
      archived: 0,
    };

    let totalViews = 0;
    let totalReadTime = 0;
    let todayViews = 0;
    let thisMonthPosts = 0;

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    allBlogs.forEach((blog) => {
      statusCounts[blog.status] = (statusCounts[blog.status] || 0) + 1;

      totalViews += blog.views || 0;
      totalReadTime += blog.readingTime || 0;

      if (blog.publishedAt && new Date(blog.publishedAt).toDateString() === today.toDateString()) {
        todayViews += blog.views || 0;
      }

      if (blog.createdAt >= startOfMonth) {
        thisMonthPosts++;
      }
    });

    const averageReadTime = allBlogs.length > 0 ? Math.round(totalReadTime / allBlogs.length) : 0;

    const stats = {
      totalBlogs: allBlogs.length,
      publishedBlogs: statusCounts.published || 0,
      draftBlogs: statusCounts.draft || 0,
      scheduledBlogs: statusCounts.scheduled || 0,
      archivedBlogs: statusCounts.archived || 0,
      totalViews,
      totalLikes: 0,
      totalComments: 0,
      averageReadTime,
      topCategories: 0,
      todayViews,
      thisMonthPosts,
    };

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching blog stats:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch blog statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
