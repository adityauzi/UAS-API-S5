import { prisma } from "@/lib/prisma"; // 
import { NextResponse } from 'next/server';

// FITUR AMBIL DATA (PAGINATION)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;

    const tasks = await prisma.task.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    const totalData = await prisma.task.count();

    return NextResponse.json({ 
      success: true, 
      data: tasks,
      meta: { total: totalData, page, limit, totalPages: Math.ceil(totalData / limit) }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

import { RateLimiter } from "@/lib/RateLimiter";

export async function GET(request) {
  try {
    RateLimiter(request); // Panggil di sini
    // ... sisa kode Anda
  } catch (error) {
    if (error.message === "Too Many Requests") {
      return Response.json({ error: "Terlalu banyak request, coba lagi nanti" }, { status: 429 });
    }
  }
}

// FITUR TAMBAH DATA (POST)
export async function POST(req) {
  try {
    const { title, description, userId } = await req.json();
    const newTask = await prisma.task.create({
      data: { title, description, userId: parseInt(userId) }
    });
    return NextResponse.json({ success: true, data: newTask }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Gagal tambah tugas" }, { status: 500 });
  }
}