import { auth, signOut } from '@/auth';
import { ActivityLogger, getClientIP } from '@/lib/activity-logger';
import { NextRequest, NextResponse } from 'next/server';

function clearImpersonationCookies(response: NextResponse) {
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
}

async function logLogoutActivity(session: any, request: NextRequest) {
  if (session?.user) {
    try {
      const username = session.user.username || session.user.email?.split('@')[0] || `user${session.user.id}`;
      const ipAddress = getClientIP(request);
      
      if (session.user.role === 'admin') {
        await ActivityLogger.adminLogout(session.user.id, username, ipAddress);
      } else {
        await ActivityLogger.logout(session.user.id, username, ipAddress);
      }
    } catch (error) {
      console.error('Failed to log logout activity:', error);
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    await logLogoutActivity(session, request);

    const redirectUrl = new URL('/', request.url);
    const response = NextResponse.redirect(redirectUrl);

    clearImpersonationCookies(response);

    await signOut({
      redirectTo: '/'
    });

    return response;

  } catch (error) {
    console.error('Error in logout GET:', error);
    const errorResponse = NextResponse.redirect(new URL('/?error=failed_logout', request.url));
    clearImpersonationCookies(errorResponse);
    return errorResponse;
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    await logLogoutActivity(session, request);

    const response = NextResponse.json({
      success: true,
      message: 'Logout activity logged successfully'
    });

    clearImpersonationCookies(response);

    return response;

  } catch (error) {
    console.error('Error in logout API:', error);
    return NextResponse.json(
      {
        error: 'Failed to log logout activity',
        success: false
      },
      { status: 500 }
    );
  }
}
