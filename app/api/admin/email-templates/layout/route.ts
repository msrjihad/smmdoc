import { auth } from '@/auth';
import { db } from '@/lib/db';
import { getEmailLayoutDataFromSettings } from '@/lib/email-templates/get-email-layout-data';
import { emailHeader, emailFooter } from '@/lib/email-templates/shared/email-layout';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const layoutData = await getEmailLayoutDataFromSettings();
    const headerHtml = emailHeader(layoutData);
    const footerHtml = emailFooter(layoutData);

    let previewVariableContext: {
      sitename: string;
      username: string;
      user_full_name: string;
      user_email: string;
      user_id: string;
    } = {
      sitename: layoutData.siteName || 'SMM Panel',
      username: 'johndoe',
      user_full_name: 'John Doe',
      user_email: 'user@example.com',
      user_id: '12345',
    };

    try {
      const sampleUser = await db.users.findFirst({
        where: { email: { not: null } },
        select: { id: true, username: true, name: true, email: true },
        orderBy: { id: 'asc' },
      });
      if (sampleUser) {
        previewVariableContext = {
          sitename: layoutData.siteName || 'SMM Panel',
          username: sampleUser.username ?? '',
          user_full_name: sampleUser.name ?? '',
          user_email: sampleUser.email ?? '',
          user_id: String(sampleUser.id),
        };
      }
    } catch (e) {
      console.warn('Could not load preview user for email templates:', e);
    }

    return NextResponse.json({
      success: true,
      data: { headerHtml, footerHtml, previewVariableContext },
    });
  } catch (error) {
    console.error('Error fetching email layout:', error);
    return NextResponse.json(
      { error: 'Failed to fetch layout' },
      { status: 500 }
    );
  }
}
