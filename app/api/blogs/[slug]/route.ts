import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { handleApiError, createSuccessResponse } from '@/lib/utils/error-handler';
import { logger } from '@/lib/utils/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const post = await db.blogPosts.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json(
        {
          success: false,
          error: 'Blog post not found',
          code: 'NOT_FOUND',
          statusCode: 404,
        },
        { status: 404 }
      );
    }

    const session = await auth();
    const isAdmin = session?.user?.role === 'admin';
    
    if (post.status !== 'published' && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Blog post not found',
          data: null
        },
        { status: 404 }
      );
    }

    if (post.status === 'published') {
      await db.blogPosts.update({
        where: { id: post.id },
        data: { views: { increment: 1 } }
      });
      post.views += 1;
    }

    return NextResponse.json(createSuccessResponse(post));
  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(
      errorResponse,
      { status: errorResponse.statusCode }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access. Admin privileges required.',
          data: null
        },
        { status: 401 }
      );
    }

    const { slug } = await params;
    const body = await req.json();
    const {
      title,
      newSlug,
      excerpt,
      content,
      featuredImage,
      status,
      publishedAt,
      scheduledAt,
      seoTitle,
      seoDescription,
      seoKeywords
    } = body;

    const existingPost = await db.blogPosts.findUnique({
      where: { slug }
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

    if (newSlug && newSlug !== slug) {
      const slugExists = await db.blogPosts.findUnique({
        where: { slug: newSlug }
      });

      if (slugExists) {
        return NextResponse.json(
          {
            success: false,
            error: 'A post with this slug already exists',
            data: null
          },
          { status: 400 }
        );
      }
    }

    let readingTime = existingPost.readingTime;
    if (content) {
      const wordCount = content.split(/\s+/).length;
      readingTime = Math.ceil(wordCount / 200);
    }

    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title;
    if (newSlug !== undefined) updateData.slug = newSlug;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) {
      updateData.content = content;
      updateData.readingTime = readingTime;
    }
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'published' && !existingPost.publishedAt) {
        updateData.publishedAt = publishedAt ? new Date(publishedAt) : new Date();
      }
    }
    if (publishedAt !== undefined) updateData.publishedAt = publishedAt ? new Date(publishedAt) : null;
    if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle;
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription;
    if (seoKeywords !== undefined) updateData.seoKeywords = seoKeywords;

    const updatedPost = await db.blogPosts.update({
      where: { slug },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true
          }
        }
      }
    });

    if (status === 'published' && !existingPost.publishedAt) {
      try {
        const { sendBlogPostNotification } = await import('@/lib/notifications/user-notifications');
        await sendBlogPostNotification(updatedPost.title, updatedPost.slug);
      } catch (error) {
        logger.error('Error sending blog post notification', error);
      }
    }

    return NextResponse.json(
      createSuccessResponse(updatedPost, 'Blog post updated successfully')
    );
  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(
      errorResponse,
      { status: errorResponse.statusCode }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized access. Admin privileges required.',
          data: null
        },
        { status: 401 }
      );
    }

    const { slug } = await params;

    const existingPost = await db.blogPosts.findUnique({
      where: { slug }
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
      where: { slug }
    });

    return NextResponse.json(
      createSuccessResponse(null, 'Blog post deleted successfully')
    );
  } catch (error) {
    const errorResponse = handleApiError(error);
    return NextResponse.json(
      errorResponse,
      { status: errorResponse.statusCode }
    );
  }
}
