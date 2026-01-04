import { jwtVerify, SignJWT } from "jose";
import { NextResponse } from "next/server";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'rahasia-negara');

export async function POST(req) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token wajib diisi" }, { status: 400 });
    }

    // Verifikasi Refresh Token
    const { payload } = await jwtVerify(refreshToken, SECRET);

    // Buat Access Token baru
    const newAccessToken = await new SignJWT({ id: payload.id, role: payload.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('3m')
      .sign(SECRET);

    return NextResponse.json({ success: true, token: newAccessToken });
  } catch (error) {
    return NextResponse.json({ error: "Refresh token tidak valid atau expired" }, { status: 401 });
  }
}