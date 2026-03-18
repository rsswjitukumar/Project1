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

    // 3. Trigger WhatsApp Message (from 9911886585)
    // To send from a specific number, you must be using a WhatsApp API provider
    // (like Meta Cloud API, UltraMsg, Wati, Twilio, etc.)
    const WA_API_URL = process.env.WA_API_URL;
    const WA_API_KEY = process.env.WA_API_KEY;
    
    if (WA_API_URL && WA_API_KEY) {
      console.log(`[REAL_WHATSAPP] Sending ${otpCode} to ${phone} from 9911886585`);
      try {
        // This is a generic REST call for most WhatsApp gateways (e.g. UltraMsg/ChatAPI)
        // If you are using official Meta API, the body structure changes slightly (needs App templates).
        const waRes = await fetch(WA_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            token: WA_API_KEY,      // Common for unofficial APIs
            to: `91${phone}`,       // Indian country code prefix
            body: `Welcome to SkillSpin Arena! Your OTP is: *${otpCode}*. Please do not share this with anyone.`
          })
        });
        
        const waData = await waRes.json();
        console.log("WhatsApp API Response:", waData);
      } catch (waErr) {
        console.error("WhatsApp Network Error:", waErr);
      }
    } else {
      console.log(`[WHATSAPP_OTP_MOCK] Sending ${otpCode} to ${phone} from 9911886585 (Set WA_API_URL & WA_API_KEY in .env)`);
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
