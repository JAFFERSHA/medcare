import { cookies } from "next/headers";
import { signJWT, verifyJWT } from "./jwt";
import { prisma } from "./prisma";

const COOKIE_NAME = "medcare_session";
const MOCK_OTP = "123456"; // Fixed OTP for demo

export async function sendOTP(mobile: string): Promise<{ success: boolean; message: string }> {
  // Create OTP request record
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await prisma.oTPRequest.create({
    data: {
      mobile,
      otp: MOCK_OTP,
      expiresAt,
    },
  });

  // In production, send SMS here
  console.log(`[MOCK SMS] OTP for ${mobile}: ${MOCK_OTP}`);

  return { success: true, message: "OTP sent successfully. Use 123456 for demo." };
}

export async function verifyOTP(
  mobile: string,
  otp: string
): Promise<{ success: boolean; token?: string; message: string }> {
  // For demo, accept fixed OTP
  if (otp !== MOCK_OTP) {
    return { success: false, message: "Invalid OTP" };
  }

  // Find or create user
  let user = await prisma.user.findUnique({ where: { mobile } });

  if (!user) {
    user = await prisma.user.create({
      data: { mobile },
    });

    // Create default notification preferences
    await prisma.notificationPreference.create({
      data: { userId: user.id },
    });
  }

  // Mark OTP as verified
  await prisma.oTPRequest.updateMany({
    where: { mobile, otp, verified: false },
    data: { verified: true, userId: user.id },
  });

  // Generate JWT
  const token = await signJWT({ userId: user.id, mobile: user.mobile });

  return { success: true, token, message: "Login successful" };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload) return null;

  return prisma.user.findUnique({
    where: { id: payload.userId },
    include: { notificationPrefs: true },
  });
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: "/",
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
