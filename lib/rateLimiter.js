// lib/RateLimiter.js
const rateLimitMap = new Map();

export function RateLimiter(request) {
  const ip = request.headers.get("x-forwarded-for") || "anonymous";
  const limit = 5; // DIUBAH MENJADI 5 KALI KLIK
  const windowMs = 60 * 1000; // Jeda waktu reset 1 menit

  const now = Date.now();
  const userData = rateLimitMap.get(ip) || { count: 0, startTime: now };

  if (now - userData.startTime > windowMs) {
    userData.count = 0;
    userData.startTime = now;
  }

  userData.count++;
  rateLimitMap.set(ip, userData);

  if (userData.count > limit) {
    // Melempar error jika sudah lebih dari 5 kali
    throw new Error("Too Many Requests");
  }
}