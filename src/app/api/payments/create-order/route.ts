import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import Razorpay from 'razorpay';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { amount, gateway } = await request.json();

    // Securely get userId from JWT
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'skillspin_default_secret_key_2026');
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.id as string;

    if (!amount || !gateway) {
      return NextResponse.json({ error: 'Amount and gateway are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    let orderData: any = {};

    if (gateway === 'RAZORPAY') {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder'
      });

      try {
        const options = {
          amount: Math.round(parseFloat(amount) * 100), // paise
          currency: "INR",
          receipt: `rcpt_${userId.substring(0, 10)}_${Date.now()}`
        };
        const order = await razorpay.orders.create(options);
        orderData = {
          id: order.id,
          amount: parseFloat(amount),
          currency: order.currency
        };
      } catch (err) {
        console.warn("Razorpay API failed (likely missing keys). Mocking order for local testing.", err);
        orderData = {
          id: `order_mock_${Math.random().toString(36).substring(2, 9)}`,
          amount: parseFloat(amount),
          currency: "INR"
        };
      }
    } else if (gateway === 'PAYTM') {
      // REAL PAYTM INTEGRATION LOGIC
      const PaytmChecksum = require('paytmchecksum');
      const mid = process.env.PAYTM_MID || 'YOUR_MID_HERE';
      const mkey = process.env.PAYTM_MERCHANT_KEY || 'YOUR_KEY_HERE';
      const orderId = `PAYTM_${Date.now()}_${userId.substring(0, 5)}`;
      
      const paytmParams: any = {};
      paytmParams.body = {
        "requestType": "Payment",
        "mid": mid,
        "websiteName": process.env.PAYTM_WEBSITE || "WEBSTAGING",
        "orderId": orderId,
        "callbackUrl": `${process.env.NEXT_PUBLIC_BASE_URL || 'https://game.fastucl25.pro'}/api/payments/verify`,
        "txnAmount": {
          "value": parseFloat(amount).toFixed(2),
          "currency": "INR",
        },
        "userInfo": {
          "custId": userId,
          "mobile": user.phone || ""
        },
      };

      const checksum = await PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), mkey);
      paytmParams.head = { "signature": checksum };

      // In production/sandbox use the correct Paytm URL
      const isProd = process.env.NODE_ENV === 'production';
      const paytmUrl = `https://securegw${isProd ? '' : '-stage'}.paytm.in/theia/api/v1/initiateTransaction?mid=${mid}&orderId=${orderId}`;

      try {
        const response = await fetch(paytmUrl, {
          method: 'POST',
          body: JSON.stringify(paytmParams),
          headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        
        if (result.body && result.body.txnToken) {
          orderData = {
            id: orderId,
            txnToken: result.body.txnToken,
            amount: parseFloat(amount),
            mid: mid
          };
        } else {
          throw new Error(result.body?.resultInfo?.resultMsg || 'Paytm token generation failed');
        }
      } catch (error: any) {
        console.error("Paytm API Error:", error);
        // Fallback for testing if no keys
        orderData = {
          id: orderId, // Still use the generated OrderId
          amount: parseFloat(amount),
          mock: true 
        };
      }
    } else {
      orderData = {
        id: `gen_order_${Math.random().toString(36).substring(2, 9)}`,
        amount: parseFloat(amount),
      };
    }

    await prisma.transaction.create({
      data: {
        userId,
        amount: parseFloat(amount),
        type: 'DEPOSIT',
        status: 'PENDING',
        gateway: gateway,
        orderId: orderData.id,
      },
    });

    return NextResponse.json({ success: true, order: orderData });

  } catch (error) {
    console.error('PAYMENT_ORDER_ERROR:', error);
    return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
  }
}
