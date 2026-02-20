import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
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

    await db.blogPosts.delete({
      where: { id: blogId }
    });

    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully',
      data: null
    });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete blog post',
        data: null
      },
      { status: 500 }
    );
  }
}
