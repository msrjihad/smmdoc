import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access. Admin privileges required.',
          data: null
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    const blogId = parseInt(id);

    if (isNaN(blogId)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid blog ID',
          data: null
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { status } = body;

    if (!status || !['published', 'draft'].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid status. Must be either "published" or "draft"',
          data: null
        },
        { status: 400 }
      );
    }

    const existingPost = await db.blogPosts.findUnique({
      where: { id: blogId }
    });

    if (!existingPost) {
      return NextResponse.json(
        {
          success: false,
          error: 'Blog post not found',
          data: null
        },
        { status: 404 }
      );
    }

    const updatedPost = await db.blogPosts.update({
      where: { id: blogId },
      data: {
        status,
        publishedAt: status === 'published' ? new Date() : null
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Blog post status updated to ${status}`,
      data: updatedPost
    });
  } catch (error) {
    console.error('Error updating blog post status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update blog post status',
        data: null
      },
      { status: 500 }
    );
  }
}
