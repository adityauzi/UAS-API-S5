// app/middleware.js
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'rahasia-negara');

export async function middleware(req) {
  const time = new Date().toLocaleString('id-ID');
  const method = req.method;
  const path = req.nextUrl.pathname;
  console.log(`[${time}] LOGGING: ${method} request ke ${path}`);

  const token = req.headers.get('authorization')?.split(' ')[1];
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/auth')) return NextResponse.next();

  if (!token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Middleware HANYA cek apakah token asli atau palsu (Stateless)
    const { payload } = await jwtVerify(token, SECRET);
    
    if (pathname.startsWith('/api/users') && payload.role !== 'Admin') {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.next();
  } catch (err) {
    return NextResponse.json({ success: false, error: "Invalid Token" }, { status: 401 });
  }
}

export const config = { matcher: '/api/:path*' };