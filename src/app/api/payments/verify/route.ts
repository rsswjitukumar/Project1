import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { orderId, paymentId, signature, status } = await request.json();

    // Secure checking
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secretJwt = new TextEncoder().encode(process.env.JWT_SECRET || 'skillspin_default_secret_key_2026');
    const { payload } = await jwtVerify(token, secretJwt);
    const userId = payload.id as string;

    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    const transaction = await prisma.transaction.findFirst({
      where: { orderId: orderId, userId: userId },
      include: { user: true }
    });

    if (!transaction) return NextResponse.json({ error: 'Transaction not found or unauthorized' }, { status: 404 });
    if (transaction.status === 'SUCCESS') return NextResponse.json({ error: 'Transaction already processed' }, { status: 400 });

    if (status === 'SUCCESS') {
      // CASHFREE VALIDATION API CALL
      if (transaction.gateway === 'CASHFREE') {
        try {
          const cfVerifyRes = await fetch(`https://api.cashfree.com/pg/orders/${orderId}`, {
            method: 'GET',
            headers: {
              'x-client-id': process.env.CASHFREE_APP_ID || '',
              'x-client-secret': process.env.CASHFREE_SECRET_KEY || '',
              'x-api-version': '2023-08-01',
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          });
          const cfVerifyData = await cfVerifyRes.json();
          if (cfVerifyData.order_status !== 'PAID') {
             return NextResponse.json({ error: 'Cashfree Verification Failed: Payment not fully paid' }, { status: 400 });
          }
        } catch (e) {
          return NextResponse.json({ error: 'Failed to verify Cashfree payment' }, { status: 500 });
        }
      }

      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'SUCCESS' },
        }),
        prisma.user.update({
          where: { id: transaction.userId },
          data: { depositBalance: { increment: transaction.amount } },
        }),
      ]);

      // Check if this is the user's FIRST successful deposit to give extra referral bonus
      const previousSuccessfulDeposits = await prisma.transaction.count({
        where: {
          userId: transaction.userId,
          status: 'SUCCESS',
          type: 'DEPOSIT' // Assume transaction types like DEPOSIT exist
        }
      });

      // If it's the first success (previousCount was 0 before this update, now 1), check for referrer
      if (previousSuccessfulDeposits === 1 && transaction.user.referredBy) {
        const referrer = await prisma.user.findFirst({
          where: { 
            OR: [
              { referralCode: transaction.user.referredBy },
              { username: transaction.user.referredBy }
            ]
          }
        });

        if (referrer) {
          await prisma.$transaction([
            prisma.user.update({
              where: { id: referrer.id },
              data: {
                bonusBalance: { increment: 10 },
                referralEarnings: { increment: 10 }
              }
            }),
            prisma.transaction.create({
              data: {
                userId: referrer.id,
                amount: 10,
                type: 'REFERRAL_BONUS',
                status: 'SUCCESS',
                gateway: 'SYSTEM'
              }
            })
          ]);
        }
      }

      return NextResponse.json({ success: true, message: 'Payment verified securely and balance updated' });
    } else {
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' },
      });
      return NextResponse.json({ success: false, message: 'Payment failed marking' });
    }

  } catch (error) {
    console.error('PAYMENT_VERIFY_ERROR:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
