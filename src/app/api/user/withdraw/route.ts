import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { amount, paymentDetails, gateway } = await request.json();

    // 1. Verify User
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'skillspin_default_secret_key_2026');
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    // 2. Validate Request
    if (!amount || amount < 100) {
      return NextResponse.json({ error: 'Minimum withdrawal is ₹100' }, { status: 400 });
    }

    if (!paymentDetails) {
      return NextResponse.json({ error: 'Payment details (UPI/Bank) are required' }, { status: 400 });
    }

    // 3. Check Balance
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (user.winningBalance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // 4. Check for existing pending withdrawals (Optional but good for prevention)
    const pendingWithdrawal = await prisma.transaction.findFirst({
      where: { userId, type: 'WITHDRAWAL', status: 'PENDING' }
    });
    if (pendingWithdrawal) {
      return NextResponse.json({ error: 'You already have a pending withdrawal request' }, { status: 400 });
    }

    // 5. Atomic Transaction: Deduct Balance & Create Pending Withdrawal
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { winningBalance: { decrement: amount } }
      }),
      prisma.transaction.create({
        data: {
          userId,
          amount,
          type: 'WITHDRAWAL',
          status: 'PENDING',
          gateway: gateway || 'UPI',
          paymentDetails: paymentDetails,
          orderId: `WDR_${userId.substring(0,5)}_${Date.now()}`
        }
      })
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Withdrawal request submitted successfully! It will be processed within 24-48 hours.' 
    });

  } catch (error) {
    console.error('WITHDRAW_API_ERROR:', error);
    return NextResponse.json({ error: 'Failed to process withdrawal request' }, { status: 500 });
  }
}
