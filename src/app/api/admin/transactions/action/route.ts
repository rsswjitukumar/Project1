import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function POST(request: Request) {
  try {
    const { txId, action } = await request.json();

    // 1. Verify Admin
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'skillspin_default_secret_key_2026');
    const { payload } = await jwtVerify(token, secret);
    
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Fetch Transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: txId },
      include: { user: true }
    });

    if (!transaction) return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    if (transaction.status !== 'PENDING') {
       return NextResponse.json({ error: 'Transaction is already processed' }, { status: 400 });
    }

    // 3. Process Action
    if (action === 'APPROVE') {
      await prisma.transaction.update({
        where: { id: txId },
        data: { status: 'SUCCESS' }
      });
      // Balance is already deducted during request submission.
      return NextResponse.json({ success: true, message: 'Withdrawal Approved Successfully!' });
    } 
    
    if (action === 'REJECT') {
      // 4. Refund Balance on Rejection
      await prisma.$transaction([
        prisma.transaction.update({
          where: { id: txId },
          data: { status: 'FAILED' }
        }),
        prisma.user.update({
          where: { id: transaction.userId },
          data: { winningBalance: { increment: transaction.amount } }
        }),
        // Optional: Create a refund log transaction
        prisma.transaction.create({
          data: {
             userId: transaction.userId,
             amount: transaction.amount,
             type: 'SYSTEM',
             status: 'SUCCESS',
             gateway: 'SYSTEM',
             paymentDetails: `Refund for withdrawal ${txId}`
          }
        })
      ]);
      return NextResponse.json({ success: true, message: 'Withdrawal Rejected and Balance Refunded!' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('ADMIN_TX_ACTION_ERROR:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
