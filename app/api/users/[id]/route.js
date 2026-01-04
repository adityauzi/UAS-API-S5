import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"
// Sesuaikan path import di bawah ini jika error
import { RateLimiter } from "@/lib/RateLimiter" 
import { requireAuth } from "@/lib/auth"

const UserSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    role: z.enum(['USER', 'ADMIN']).default('USER'),
    password: z.string().min(6)
})

export async function GET(request, { params }) {
    try {
        const { user } = await requireAuth(request);
        if (!user) {
            return NextResponse.json(
                { success: false, error: "user memiliki token tidak valid" },
                { status: 500 }
            )
        }

        RateLimiter(request)

        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);

        if (isNaN(id)) {
            return NextResponse.json({ success: false, error: "Invalid user ID", code: 400 }, { status: 400 })
        }

        const User = await prisma.user.findUnique({
            where: { id: id }
        })

        if (!User) {
            return NextResponse.json({ success: false, error: "User not found", code: 404 }, { status: 404 })
        }

        return NextResponse.json({ success: true, message: "user found", data: User }, { status: 200 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ success: false, error: "internal server error", code: 500 }, { status: 500 })
    }
}

export async function PUT(request, { params }) {
    try {
        const { user } = await requireAuth(request);
        if (!user) {
            return NextResponse.json(
                { success: false, error: "user memiliki token tidak valid" },
                { status: 500 }
            )
        }

        RateLimiter(request)

        const resolvedParams = await params;
        const id = parseInt(resolvedParams.id);

        const body = await request.json();
        const validation = UserSchema.safeParse(body)

        if (!validation.success) {
            console.error(validation.error.errors)
            return NextResponse.json({ success: false, error: "validasi gagal", code: 400 }, { status: 400 })
        }

        const updateUser = await prisma.user.update({
            where: { id: id },
            data: {
                name: body.name,
                email: body.email,
                role: body.role,
                password: body.password
            }
        })

        return NextResponse.json({ success: true, message: "user updated successfully", data: updateUser }, { status: 200 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ success: false, error: "internal server error", code: 500 }, { status: 500 })
    }
}