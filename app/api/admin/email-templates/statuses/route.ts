import { auth } from '@/auth';
import { db } from '@/lib/db';
import { PREDEFINED_EMAIL_TEMPLATES } from '@/app/api/admin/email-templates/template-data';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const [templates, integrationSettings] = await Promise.all([
      db.emailTemplate.findMany({
        where: {
          templateKey: {
            in: PREDEFINED_EMAIL_TEMPLATES.map((t) => t.templateKey),
          },
        },
        select: { templateKey: true, isActive: true },
      }),
      db.integrationSettings.findFirst({
        select: { emailNotificationsEnabled: true },
      }),
    ]);

    const statusMap: Record<string, boolean> = {};
    for (const t of PREDEFINED_EMAIL_TEMPLATES) {
      const row = templates.find((r) => r.templateKey === t.templateKey);
      statusMap[t.templateKey] = row ? row.isActive : true;
    }

    return NextResponse.json({
      success: true,
      data: statusMap,
      emailSystemEnabled: !!integrationSettings?.emailNotificationsEnabled,
    });
  } catch (error) {
    console.error('Error fetching email template statuses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template statuses' },
      { status: 500 }
    );
  }
}
