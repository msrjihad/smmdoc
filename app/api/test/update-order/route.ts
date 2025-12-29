import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    console.log('Test update order API called');
    
    const session = await auth();
    console.log('Session:', session?.user?.email, session?.user?.role);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }
    
    const body = await req.json();
    console.log('Request body:', body);
    
    const { orderId, status } = body;
    
    if (!orderId || !status) {
      return NextResponse.json({
        success: false,
        error: 'Order ID and status are required'
      }, { status: 400 });
    }
    
    const orderIdInt = parseInt(orderId);
    console.log('Order ID:', orderIdInt, 'Status:', status);
    
    if (isNaN(orderIdInt)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid order ID'
      }, { status: 400 });
    }
    
    const existingOrder = await db.newOrders.findUnique({
      where: { id: orderIdInt }
    });
    
    console.log('Existing order:', existingOrder);
    
    if (!existingOrder) {
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }
    
    const updatedOrder = await db.newOrders.update({
      where: { id: orderIdInt },
      data: { status }
    });
    
    console.log('Updated order:', updatedOrder);
    
    return NextResponse.json({
      success: true,
      data: updatedOrder
    });
    
  } catch (error) {
    console.error('Test update error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
