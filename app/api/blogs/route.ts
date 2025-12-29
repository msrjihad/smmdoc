import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    
    const skip = (page - 1) * limit;
    
    const session = await auth();
    const isAdmin = session?.user?.role === 'admin';
    
    const whereClause: any = {};
    
    if (!isAdmin) {
      whereClause.status = 'published';
      whereClause.publishedAt = { lte: new Date() };
    } else if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [posts, totalCount] = await Promise.all([
      db.blogPosts.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true
            }
          }
        },
        orderBy: isAdmin ? {
          createdAt: 'desc'
        } : {
          publishedAt: 'desc'
        },
        skip,
        take: limit
      }),
      db.blogPosts.count({ where: whereClause })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch blog posts',
        data: null
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const {
      title,
      slug,
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

    if (!title || !content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Title and content are required',
          data: null
        },
        { status: 400 }
      );
    }

    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const existingPost = await db.blogPosts.findUnique({
      where: { slug: finalSlug }
    });

    if (existingPost) {
      return NextResponse.json(
        {
          success: false,
          error: 'A post with this slug already exists',
          data: null
        },
        { status: 400 }
      );
    }

    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    const stripHtml = (html: string) => {
      return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
    };
    
    const plainTextContent = stripHtml(content);
    
    const finalSeoTitle = seoTitle || (title.length > 60 ? title.substring(0, 60) + '...' : title);
    
    const finalSeoDescription = seoDescription || (plainTextContent.length > 160 ? plainTextContent.substring(0, 160) + '...' : plainTextContent);
    
    const finalExcerpt = excerpt || (plainTextContent.length > 160 ? plainTextContent.substring(0, 160) + '...' : plainTextContent);

    const post = await db.blogPosts.create({
      data: {
        title,
        slug: finalSlug,
        excerpt: finalExcerpt,
        content,
        featuredImage,
        status: status || 'draft',
        publishedAt: status === 'published' ? (publishedAt ? new Date(publishedAt) : new Date()) : null,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        readingTime,
        seoTitle: finalSeoTitle,
        seoDescription: finalSeoDescription,
        seoKeywords,
        authorId: session.user.id
      },
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

    const responsePost = {
      ...post,
      excerpt: excerpt || null,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null
    };

    return NextResponse.json({
      success: true,
      message: 'Blog post created successfully',
      data: responsePost
    });
  } catch (error) {
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create blog post',
        data: null
      },
      { status: 500 }
    );
  }
}
