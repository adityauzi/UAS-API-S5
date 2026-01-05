import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'rahasia-negara');

// LOGIKA RATE LIMIT INTERNAL (BONUS)
const rateLimitMap = new Map();
function internalRateLimiter(request) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const limit = 5; 
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

// --- FUNGSI GET (Tampilkan dengan Pagination) ---
export async function GET(request) {
  try {
    internalRateLimiter(request);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skip = (page - 1) * limit;

    const items = await prisma.task.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    if (error.message === "Too Many Requests") return NextResponse.json({ error: "Limit 5x tercapai" }, { status: 429 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- FUNGSI POST (Tambah Tugas Baru - INI YANG ANDA BUTUHKAN) ---
export async function POST(req) {
  try {
    internalRateLimiter(req); // Proteksi Bonus

    const token = req.headers.get('authorization')?.split(' ')[1];
    const { payload } = await jwtVerify(token, SECRET);

    // Proteksi Single Token
    const userDb = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!userDb || userDb.token !== token) {
      return NextResponse.json({ error: "Sesi berakhir" }, { status: 401 });
    }

    const body = await req.json();
    const newTask = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        status: "pending",
        userId: payload.id // Menghubungkan tugas ke user yang login
      }
    });

    return NextResponse.json({ success: true, message: "Tugas berhasil ditambah", data: newTask }, { status: 201 });
  } catch (error) {
    if (error.message === "Too Many Requests") return NextResponse.json({ error: "Limit 5x tercapai" }, { status: 429 });
    return NextResponse.json({ error: "Gagal menambah tugas" }, { status: 500 });
  }
}