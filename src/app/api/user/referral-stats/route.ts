import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'skillspin_default_secret_key_2026');
    const { payload } = await jwtVerify(token, secret);
    const username = payload.username as string;

    const [user, referredCount] = await Promise.all([
      prisma.user.findUnique({ where: { id: payload.id as string } }),
      prisma.user.count({ where: { referredBy: username } })
    ]);

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ 
      success: true, 
      stats: {
        totalInvited: referredCount,
        totalEarnings: user.referralEarnings,
        referralLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://game.fastucl25.pro'}/login?ref=${user.referralCode || username}`,
        referralCode: user.referralCode || username
      }
    });
  } catch (error) {
    console.error('REFERRAL_STATS_ERROR:', error);
    return NextResponse.json({ error: 'Failed to fetch referral stats' }, { status: 500 });
  }
}
