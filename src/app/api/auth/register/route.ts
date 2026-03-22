import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signJWT } from "@/lib/jwt";
import { cookies } from "next/headers";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  mobile: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      const message = result.error.issues[0]?.message || "Invalid input";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const { name, email, password, mobile } = result.data;

    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    if (mobile) {
      const mobileExists = await prisma.user.findFirst({ where: { mobile } });
      if (mobileExists) {
        return NextResponse.json({ error: "Mobile number already registered" }, { status: 409 });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        mobile: mobile || null,
        passwordHash,
        notificationPrefs: {
          create: {},
        },
      },
    });

    const token = await signJWT({ userId: user.id, mobile: user.mobile ?? undefined });

    const cookieStore = await cookies();
    cookieStore.set("medcare_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
