import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { SignJWT } from 'jose';

export async function POST(request: Request) {
  try {
    let body;
    try {
      const contentLength = request.headers.get('content-length');
      if (contentLength === '0') {
        return NextResponse.json({ error: 'Request body cannot be empty' }, { status: 400 });
      }
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid or missing JSON body' }, { status: 400 });
    }
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and OTP are required' }, { status: 400 });
    }

    // 1. Find the latest valid OTP for this phone
    const validOtp = await prisma.otp.findFirst({
      where: {
        phone,
        code,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!validOtp) {
      return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
    }

    // 2. Mark OTP as used
    await prisma.otp.update({
      where: { id: validOtp.id },
      data: { isUsed: true },
    });

    // 3. Find or Create User
    let user = await prisma.user.findUnique({
      where: { phone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          walletBalance: 0,
        },
      });
    }

    // 4. Generate JWT & Set Cookie
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'skillspin_default_secret_key_2026');
    const token = await new SignJWT({ id: user.id, phone: user.phone })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    // 5. Return Session Data
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        phone: user.phone,
        balance: user.walletBalance,
      },
      message: 'Successfully logged in'
    });

  } catch (error) {
    console.error('OTP_VERIFY_ERROR:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
