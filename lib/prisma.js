import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

// Menyiapkan variabel global untuk menyimpan instance prisma
const globalForPrisma = global;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // Logging otomatis: Detail saat development, hanya error saat production
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }).$extends(withAccelerate()); // Mengaktifkan fitur Accelerate [cite: 227]

// Jika bukan di production, simpan instance ke global agar tidak dibuat ulang saat hot-reload
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}