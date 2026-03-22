import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signJWT } from "@/lib/jwt";
import { cookies } from "next/headers";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const { email, password } = result.data;

    const user = await prisma.user.findFirst({ where: { email } });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

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
    console.error("Email login error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
