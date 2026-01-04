import { prisma } from "@/lib/prisma";
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

// --- FUNGSI PUT (Update data) ---
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const taskId = parseInt(id);
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, SECRET);

    // Cek Single Active Token
    const userDb = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!userDb || userDb.token !== token) {
      return NextResponse.json({ error: "Sesi telah berakhir." }, { status: 401 });
    }

    const body = await req.json();
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title: body.title,
        description: body.description,
        status: body.status,
        categoryId: body.categoryId
      }
    });

    return NextResponse.json({ success: true, message: "Tugas diperbarui", data: updatedTask });
  } catch (error) {
    return NextResponse.json({ error: "Invalid Token atau ID salah" }, { status: 500 });
  }
}

// --- FUNGSI DELETE (Admin Only) ---
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const taskId = parseInt(id);

    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Verifikasi Token
    const { payload } = await jwtVerify(token, SECRET);

    // 2. PROTEKSI ROLE: Hanya Admin yang boleh
    // Perhatikan: 'Admin' harus sama persis huruf besar/kecilnya dengan di database
    if (payload.role !== 'Admin') {
      return NextResponse.json({ 
        success: false, 
        error: "Forbidden: Hanya Admin yang dapat menghapus data ini!" 
      }, { status: 403 });
    }

    // 3. Proteksi Single Token
    const userDb = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!userDb || userDb.token !== token) {
      return NextResponse.json({ error: "Sesi berakhir. Login di tempat lain." }, { status: 401 });
    }

    // 4. Eksekusi Delete
    await prisma.task.delete({
      where: { id: taskId }
    });

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil menghapus tugas dengan ID ${taskId}` 
    });

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: "Gagal menghapus. Pastikan ID tugas benar." 
    }, { status: 500 });
  }
}