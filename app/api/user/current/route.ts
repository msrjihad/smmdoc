import { requireAuth } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();

    console.log(`User current API accessed by: ${session.user.email}`);

    let impersonatedUserId: string | null = null;
    let originalAdminId: string | null = null;
    
    try {
      if (request.cookies) {
        impersonatedUserId = request.cookies.get('impersonated-user-id')?.value || null;
        originalAdminId = request.cookies.get('original-admin-id')?.value || null;
      }
      
      if ((!impersonatedUserId || !originalAdminId)) {
        const cookieStore = await cookies();
        if (!impersonatedUserId) {
          impersonatedUserId = cookieStore.get('impersonated-user-id')?.value || null;
        }
        if (!originalAdminId) {
          originalAdminId = cookieStore.get('original-admin-id')?.value || null;
        }
      }
      
      console.log('User Current API - Cookie check:', { 
        impersonatedUserId, 
        originalAdminId,
        sessionIsImpersonating: session.user.isImpersonating 
      });
    } catch (error) {
      console.error('Error reading cookies in user current API:', error);
    }

    let userId: number;
    let isImpersonating = session.user.isImpersonating || false;
    
    if (impersonatedUserId && originalAdminId) {
      userId = parseInt(impersonatedUserId);
      isImpersonating = true;
      console.log('User Current API - Using impersonated user ID:', userId);
    } else {
      userId = Number(session.user.id);
    }

    try {
      const userDetails = await db.users.findUnique({
        where: { id: parseInt(userId.toString()) },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          image: true,
          currency: true,
          balance: true,
          balanceUSD: true,
          preferredCurrency: true,
          total_deposit: true,
          total_spent: true,
          createdAt: true,
          emailVerified: true,
          isTwoFactorEnabled: true,
        }
      });

      if (!userDetails) {
        return NextResponse.json(
          { success: false, data: null, error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          success: true, 
          data: {
            ...userDetails,
            isImpersonating
          }, 
          error: null 
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error('Database error in /api/user/current:', dbError);

      return NextResponse.json(
        {
          success: true,
          data: {
            id: session.user.id,
            name: session.user.name || null,
            username: session.user.username || null,
            email: session.user.email || null,
            role: session.user.role || 'user',
            image: session.user.image || null,
            currency: session.user.currency || 'USD',
            balance: (session.user as any).balance || 0,
            total_deposit: 0,
            total_spent: 0,
            createdAt: new Date(),
            emailVerified: null,
            isTwoFactorEnabled: session.user.isTwoFactorEnabled || false,
          },
          error: null
        },
        { status: 200 }
      );
    }
    
  } catch (error: any) {
    console.error('Error in user current API:', error);

    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { success: false, data: null, error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, data: null, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
