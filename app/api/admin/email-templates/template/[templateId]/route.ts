import { auth } from '@/auth';
import { db } from '@/lib/db';
import {
  getPredefinedTemplateById,
  getPredefinedCategory,
  getTemplateTrigger,
  getTemplateSpecificVariables,
} from '@/app/api/admin/email-templates/template-data';
import { getDefaultContent } from '@/lib/email-templates/get-default-content';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { templateId } = await params;
    const id = parseInt(templateId, 10);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    }

    const predefined = getPredefinedTemplateById(id);
    if (!predefined) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    const category = getPredefinedCategory(predefined.categoryId);
    const custom = await db.emailTemplate.findUnique({
      where: { templateKey: predefined.templateKey },
    });

    let fromName = '';
    let subject = '';
    let bodyHtml = '';

    if (custom) {
      fromName = custom.fromName ?? '';
      subject = custom.subject;
      bodyHtml = custom.bodyHtml;
    } else {
      const defaultContent = await getDefaultContent(predefined.templateKey);
      subject = defaultContent.subject;
      bodyHtml = defaultContent.html;
    }

    return NextResponse.json({
      success: true,
      data: {
        templateId: predefined.id,
        templateKey: predefined.templateKey,
        name: predefined.name,
        categoryId: predefined.categoryId,
        categoryName: category?.name ?? '',
        fromName,
        subject,
        bodyHtml,
        isCustom: !!custom,
        trigger: getTemplateTrigger(predefined.templateKey),
        templateVariables: getTemplateSpecificVariables(predefined.templateKey),
      },
    });
  } catch (error) {
    console.error('Error fetching email template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch template' },
      { status: 500 }
    );
  }
}
