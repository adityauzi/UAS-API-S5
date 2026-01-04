import { prisma } from "@/lib/prisma"; // Singleton Prisma
import { NextResponse } from "next/server";
import { z } from "zod";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'rahasia-negara');

const TaskSchema = z.object({
  title: z.string().min(1, "Judul harus diisi"),
  description: z.string().optional(),
  status: z.enum(['pending', 'completed']).default('pending'),
  categoryId: z.number().optional()
});

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const taskId = parseInt(id);

    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized: Token diperlukan" }, { status: 401 });
    }

    // 1. Verifikasi Tanda Tangan JWT
    const { payload } = await jwtVerify(token, SECRET);

    // --- MULAI TAMBAHAN LOGIKA SINGLE TOKEN ---
    // Cari user di database berdasarkan ID dari token
    const userDb = await prisma.user.findUnique({
      where: { id: payload.id }
    });

    // Bandingkan: Jika token yang dikirim TIDAK SAMA dengan token di DB, berarti ada login baru
    if (!userDb || userDb.token !== token) {
      return NextResponse.json({ 
        success: false, 
        error: "Sesi telah berakhir. Akun Anda telah melakukan login di tempat lain." 
      }, { status: 401 });
    }
    // --- SELESAI TAMBAHAN LOGIKA SINGLE TOKEN ---

    const body = await req.json();
    const validation = TaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Validasi gagal", 
        details: validation.error.errors 
      }, { status: 400 });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: body.title,
        description: body.description,
        status: body.status,
        categoryId: body.categoryId
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "Tugas berhasil diperbarui", 
      data: updatedTask 
    }, { status: 200 });

  } catch (error) {
    console.error("Error PUT Item:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Gagal memperbarui tugas (Token tidak valid atau ID salah)" 
    }, { status: 500 });
  }
}