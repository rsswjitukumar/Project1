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
    
    // Auto-generate and SAVE referralCode if it's missing for existing users
    let currentUserCode = user.referralCode;
    if (!currentUserCode) {
      const namePart = (user.username || 'USER').replace(/\s/g, '').substring(0, 4).toUpperCase();
      const randPart = Math.floor(1000 + Math.random() * 9000);
      currentUserCode = `${namePart}${randPart}`;
      
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: { referralCode: currentUserCode }
        });
      } catch (e) {
        // If code exists, use username as fallback for this request only
        currentUserCode = user.username || user.id.substring(0, 8);
      }
    }

    const host = request.headers.get('host') || 'game.fastucl25.pro';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    return NextResponse.json({ 
      success: true, 
      stats: {
        totalInvited: referredCount,
        totalEarnings: user.referralEarnings,
        referralCode: currentUserCode,
        referralLink: `${baseUrl}/login?ref=${currentUserCode}`
      }
    });
  } catch (error) {
    console.error('REFERRAL_STATS_ERROR:', error);
    return NextResponse.json({ error: 'Failed to fetch referral stats' }, { status: 500 });
  }
}
