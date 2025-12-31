import { prisma } from "@/lib/prisma"; // [cite: 206, 224]
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { name, email, password, role } = await req.json();
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: role || 'User' }
    });

    // Response disesuaikan dengan standar PDF dosen 
    return NextResponse.json({ 
      success: true, 
      message: "User created", 
      data: { id: user.id, email: user.email } 
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: "Email sudah terdaftar", 
      code: 400 
    }, { status: 400 });
  }
}