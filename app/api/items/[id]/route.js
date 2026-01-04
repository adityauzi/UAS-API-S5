import { prisma } from "@/lib/prisma"; // Menggunakan singleton prisma
import { NextResponse } from "next/server";
import { z } from "zod";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'rahasia-negara');

// Validasi skema untuk Task berdasarkan schema.prisma
const TaskSchema = z.object({
  title: z.string().min(1, "Judul harus diisi"),
  description: z.string().optional(),
  status: z.enum(['pending', 'completed']).default('pending'),
  categoryId: z.number().optional()
});

export async function PUT(req, { params }) {
  try {
    // 1. Ambil ID dari URL
    const { id } = await params;
    const taskId = parseInt(id);

    // 2. Cek Token (Proteksi Token Wajib)
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized: Token diperlukan" }, { status: 401 });
    }
    await jwtVerify(token, SECRET);

    // 3. Ambil dan Validasi Body
    const body = await req.json();
    const validation = TaskSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Validasi gagal", 
        details: validation.error.errors 
      }, { status: 400 });
    }

    // 4. Update data di database NeonDB
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
      error: "Gagal memperbarui tugas atau ID tidak ditemukan" 
    }, { status: 500 });
  }
}