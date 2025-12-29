import { auth } from '@/auth';
import { ActivityLogger, getClientIP } from '@/lib/activity-logger';
import { requireAdminOrModerator } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string  }> }
) {
  try {
    const session = await requireAdminOrModerator();

    console.log(`Admin user details API accessed by: ${session.user.email}`);

    const { id  } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        {
          error: 'Invalid user ID format',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const user = await db.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        balance: true,
        total_spent: true,
        total_deposit: true,
        currency: true,
        role: true,
        status: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        servicesDiscount: true,
        specialPricing: true,
        apiKey: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found',
          success: false,
          data: null
        },
        { status: 404 }
      );
    }

    const orderCount = await db.newOrders.count({
      where: { userId: user.id }
    });

    const userData = {
      ...user,
      totalOrders: orderCount,
    };

    return NextResponse.json({
      success: true,
      data: userData,
      error: null
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch user: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Unauthorized access. Admin privileges required.',
          success: false,
          data: null
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        {
          error: 'Invalid user ID format',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { username, name, email, balance, emailVerified, password, role, status } = body;

    const existingUser = await db.users.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          error: 'User not found',
          success: false,
          data: null
        },
        { status: 404 }
      );
    }

    if (username !== undefined && username !== existingUser.username) {
      const usernameExists = await db.users.findUnique({
        where: { username: username },
        select: { id: true }
      });

      if (usernameExists && usernameExists.id !== userId) {
        return NextResponse.json(
          {
            error: 'Username is already taken by another user',
            success: false,
            data: null
          },
          { status: 400 }
        );
      }
    }

    if (email !== undefined && email !== existingUser.email) {
      const emailExists = await db.users.findUnique({
        where: { email: email },
        select: { id: true }
      });

      if (emailExists && emailExists.id !== userId) {
        return NextResponse.json(
          {
            error: 'Email is already taken by another user',
            success: false,
            data: null
          },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};

    if (username !== undefined) updateData.username = username;
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (balance !== undefined) updateData.balance = parseFloat(balance);
    if (emailVerified !== undefined) {
      updateData.emailVerified = emailVerified ? new Date() : null;
    }
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    
    if (password && password.trim()) {
      const bcrypt = require('bcryptjs');
      updateData.password = await bcrypt.hash(password, 12);
    }

    const updatedUser = await db.users.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        balance: true,
        role: true,
        status: true,
        emailVerified: true,
        updatedAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
      error: null
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      {
        error: 'Failed to update user: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return PUT(req, { params });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        {
          error: 'Unauthorized access. Admin privileges required.',
          success: false,
          data: null
        },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json(
        {
          error: 'Invalid user ID format',
          success: false,
          data: null
        },
        { status: 400 }
      );
    }

    const existingUser = await db.users.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        {
          error: 'User not found',
          success: false,
          data: null
        },
        { status: 404 }
      );
    }

    if (existingUser.role === 'admin') {
      return NextResponse.json(
        {
          error: 'Cannot delete admin users',
          success: false,
          data: null
        },
        { status: 403 }
      );
    }

    try {
      const adminUsername = session.user.username || session.user.email?.split('@')[0] || `admin${session.user.id}`;
      const targetUsername = existingUser.username || existingUser.email?.split('@')[0] || `user${existingUser.id}`;
      const clientIP = getClientIP(req);
      
      await ActivityLogger.userDeleted(
        session.user.id,
        adminUsername,
        existingUser.id,
        targetUsername,
        clientIP
      );
    } catch (logError) {
      console.error('Failed to log user deletion activity:', logError);
    }

    try {
      await db.$transaction(async (tx) => {
        
        await tx.activityLogs.deleteMany({
          where: { userId: userId }
        });

        await tx.addFunds.deleteMany({
          where: { userId: userId }
        });

        await tx.newOrders.deleteMany({
          where: { userId: userId }
        });

        await tx.cancelRequests.deleteMany({
          where: { userId: userId }
        });

        await tx.refillRequests.deleteMany({
          where: { userId: userId }
        });

        await tx.favoriteServices.deleteMany({
          where: { userId: userId }
        });
        
        await tx.favoriteCategories.deleteMany({
          where: { userId: userId }
        });

        const userTickets = await tx.supportTickets.findMany({
          where: { userId: userId },
          select: { id: true }
        });
        
        for (const ticket of userTickets) {
          await tx.ticketMessages.deleteMany({
            where: { ticketId: ticket.id }
          });
          await tx.ticketNotes.deleteMany({
            where: { ticketId: ticket.id }
          });
        }
        
        await tx.supportTickets.deleteMany({
          where: { userId: userId }
        });

        const userContactMessages = await tx.contactMessages.findMany({
          where: { userId: userId },
          select: { id: true }
        });
        
        for (const message of userContactMessages) {
          await tx.contactNotes.deleteMany({
            where: { messageId: message.id }
          });
        }
        
        await tx.contactMessages.deleteMany({
          where: { userId: userId }
        });

        const userAffiliate = await tx.affiliates.findUnique({
          where: { userId: userId },
          select: { id: true }
        });
        
        if (userAffiliate) {
          await tx.affiliateCommissions.deleteMany({
            where: { affiliateId: userAffiliate.id }
          });
          
          await tx.affiliatePayouts.deleteMany({
            where: { affiliateId: userAffiliate.id }
          });
          
          await tx.affiliateReferrals.deleteMany({
            where: { affiliateId: userAffiliate.id }
          });
          
          await tx.affiliates.delete({
            where: { id: userAffiliate.id }
          });
        }

        const userChildPanel = await tx.childPanels.findUnique({
          where: { userId: userId },
          select: { id: true }
        });
        
        if (userChildPanel) {
          await tx.childPanelSubscriptions.deleteMany({
            where: { childPanelId: userChildPanel.id }
          });
          
          await tx.childPanels.delete({
            where: { id: userChildPanel.id }
          });
        }

        await tx.services.deleteMany({
          where: { userId: userId }
        });
        
        await tx.categories.deleteMany({
          where: { userId: userId }
        });

        await tx.sessions.deleteMany({
          where: { userId: userId }
        });
        
        await tx.accounts.deleteMany({
          where: { userId: userId }
        });
        
        await tx.twoFactorConfirmations.deleteMany({
          where: { userId: userId }
        });

        await tx.users.delete({
          where: { id: userId }
        });
      });
    } catch (error) {
      console.error('Error during user deletion process:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: null,
      message: 'User and all associated data deleted successfully',
      error: null
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete user: ' + (error instanceof Error ? error.message : 'Unknown error'),
        success: false,
        data: null
      },
      { status: 500 }
    );
  }
}
