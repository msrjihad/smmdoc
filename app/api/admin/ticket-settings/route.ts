import { auth } from '@/auth';
import { db } from '@/lib/db';
import { clearTicketSettingsCache } from '@/lib/utils/ticket-settings';
import { NextRequest, NextResponse } from 'next/server';

const defaultTicketSettings = {
  ticketSystemEnabled: true,
  maxPendingTickets: '3',
  subjects: [],
};

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let settings: any = await db.ticketSettings.findFirst({
      include: {
        ticketSubjects: true
      }
    });

    if (!settings) {
      settings = await db.ticketSettings.create({
        data: {
          ticketSystemEnabled: defaultTicketSettings.ticketSystemEnabled,
          maxPendingTickets: defaultTicketSettings.maxPendingTickets,
          updatedAt: new Date()
        },
        include: {
          ticketSubjects: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      ticketSettings: {
        ticketSystemEnabled: settings.ticketSystemEnabled,
        maxPendingTickets: settings.maxPendingTickets,
        subjects: settings.ticketSubjects.map((subject: any) => ({
          id: subject.id,
          name: subject.name
        })),
      }
    });

  } catch (error) {
    console.error('Error loading ticket settings:', error);
    return NextResponse.json(
      { error: 'Failed to load ticket settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { ticketSettings } = await request.json();

    if (!ticketSettings) {
      return NextResponse.json(
        { error: 'Ticket settings data is required' },
        { status: 400 }
      );
    }

    if (!ticketSettings.subjects || !Array.isArray(ticketSettings.subjects)) {
      return NextResponse.json(
        { error: 'Subjects must be an array' },
        { status: 400 }
      );
    }

    if (ticketSettings.subjects.length === 0) {
      return NextResponse.json(
        { error: 'At least one subject is required' },
        { status: 400 }
      );
    }

    for (const subject of ticketSettings.subjects) {
      if (!subject.name || !subject.name.trim()) {
        return NextResponse.json(
          { error: 'All subjects must have a name' },
          { status: 400 }
        );
      }
    }

    await db.ticketSettings.upsert({
      where: { id: 1 },
      update: {
        ticketSystemEnabled: ticketSettings.ticketSystemEnabled ?? true,
        maxPendingTickets: ticketSettings.maxPendingTickets ?? '3',
        updatedAt: new Date(),
      },
      create: {
        id: 1,
        ticketSystemEnabled: ticketSettings.ticketSystemEnabled ?? true,
        maxPendingTickets: ticketSettings.maxPendingTickets ?? '3',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    await db.ticketSubjects.deleteMany({
      where: { ticketSettingsId: 1 }
    });

    await db.ticketSubjects.createMany({
      data: ticketSettings.subjects.map((subject: any) => ({
        name: subject.name.trim(),
        ticketSettingsId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    });

    clearTicketSettingsCache();

    return NextResponse.json({
      success: true,
      message: 'Ticket settings saved successfully'
    });

  } catch (error) {
    console.error('Error saving ticket settings:', error);
    return NextResponse.json(
      { error: 'Failed to save ticket settings' },
      { status: 500 }
    );
  }
}
