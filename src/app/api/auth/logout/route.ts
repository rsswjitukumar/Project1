import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    const cookieStore = await cookies();
    // Delete the secure JWT cookie
    cookieStore.delete('auth_token');
    
    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('LOGOUT_ERROR:', error);
    return NextResponse.json({ error: 'Failed to logout' }, { status: 500 });
  }
}
