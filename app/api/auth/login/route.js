import { prisma } from "@/lib/prisma"; // Mengambil instance tunggal [cite: 206, 224]
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

// Pastikan SECRET_KEY sinkron dengan Environment Variables di Vercel [cite: 451, 479]
const SECRET_KEY = process.env.JWT_SECRET || 'rahasia-negara';

export async function POST(req) {
  try {
    const { email, password } = await req.json();

    // Mencari user menggunakan instance prisma dari folder lib [cite: 224]
    const user = await prisma.user.findUnique({ 
      where: { email } 
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Generate JWT dengan payload sesuai standar UAS [cite: 633, 634]
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role }, 
        SECRET_KEY, 
        { expiresIn: '1d' }
      );
      
      // Response sukses sesuai contoh pengujian dosen [cite: 621-623]
      return NextResponse.json({ 
        success: true, 
        message: "Login Success", 
        token 
      });
    }

    return NextResponse.json({ 
      success: false, 
      error: "Invalid credentials", 
      code: 401 
    }, { status: 401 });

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal Server Error" 
    }, { status: 500 });
  }
}