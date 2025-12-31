import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'rahasia-negara');

export async function middleware(req) {
  // --- MULAI LOGGING (BONUS POIN 111) ---
  const time = new Date().toLocaleString('id-ID'); // Mencatat waktu request
  const method = req.method; // Mencatat Method (GET/POST/DELETE)
  const path = req.nextUrl.pathname; // Mencatat alamat yang diakses
  
  console.log(`[${time}] LOGGING: ${method} request ke ${path}`);
  // --- SELESAI LOGGING ---

  const token = req.headers.get('authorization')?.split(' ')[1];
  const { pathname } = req.nextUrl;

  // 1. Izinkan akses Public ke /api/auth/* [cite: 59]
  if (pathname.startsWith('/api/auth')) return NextResponse.next();

  // 2. Cek apakah ada token [cite: 55]
  if (!token) {
    console.log(`[${time}] BLOCKED: Akses ditolak (Tanpa Token) di ${path}`); // Log tambahan saat ditolak
    return NextResponse.json({ success: false, error: "Unauthorized", code: 401 }, { status: 401 });
  }

  try {
    const { payload } = await jwtVerify(token, SECRET);
    
    // 3. Role-based Authorization [cite: 61, 64]
    if (pathname.startsWith('/api/users') && payload.role !== 'Admin') {
      console.log(`[${time}] FORBIDDEN: User ${payload.email} mencoba akses Admin area`); // Log saat akses ditolak role
      return NextResponse.json({ success: false, error: "Forbidden: Admin Only", code: 403 }, { status: 403 });
    }

    return NextResponse.next();
  } catch (err) {
    return NextResponse.json({ success: false, error: "Invalid Token", code: 401 }, { status: 401 });
  }
}


export const config = {
  matcher: '/api/:path*',
};