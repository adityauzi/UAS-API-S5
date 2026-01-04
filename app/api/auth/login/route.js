import { prisma } from "@/lib/prisma"; // Mengambil instance tunggal prisma
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose'; 
import { NextResponse } from 'next/server';
import { RateLimiter } from "@/lib/RateLimiter"; 

// Pastikan SECRET_KEY sinkron dengan Environment Variables di Vercel
const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'rahasia-negara');

export async function POST(req) {
  try {
    // --- BONUS 1: Rate Limiting (Mencegah Brute Force) ---
    RateLimiter(req); 

    const { email, password } = await req.json();

    // Mencari user di database NeonDB
    const user = await prisma.user.findUnique({ 
      where: { email } 
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      
      // --- BONUS 2: Access Token (Masa aktif 15 menit) ---
      const accessToken = await new SignJWT({ id: user.id, email: user.email, role: user.role })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('15m')
        .sign(SECRET_KEY);

      // --- BONUS 3: Refresh Token (Masa aktif 7 hari) ---
      const refreshToken = await new SignJWT({ id: user.id })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('7d')
        .sign(SECRET_KEY);
      
      // Response sukses sesuai standar pengujian
      return NextResponse.json({ 
        success: true, 
        message: "Login Success", 
        token: accessToken,
        refreshToken: refreshToken 
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: "Invalid credentials", 
      code: 401 
    }, { status: 401 });

  } catch (error) {
    // Menangkap error jika user melakukan spam request
    if (error.message === "Too Many Requests") {
      return NextResponse.json({ 
        success: false, 
        error: "Terlalu banyak request, coba lagi dalam 1 menit" 
      }, { status: 429 });
    }
    
    console.error("Login Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal Server Error" 
    }, { status: 500 });
  }
}