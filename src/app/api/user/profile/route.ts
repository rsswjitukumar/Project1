import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'skillspin_default_secret_key_2026');
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        phone: true,
        walletBalance: true,
        referralCode: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Auto-generate referralCode for existing users if missing
    let finalUser = { ...user };
    if (!user.referralCode) {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = 'SKL-';
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: {
          id: true,
          username: true,
          phone: true,
          walletBalance: true,
          referralCode: true
        }
      });
      finalUser = updatedUser;
    }

    return NextResponse.json({ success: true, user: finalUser });
  } catch (error) {
    console.error('PROFILE_ERROR:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
