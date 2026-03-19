import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function POST(request: Request) {
  try {
    const { betAmount, score, timeElapsedMs } = await request.json();
    
    // Validations
    if (!betAmount || betAmount <= 0) return NextResponse.json({ error: 'Invalid bet amount' }, { status: 400 });
    if (typeof score !== 'number' || score < 0) return NextResponse.json({ error: 'Invalid score' }, { status: 400 });
    if (timeElapsedMs < 14000) return NextResponse.json({ error: 'Game terminated illicitly' }, { status: 400 });

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'skillspin_default_secret_key_2026');
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

      if (user.walletBalance < betAmount) {
        return NextResponse.json({ error: 'Insufficient wallet balance' }, { status: 400 });
      }

      // Anti-Cheat Engine (Physical human tap limit is ~70 per 15s. Anything > 75 is a software macro)
      let verifiedScore = score;
      if (verifiedScore > 75) {
        // Flagged as Bot Handler - Zero Score
        verifiedScore = 0;
      }

      // Mathematical Tier Resolution
      let multiplier = 0;
      if (verifiedScore >= 60) multiplier = 2.0;       // Pro
      else if (verifiedScore >= 46) multiplier = 1.5;  // Elite
      else if (verifiedScore >= 31) multiplier = 1.2;  // Good
      else multiplier = 0;                             // Loss

      const winAmount = parseFloat((betAmount * multiplier).toFixed(2));
      const profitAdjustment = winAmount - betAmount;

      // Execute SQL Wallet Delta Atomically
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          walletBalance: { increment: profitAdjustment },
          totalWinnings: winAmount > 0 ? { increment: winAmount } : undefined
        }
      });

      // Maintain Financial Purity
      await tx.transaction.create({
        data: {
          userId,
          amount: Math.abs(profitAdjustment),
          type: profitAdjustment >= 0 ? 'TARGET_WIN' : 'TARGET_LOSS',
          status: 'SUCCESS',
          gateway: 'SYSTEM'
        }
      });

      return NextResponse.json({
        success: true,
        score: verifiedScore,
        multiplier,
        winAmount,
        newBalance: updatedUser.walletBalance,
        isBot: score > 75
      });
    });

  } catch (error) {
    console.error('TARGET_TAP_ERROR:', error);
    return NextResponse.json({ error: 'Failed to process game' }, { status: 500 });
  }
}
