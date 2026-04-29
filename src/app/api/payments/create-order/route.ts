import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Razorpay from 'razorpay';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { amount, gateway } = await request.json();

    // Securely get userId from JWT
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'skillspin_default_secret_key_2026');
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    if (!amount || !gateway) {
      return NextResponse.json({ error: 'Amount and gateway are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let orderData: any = {};

    if (gateway === 'CASHFREE') {
      try {
        const cashfreeResponse = await fetch('https://api.cashfree.com/pg/orders', {
          method: 'POST',
          headers: {
            'x-client-id': process.env.CASHFREE_APP_ID || '',
            'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
            'x-api-version': '2023-08-01',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            order_amount: parseFloat(amount),
            order_currency: 'INR',
            order_id: `order_${userId.substring(0, 8)}_${Date.now()}`,
            customer_details: {
              customer_id: userId,
              customer_email: user.email || 'customer@example.com',
              customer_phone: user.phone || '9999999999'
            },
            order_meta: {
              return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://game.fastucl25.pro'}/wallet?status={order_status}`
            }
          })
        });

        const cfData = await cashfreeResponse.json();
        
        if (!cashfreeResponse.ok) {
           console.error("Cashfree API Error:", cfData);
           return NextResponse.json({ error: cfData.message || 'Cashfree Order Failed' }, { status: 400 });
        }

        orderData = {
          id: cfData.order_id,
          payment_session_id: cfData.payment_session_id,
          amount: cfData.order_amount,
          currency: cfData.order_currency
        };
      } catch (err) {
        console.error("Cashfree request failed", err);
        return NextResponse.json({ error: 'Failed to communicate with Cashfree' }, { status: 500 });
      }
    } else {
      orderData = {
        id: `paytm_order_${Math.random().toString(36).substring(2, 9)}`,
        amount: parseFloat(amount),
      };
    }

    await prisma.transaction.create({
      data: {
        userId,
        amount: parseFloat(amount),
        type: 'DEPOSIT',
        status: 'PENDING',
        gateway: gateway,
        orderId: orderData.id,
      },
    });

    return NextResponse.json({ success: true, order: orderData });

  } catch (error) {
    console.error('PAYMENT_ORDER_ERROR:', error);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
}
