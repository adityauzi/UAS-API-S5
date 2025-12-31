import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const { name, email, password, role } = await req.json();
    const hashedPassword = await bcrypt.hash(password, 10); // Hash password [cite: 35]

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: role || 'User' }
    });

    return NextResponse.json({ success: true, data: { id: user.id, email: user.email } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Email sudah terdaftar", code: 400 }, { status: 400 });
  }
}