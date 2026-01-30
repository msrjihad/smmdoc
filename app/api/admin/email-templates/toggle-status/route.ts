import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getPredefinedTemplateByKey } from '@/app/api/admin/email-templates/template-data';
import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_BODY = '<p>Edit this template in Admin → Settings → Email Templates.</p>';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { templateKey, isActive } = body;

    if (!templateKey || typeof templateKey !== 'string') {
      return NextResponse.json(
        { error: 'templateKey is required' },
        { status: 400 }
      );
    }

    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'isActive must be a boolean' },
        { status: 400 }
      );
    }

    const predefined = getPredefinedTemplateByKey(templateKey);
    const defaultSubject = predefined?.name ?? templateKey;

    const template = await db.emailTemplate.upsert({
      where: { templateKey },
      create: {
        templateKey,
        subject: defaultSubject,
        bodyHtml: DEFAULT_BODY,
        isActive,
      },
      update: { isActive },
    });

    return NextResponse.json({
      success: true,
      data: template,
      message: `Template ${isActive ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error) {
    console.error('Error toggling email template status:', error);
    return NextResponse.json(
      { error: 'Failed to toggle template status' },
      { status: 500 }
    );
  }
}
