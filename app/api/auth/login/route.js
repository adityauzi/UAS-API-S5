import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { NextResponse } from 'next/server';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'rahasia-negara');

// LOGIKA RATE LIMIT INTERNAL (BONUS)
const rateLimitMap = new Map();
function internalRateLimiter(request) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const limit = 5; 
  const windowMs = 60 * 1000;
  const now = Date.now();
  const userData = rateLimitMap.get(ip) || { count: 0, startTime: now };

  if (now - userData.startTime > windowMs) {
    userData.count = 0;
    userData.startTime = now;
  }
  userData.count++;
  rateLimitMap.set(ip, userData);
  if (userData.count > limit) throw new Error("Too Many Requests");
}

// ... import prisma, SignJWT, dll ...

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    const user = await prisma.user.findUnique({ where: { email } });

    if (user && (await bcrypt.compare(password, user.password))) {
      // 1. Generate Token Baru
      const newToken = await new SignJWT({ id: user.id, email: user.email, role: user.role })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('1d')
        .sign(SECRET_KEY);

      // 2. SIMPAN TOKEN BARU KE DATABASE (Ini akan membatalkan token lama)
      await prisma.user.update({
        where: { id: user.id },
        data: { token: newToken }
      });

      return NextResponse.json({ 
        success: true, 
        message: "Login Success", 
        token: newToken // Cukup kirim 1 token saja sesuai permintaan Anda
      });
    }
    // ... handling error ...
  } catch (error) { /* ... */ 

  }

    if (error.message === "Too Many Requests") {
      return NextResponse.json({ error: "Terlalu banyak request (Limit 5x)" }, { status: 429 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
