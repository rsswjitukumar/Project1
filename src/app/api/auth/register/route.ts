import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { username, phone, password } = await request.json();

    if (!username || !phone || !password) {
      return NextResponse.json({ error: 'Username, phone, and password are required' }, { status: 400 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { phone }]
      }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Username or phone already registered' }, { status: 400 });
    }

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const user = await prisma.user.create({
      data: {
        username,
        phone,
        password: hashedPassword,
        walletBalance: 0,
      }
    });

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
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('REGISTER_ERROR:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
