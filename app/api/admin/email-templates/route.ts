import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { templateKey, fromName, subject, bodyHtml } = body;

    if (!templateKey) {
      return NextResponse.json(
        { error: 'templateKey is required' },
        { status: 400 }
      );
    }

    const fromNameStr = typeof fromName === 'string' ? fromName.trim() : '';
    const subjectStr = typeof subject === 'string' ? subject.trim() : '';
    const bodyHtmlStr = typeof bodyHtml === 'string' ? bodyHtml.trim() : '';

    if (!fromNameStr) {
      return NextResponse.json(
        { error: 'From name is required' },
        { status: 400 }
      );
    }

    if (!subjectStr) {
      return NextResponse.json(
        { error: 'Subject line is required' },
        { status: 400 }
      );
    }

    if (!bodyHtmlStr) {
      return NextResponse.json(
        { error: 'Template content is required' },
        { status: 400 }
      );
    }

    const template = await db.emailTemplate.upsert({
      where: { templateKey },
      create: { templateKey, fromName: fromNameStr, subject: subjectStr, bodyHtml: bodyHtmlStr },
      update: { fromName: fromNameStr, subject: subjectStr, bodyHtml: bodyHtmlStr },
    });

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error saving email template:', error);
    return NextResponse.json(
      { error: 'Failed to save template' },
      { status: 500 }
    );
  }
}
