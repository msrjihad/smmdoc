import { auth } from '@/auth';
import { contactDB } from '@/lib/contact-db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, operation, messageIds } = await request.json();
    const bulkAction = action || operation;

    if (!bulkAction || !messageIds || !Array.isArray(messageIds)) {
      return NextResponse.json(
        { error: 'Action and message IDs are required' },
        { status: 400 }
      );
    }

    let successCount = 0;
    let errorCount = 0;

    for (const messageId of messageIds) {
      try {
        const numericId = parseInt(messageId, 10);
        if (isNaN(numericId)) {
          console.error(`Invalid message ID: ${messageId}`);
          errorCount++;
          continue;
        }

        switch (bulkAction) {
          case 'markAsRead':
          case 'mark_read':
            const readResult = await contactDB.updateContactMessageStatus(numericId, 'Read');
            if (readResult) successCount++;
            else errorCount++;
            break;

          case 'markAsUnread':
          case 'mark_unread':
            const unreadResult = await contactDB.updateContactMessageStatus(numericId, 'Unread');
            if (unreadResult) successCount++;
            else errorCount++;
            break;

          case 'delete':
          case 'delete_selected':
            const deleteResult = await contactDB.deleteContactMessage(numericId);
            if (deleteResult) successCount++;
            else errorCount++;
            break;

          default:
            errorCount++;
            break;
        }
      } catch (error) {
        console.error(`Error processing message ${messageId}:`, error);
        errorCount++;
      }
    }

    const isSuccess = errorCount === 0;
    const message = errorCount === 0 
      ? `Successfully processed ${successCount} message(s)`
      : `Bulk operation completed with errors. ${successCount} successful, ${errorCount} failed.`;

    return NextResponse.json({
      success: isSuccess,
      message,
      results: {
        successCount,
        errorCount,
        totalProcessed: messageIds.length
      }
    });

  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation' },
      { status: 500 }
    );
  }
}
