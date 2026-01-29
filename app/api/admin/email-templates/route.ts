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

    if (!templateKey || typeof subject !== 'string' || typeof bodyHtml !== 'string') {
      return NextResponse.json(
        { error: 'templateKey, subject, and bodyHtml are required' },
        { status: 400 }
      );
    }

    const fromNameStr = typeof fromName === 'string' ? fromName : '';

    const template = await db.emailTemplate.upsert({
      where: { templateKey },
      create: { templateKey, fromName: fromNameStr || null, subject, bodyHtml },
      update: { fromName: fromNameStr || null, subject, bodyHtml },
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
