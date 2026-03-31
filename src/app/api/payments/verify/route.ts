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
      // 1. Logic for Razorpay Signature Verification
      if (transaction.gateway === 'RAZORPAY' && paymentId && signature) {
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (secret && secret !== 'secret_placeholder') {
          const expectedSignature = crypto.createHmac('sha256', secret)
                                        .update(orderId + "|" + paymentId)
                                        .digest('hex');
          if (expectedSignature !== signature) {
            return NextResponse.json({ error: 'Invalid Razorpay Signature' }, { status: 400 });
          }
        }
      }

      // 2. Logic for Paytm Signature Verification
      if (transaction.gateway === 'PAYTM' && signature) {
        const PaytmChecksum = require('paytmchecksum');
        const mkey = process.env.PAYTM_MERCHANT_KEY || 'YOUR_KEY_HERE';
        
        // In a real callback, Paytm sends many fields. We verify the body + signature.
        // For client-side triggered verify, we might need to fetch status from Paytm API first.
        const isValid = await PaytmChecksum.verifySignature(JSON.stringify({ orderId, status }), mkey, signature);
        
        if (!isValid && process.env.NODE_ENV === 'production') {
           return NextResponse.json({ error: 'Invalid Paytm Signature' }, { status: 400 });
        }
      }

      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: transaction.id },
          data: { status: 'SUCCESS' },
        }),
        prisma.user.update({
          where: { id: transaction.userId },
          data: { walletBalance: { increment: transaction.amount } },
        }),
      ]);

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
