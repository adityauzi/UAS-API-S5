import { prisma } from "@/lib/prisma"; 
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { name, email, password, role } = await req.json();

    // 1. CEK EMAIL TERLEBIH DAHULU (PENTING!)
    // Ini agar error "Email sudah terdaftar" hanya muncul jika email memang ada
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        error: "Email sudah terdaftar", 
        code: 400 
      }, { status: 400 });
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Simpan ke Database
    // PASTIKAN: Di schema.prisma Anda sudah ada field 'name'. 
    // Jika belum ada, hapus bagian 'name' di bawah ini.
    const user = await prisma.user.create({
      data: { 
        name, // Cek apakah field ini ada di model User Anda
        email, 
        password: hashedPassword, 
        role: role || 'User' 
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "User created", 
      data: { id: user.id, email: user.email } 
    }, { status: 201 });

  } catch (error) {
    console.error("Register Error:", error); // Muncul di terminal VS Code untuk debug
    return NextResponse.json({ 
      success: false, 
      error: "Internal Server Error: " + error.message 
    }, { status: 500 });
  }
}