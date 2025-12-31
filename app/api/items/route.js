import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

// Inisialisasi prisma harus di luar fungsi agar tidak berat
const prisma = new PrismaClient();

export async function GET(req) {
  try {
    // 1. Menangkap parameter dari URL (Postman)
    const { searchParams } = new URL(req.url);
    
    // 2. Konversi ke angka dan beri nilai default jika kosong
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    
    // 3. Rumus Pagination
    const skip = (page - 1) * limit;

    // 4. Ambil data dari database dengan pembatasan
    // Pastikan nama tabelnya 'task' sesuai dengan schema.prisma Anda
    const tasks = await prisma.task.findMany({
      skip: skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    // 5. Hitung total data untuk meta informasi
    const totalData = await prisma.task.count();

    return NextResponse.json({ 
      success: true, 
      data: tasks,
      meta: {
        total: totalData,
        page: page,
        limit: limit,
        totalPages: Math.ceil(totalData / limit)
      }
    });
  } catch (error) {
    // MENAMPILKAN ERROR ASLI DI TERMINAL (Sangat penting untuk debug)
    console.error("DEBUG ERROR:", error.message);
    
    return NextResponse.json({ 
      success: false, 
      error: "Gagal memproses data: " + error.message, 
      code: 500 
    }, { status: 500 });
  }
}

// Tambahkan juga fungsi POST jika belum ada untuk tambah tugas