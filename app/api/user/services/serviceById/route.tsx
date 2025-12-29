/* eslint-disable @typescript-eslint/no-unused-vars */
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { serializeService } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const moduleSettings = await db.moduleSettings.findFirst();
    const servicesListPublic = moduleSettings?.servicesListPublic ?? true;

    if (!servicesListPublic) {
      const session = await auth();
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Authentication required to access services' },
          { status: 401 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('svId') || '';

    const result = await db.services.findFirst({
      where: { 
        id: Number(id),
        status: 'active'
      },
    });
    
    if (!result) {
      return NextResponse.json(
        {
          error: 'Service not found or not available.',
          data: null,
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      {
        error: null,
        data: serializeService(result),
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'An error occurred while fetching the service.',
        data: null,
      },
      { status: 500 }
    );
  }
}
