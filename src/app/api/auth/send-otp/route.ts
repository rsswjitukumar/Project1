import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    let body;
    try {
      // Check if the request body is empty before attempting to parse JSON
      const contentLength = request.headers.get('content-length');
      if (contentLength === '0') {
        return NextResponse.json({ error: 'Request body cannot be empty' }, { status: 400 });
      }
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid or missing JSON body' }, { status: 400 });
    }
    const { phone } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // 0. Check cooldown (30 seconds)
    const recentOtp = await prisma.otp.findFirst({
      where: {
        phone,
        createdAt: { gte: new Date(Date.now() - 30 * 1000) }
      }
    });

    if (recentOtp) {
      return NextResponse.json({ error: 'Please wait 30 seconds before requesting another OTP' }, { status: 429 });
    }

    // 1. Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // 2. Save to Database
    await prisma.otp.create({
      data: {
        phone,
        code: otpCode,
        expiresAt: expiry,
      },
    });

    // 3. Trigger SMS via Fast2SMS (or fallback to console)
    const SMS_API_KEY = process.env.FAST2SMS_API_KEY;
    if (SMS_API_KEY) {
      console.log(`[REAL_SMS] Sending ${otpCode} to ${phone} via Fast2SMS`);
      try {
        const smsRes = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            'authorization': SMS_API_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            route: 'otp',
            variables_values: otpCode,
            numbers: phone
          })
        });
        const smsData = await smsRes.json();
        if (!smsData.return) {
          console.error("Fast2SMS Error:", smsData);
        }
      } catch (smsErr) {
        console.error("Fast2SMS Network Error:", smsErr);
      }
    } else {
      console.log(`[WHATSAPP_OTP_MOCK] Sending ${otpCode} to ${phone} (Set FAST2SMS_API_KEY in .env for real SMS)`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent successfully to WhatsApp' 
    });

  } catch (error) {
    console.error('OTP_SEND_ERROR:', error);
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 });
  }
}
