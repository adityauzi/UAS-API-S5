import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// LOGIKA RATE LIMIT INTERNAL (BONUS)
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

export async function GET(request) {
  try {
    internalRateLimiter(request); // Panggil fungsi internal

    const items = await prisma.task.findMany({
        include: { category: true }
    });

    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    if (error.message === "Too Many Requests") {
      return NextResponse.json({ error: "Terlalu banyak request, coba lagi nanti" }, { status: 429 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}