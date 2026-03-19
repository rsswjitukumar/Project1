import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { userId, action } = await request.json();

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'skillspin_default_secret_key_2026');
    const { payload } = await jwtVerify(token, secret);
    
    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden. Admin Access Required.' }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (action === 'BLOCK') {
      if (targetUser.role === 'ADMIN') return NextResponse.json({ error: 'Cannot block another Master Admin natively.' }, { status: 400 });
      await prisma.user.update({ where: { id: userId }, data: { role: 'BANNED' } });
      return NextResponse.json({ success: true, message: 'User account frozen and banned successfully.' });
    }

    if (action === 'UNBLOCK') {
       await prisma.user.update({ where: { id: userId }, data: { role: 'USER' } });
       return NextResponse.json({ success: true, message: 'User access seamlessly unblocked.' });
    }

    if (action === 'RESET_PASSWORD') {
       // Generate isolated robust numeric pin
       const newPassword = Math.floor(100000 + Math.random() * 900000).toString(); 
       const hashedPassword = await bcrypt.hash(newPassword, 10);
       
       await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
       
       return NextResponse.json({ success: true, message: `Password reset to: ${newPassword}`, newPassword });
    }

    return NextResponse.json({ error: 'Invalid operation directive' }, { status: 400 });

  } catch (error) {
    console.error('ADMIN_ACTION_ERROR:', error);
    return NextResponse.json({ error: 'Failed to execute administrative action natively' }, { status: 500 });
  }
}
