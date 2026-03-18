import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, password, username, referralCode } = body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ phone }, { username }] }
    });

    if (existingUser) {
      if (existingUser.phone === phone) return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 });
      if (existingUser.username === username) return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
    }

    // Verify valid referrer if code provided
    let validReferrer = null;
    if (referralCode && referralCode.trim() !== '') {
      validReferrer = await prisma.user.findUnique({ where: { username: referralCode.trim() } });
    }

    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await prisma.user.create({
      data: {
        phone,
        password: hashedPassword,
        username,
        referredBy: validReferrer ? validReferrer.username : null
      }
    });

    // If there is a valid referrer, credit them instantly with Rs. 10 referral bonus
    if (validReferrer) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: validReferrer.id },
          data: {
            walletBalance: { increment: 10 },
            referralEarnings: { increment: 10 }
          }
        }),
        prisma.transaction.create({
          data: {
            userId: validReferrer.id,
            amount: 10,
            type: 'REFERRAL_BONUS',
            status: 'SUCCESS'
          }
        })
      ]).catch((err) => {
        // Log the error but don't fail the registration
        console.error('Failed to credit referrer:', err);
      });
    }

    // Generate JWT & Set Cookie
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'skillspin_default_secret_key_2026');
    const token = await new SignJWT({ id: user.id, phone: user.phone, username: user.username, role: user.role })
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
