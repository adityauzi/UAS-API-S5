import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { prisma } from '@/lib/prisma'; // Pastikan import prisma ada

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'rahasia-negara');

export async function middleware(req) {
  // --- MULAI LOGGING (BONUS POIN 111) ---
  const time = new Date().toLocaleString('id-ID');
  const method = req.method;
  const path = req.nextUrl.pathname;
  console.log(`[${time}] LOGGING: ${method} request ke ${path}`);
  // --- SELESAI LOGGING ---

  const token = req.headers.get('authorization')?.split(' ')[1];
  const { pathname } = req.nextUrl;

  // 1. Izinkan akses Public ke /api/auth/*
  if (pathname.startsWith('/api/auth')) return NextResponse.next();

  // 2. Cek apakah ada token
  if (!token) {
    return NextResponse.json({ success: false, error: "Unauthorized: Token tidak ditemukan", code: 401 }, { status: 401 });
  }

  try {
    // 3. Verifikasi Tanda Tangan JWT
    const { payload } = await jwtVerify(token, SECRET);
    
    // --- LOGIKA SINGLE TOKEN (CEK DATABASE) ---
    // Cari user berdasarkan ID dari payload
    const userDb = await prisma.user.findUnique({
      where: { id: payload.id }
    });

    // Jika token di request tidak sama dengan token terbaru di DB, maka tolak
    if (!userDb || userDb.token !== token) {
      console.log(`[${time}] BLOCKED: Token usang/tidak valid untuk ${payload.email}`);
      return NextResponse.json({ 
        success: false, 
        error: "Sesi berakhir. Akun Anda telah login di tempat lain.", 
        code: 401 
      }, { status: 401 });
    }
    // --- SELESAI CEK SINGLE TOKEN ---

    // 4. Role-based Authorization
    if (pathname.startsWith('/api/users') && payload.role !== 'Admin') {
      return NextResponse.json({ success: false, error: "Forbidden: Admin Only", code: 403 }, { status: 403 });
    }

    return NextResponse.next();
  } catch (err) {
    return NextResponse.json({ success: false, error: "Token Kedaluwarsa atau Tidak Valid", code: 401 }, { status: 401 });
  }
}

export const config = {
  matcher: '/api/:path*',
};