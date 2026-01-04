import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'rahasia-negara');

export async function GET(request) {
  try {
    // 1. Ambil Query Parameters dari URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    
    // Rumus Pagination Prisma
    const skip = (page - 1) * limit;

    // 2. Verifikasi Token & Single Active Token
    const token = request.headers.get('authorization')?.split(' ')[1];
    const { payload } = await jwtVerify(token, SECRET);
    const userDb = await prisma.user.findUnique({ where: { id: payload.id } });

    if (!userDb || userDb.token !== token) {
      return NextResponse.json({ error: "Sesi tidak valid" }, { status: 401 });
    }

    // 3. Ambil Data dengan Skip dan Take (INTI PAGINATION)
    const [items, totalCount] = await Promise.all([
      prisma.task.findMany({
        skip: skip,
        take: limit,
        orderBy: { createdAt: 'desc' } // Urutkan dari yang terbaru
      }),
      prisma.task.count() // Hitung total data untuk metadata
    ]);

    // 4. Response dengan Metadata (Bonus Poin)
    return NextResponse.json({ 
      success: true, 
      data: items,
      pagination: {
        total_data: totalCount,
        total_pages: Math.ceil(totalCount / limit),
        current_page: page,
        limit: limit
      }
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}