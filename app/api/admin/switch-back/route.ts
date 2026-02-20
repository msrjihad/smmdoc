import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const originalAdminId = cookieStore.get('original-admin-id')?.value;
    const impersonatedUserId = cookieStore.get('impersonated-user-id')?.value;

    if (!originalAdminId || !impersonatedUserId) {
      return NextResponse.json(
        { success: false, error: 'No active user switching session found' },
        { status: 400 }
      );
    }

    const response = NextResponse.json({
      success: true,
      message: 'Switched back to admin account'
    });

    response.cookies.set('impersonated-user-id', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    response.cookies.set('original-admin-id', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    response.cookies.set('original-admin-role', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    return response;
  } catch (error) {
    console.error('Switch back error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
