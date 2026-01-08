import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Unauthorized access. Admin privileges required.',
          success: false,
          available: false
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { slug, excludeId } = body;

    if (!slug) {
      return NextResponse.json(
        {
          error: 'Slug is required',
          success: false,
          available: false
        },
        { status: 400 }
      );
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        {
          error: 'Slug can only contain lowercase letters, numbers, and hyphens. It cannot start or end with a hyphen.',
          success: false,
          available: false,
          valid: false
        },
        { status: 400 }
      );
    }

    if (slug.length < 3) {
      return NextResponse.json(
        {
          error: 'Slug must be at least 3 characters long',
          success: false,
          available: false,
          valid: false
        },
        { status: 400 }
      );
    }

    if (slug.length > 100) {
      return NextResponse.json(
        {
          error: 'Slug must be less than 100 characters',
          success: false,
          available: false,
          valid: false
        },
        { status: 400 }
      );
    }

    const whereClause: any = {
      slug,
      ...(excludeId && { id: { not: parseInt(excludeId) } })
    };

    const existingPost = await db.blogPosts.findFirst({
      where: whereClause,
      select: { id: true }
    });

    if (existingPost) {
      return NextResponse.json(
        {
          error: 'A post with this slug already exists',
          success: false,
          available: false,
          valid: true
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: 'Slug is available',
        success: true,
        available: true,
        valid: true
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error checking slug:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check slug availability',
        success: false,
        available: false 
      },
      { status: 500 }
    );
  }
}

