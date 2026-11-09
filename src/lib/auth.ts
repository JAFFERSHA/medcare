import crypto from "crypto";
import { cookies } from "next/headers";
import { signJWT, verifyJWT } from "./jwt";
import { prisma } from "./prisma";
import { sendSMS } from "./sms";

const COOKIE_NAME = "medcare_session";

const OTP_TTL_MS = 5 * 60 * 1000; // a code is valid for 5 minutes
const OTP_SEND_LIMIT = 3; // max codes per mobile number...
const OTP_SEND_WINDOW_MS = 10 * 60 * 1000; // ...within 10 minutes

// Only a hash of the code is stored, so a database leak does not reveal live codes.
function hashOTP(mobile: string, otp: string): string {
  return crypto
    .createHash("sha256")
    .update(`${mobile}:${otp}:${process.env.JWT_SECRET ?? ""}`)
    .digest("hex");
}

export async function sendOTP(mobile: string): Promise<{ success: boolean; message: string }> {
  const isProd = process.env.NODE_ENV === "production";

  // Fail closed: never fall back to a mock/fixed code in production.
  if (isProd && !process.env.FAST2SMS_API_KEY) {
    console.error("OTP login unavailable: FAST2SMS_API_KEY is not set");
    return {
      success: false,
      message: "OTP login is temporarily unavailable. Please sign in with email.",
    };
  }

  const recent = await prisma.oTPRequest.count({
    where: { mobile, createdAt: { gt: new Date(Date.now() - OTP_SEND_WINDOW_MS) } },
  });
  if (recent >= OTP_SEND_LIMIT) {
    return {
      success: false,
      message: "Too many OTP requests. Please wait a few minutes and try again.",
    };
  }

  const otp = crypto.randomInt(100000, 1000000).toString();

  const record = await prisma.oTPRequest.create({
    data: { mobile, otp: hashOTP(mobile, otp), expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });

  const sms = await sendSMS(
    mobile,
    `${otp} is your MedCare login code. It is valid for 5 minutes. Do not share it with anyone. -MedCare`
  );
  if (!sms.success) {
    await prisma.oTPRequest.delete({ where: { id: record.id } });
    return {
      success: false,
      message: "Could not send the OTP. Please try again, or sign in with email.",
    };
  }

  if (!isProd) console.log(`[DEV OTP] ${mobile}: ${otp}`);

  return { success: true, message: "OTP sent to your mobile number." };
}

export async function verifyOTP(
  mobile: string,
  otp: string
): Promise<{ success: boolean; token?: string; message: string }> {
  // Latest unused, unexpired code for this mobile number
  const otpRecord = await prisma.oTPRequest.findFirst({
    where: { mobile, verified: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    return { success: false, message: "OTP has expired. Please request a new one." };
  }

  const expected = Buffer.from(otpRecord.otp, "hex");
  const given = Buffer.from(hashOTP(mobile, otp), "hex");
  const matches = expected.length === given.length && crypto.timingSafeEqual(expected, given);

  if (!matches) {
    // A wrong guess burns the code, so a 6-digit code cannot be brute-forced.
    await prisma.oTPRequest.update({ where: { id: otpRecord.id }, data: { verified: true } });
    return { success: false, message: "Incorrect OTP. Please request a new code." };
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

  // Mark this and any other outstanding codes for the number as used
  await prisma.oTPRequest.updateMany({
    where: { mobile, verified: false },
    data: { verified: true, userId: user.id },
  });

  // Generate JWT
  const token = await signJWT({ userId: user.id, mobile: user.mobile ?? undefined });

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
