const FAST2SMS_URL = "https://www.fast2sms.com/dev/bulkV2";

// Strip country code — Fast2SMS needs 10-digit Indian number
function cleanNumber(mobile: string): string {
  return mobile.replace(/^\+91/, "").replace(/\s/g, "").slice(-10);
}

interface SMSResult {
  success: boolean;
  error?: unknown;
}

export async function sendSMS(mobile: string, message: string): Promise<SMSResult> {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    console.log("[MOCK SMS]", mobile, ":", message);
    return { success: true };
  }

  const number = cleanNumber(mobile);
  if (number.length !== 10) {
    return { success: false, error: "Invalid mobile number" };
  }

  try {
    const res = await fetch(
      `${FAST2SMS_URL}?authorization=${apiKey}&route=q&message=${encodeURIComponent(message)}&language=english&flash=0&numbers=${number}`,
      { method: "GET", headers: { "cache-control": "no-cache" } }
    );
    const data = await res.json();
    if (data.return === true) {
      return { success: true };
    }
    console.error("Fast2SMS error:", data);
    return { success: false, error: data.message };
  } catch (error) {
    console.error("SMS send error:", error);
    return { success: false, error };
  }
}

export function getMedicineReminderSMS(
  medicineName: string,
  time: string,
  dose: string
): string {
  return `MedCare Reminder: Time to take ${medicineName} - ${dose} at ${time}. Stay healthy! -MedCare`;
}

export function getStockAlertSMS(
  medicineName: string,
  daysRemaining: number
): string {
  return `MedCare Alert: ${medicineName} stock is low - only ${daysRemaining} day(s) remaining. Please refill soon. -MedCare`;
}
