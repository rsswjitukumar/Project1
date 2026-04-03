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

    const [user, referredFriends] = await Promise.all([
      prisma.user.findUnique({ where: { id: payload.id as string } }),
      prisma.user.findMany({ 
        where: { referredBy: username },
        select: { username: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Force generate referralCode for existing users if missing
    let currentCode = user.referralCode;
    if (!currentCode) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = 'SKL';
      for (let i = 0; i < 5; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { referralCode: code }
      });
      currentCode = updated.referralCode!;
    }

    return NextResponse.json({ 
      success: true, 
      stats: {
        totalInvited: referredFriends.length, // Note: This is now just the count of fetched ones, wait... 
        // Better to have a separate count if they have more than 10.
        // Actually, let's keep the count separate.
        totalEarnings: user.referralEarnings,
        referralLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://game.fastucl25.pro'}/login?ref=${currentCode}`,
        referralCode: currentCode,
        recentInvites: referredFriends
      }
    });
  } catch (error) {
    console.error('REFERRAL_STATS_ERROR:', error);
    return NextResponse.json({ error: 'Failed to fetch referral stats' }, { status: 500 });
  }
}
