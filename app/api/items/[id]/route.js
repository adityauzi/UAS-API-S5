import { prisma } from "@/lib/prisma"; // [cite: 206, 224]
import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'rahasia-negara');

export async function DELETE(req, { params }) {
  try {
    const token = req.headers.get('authorization')?.split(' ')[1];
    const { id } = await params;

    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized", code: 401 }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, SECRET);

    if (payload.role !== 'Admin') {
      return NextResponse.json({ 
        success: false, 
        error: "Forbidden: Hanya Admin yang boleh menghapus tugas", 
        code: 403 
      }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ success: true, message: "Tugas berhasil dihapus" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ 
      success: false, 
      error: "Gagal menghapus atau ID tidak ditemukan", 
      code: 404 
    }, { status: 404 });
  }
}