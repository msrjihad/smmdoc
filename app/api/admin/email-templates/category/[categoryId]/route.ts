import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getSlotsForCategory, getCategoryName } from '@/lib/email-templates/template-slots';
import { getDefaultContent } from '@/lib/email-templates/get-default-content';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { categoryId } = await params;
    const slots = getSlotsForCategory(categoryId);
    if (!slots.length) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 404 }
      );
    }

    const customTemplates = await db.emailTemplate.findMany({
      where: { templateKey: { in: slots.map((s) => s.templateKey) } },
    });
    const customByKey = Object.fromEntries(
      customTemplates.map((t) => [t.templateKey, t])
    );

    const templates = await Promise.all(
      slots.map(async (slot) => {
        const custom = customByKey[slot.templateKey];
        if (custom) {
          return {
            templateId: slot.templateId,
            templateKey: slot.templateKey,
            name: slot.name,
            fromName: custom.fromName ?? '',
            subject: custom.subject,
            bodyHtml: custom.bodyHtml,
            isCustom: true,
          };
        }
        const defaultContent = await getDefaultContent(slot.templateKey);
        return {
          templateId: slot.templateId,
          templateKey: slot.templateKey,
          name: slot.name,
          fromName: '',
          subject: defaultContent.subject,
          bodyHtml: defaultContent.html,
          isCustom: false,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        categoryId,
        categoryName: getCategoryName(categoryId),
        templates,
      },
    });
  } catch (error) {
    console.error('Error fetching email templates by category:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}
