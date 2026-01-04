import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'rahasia-negara');

// --- 1. LOGIKA RATE LIMIT INTERNAL (BONUS) ---
const rateLimitMap = new Map();
function internalRateLimiter(request) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const limit = 5; // Batas 5 kali sesuai permintaan Anda
  const windowMs = 60 * 1000;
  const now = Date.now();
  const userData = rateLimitMap.get(ip) || { count: 0, startTime: now };

  if (now - userData.startTime > windowMs) {
    userData.count = 0;
    userData.startTime = now;
  }
  userData.count++;
  rateLimitMap.set(ip, userData);
  if (userData.count > limit) throw new Error("Too Many Requests");
}

const TaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['pending', 'completed']).default('pending'),
  categoryId: z.number().optional()
});

// --- 2. FUNGSI PUT (Update) ---
export async function PUT(req, { params }) {
  try {
    internalRateLimiter(req); // WAJIB DIPANGGIL DI SINI

    const { id } = await params;
    const taskId = parseInt(id);
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, SECRET);

    // Proteksi Single Active Token
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

    return NextResponse.json({ success: true, data: updatedTask });
  } catch (error) {
    if (error.message === "Too Many Requests") {
      return NextResponse.json({ error: "Terlalu banyak request (Limit 5x)" }, { status: 429 });
    }
    return NextResponse.json({ error: "Invalid Token atau ID salah" }, { status: 500 });
  }
}

// --- 3. FUNGSI DELETE (Admin Only) ---
export async function DELETE(req, { params }) {
  try {
    internalRateLimiter(req); // WAJIB DIPANGGIL DI SINI

    const { id } = await params;
    const taskId = parseInt(id);
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, SECRET);

    // Proteksi Role Admin
    if (payload.role !== 'Admin') {
      return NextResponse.json({ error: "Forbidden: Admin Only" }, { status: 403 });
    }

    const userDb = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!userDb || userDb.token !== token) {
      return NextResponse.json({ error: "Sesi berakhir." }, { status: 401 });
    }

    await prisma.task.delete({ where: { id: taskId } });
    return NextResponse.json({ success: true, message: `ID ${taskId} dihapus` });

  } catch (error) {
    if (error.message === "Too Many Requests") {
      return NextResponse.json({ error: "Terlalu banyak request (Limit 5x)" }, { status: 429 });
    }
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}