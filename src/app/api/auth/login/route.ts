import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { phone_or_username, password } = await request.json();

    if (!phone_or_username || !password) {
      return NextResponse.json({ error: 'Credentials required' }, { status: 400 });
    }

    // Find User
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: phone_or_username },
          { phone: phone_or_username }
        ]
      }
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Compare Hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
       return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT & Set Cookie
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'skillspin_default_secret_key_2026');
    const token = await new SignJWT({ id: user.id, phone: user.phone, username: user.username })
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

    return NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username, phone: user.phone, balance: user.walletBalance },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('LOGIN_ERROR:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
