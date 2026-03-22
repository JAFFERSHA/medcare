import webpush from "web-push";

// Set VAPID details if keys are available
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:noreply@medcare.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string }>;
}

export async function sendPushNotification(
  subscription: PushSubscription,
  payload: PushPayload
) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log("[MOCK PUSH] To:", subscription.endpoint, "Payload:", payload);
    return { success: true, mock: true };
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    );
    return { success: true };
  } catch (error: unknown) {
    console.error("Push notification error:", error);

    const err = error as { statusCode?: number };
    // If subscription is invalid, return error for cleanup
    if (err.statusCode === 410 || err.statusCode === 404) {
      return { success: false, expired: true, error };
    }

    return { success: false, error };
  }
}

export function getMedicineReminderPush(
  medicineName: string,
  time: string
): PushPayload {
  return {
    title: "Medicine Reminder",
    body: `Time to take ${medicineName} (${time})`,
    icon: "/icons/icon-192x192.svg",
    badge: "/icons/badge-72x72.svg",
    data: { type: "MEDICINE_REMINDER", url: "/dashboard" },
    actions: [
      { action: "take", title: "Mark as Taken" },
      { action: "snooze", title: "Snooze 10 min" },
    ],
  };
}

export function getStockAlertPush(
  medicineName: string,
  daysRemaining: number
): PushPayload {
  return {
    title: "Low Stock Alert",
    body: `${medicineName} - Only ${daysRemaining} days supply left!`,
    icon: "/icons/icon-192x192.svg",
    badge: "/icons/badge-72x72.svg",
    data: { type: "STOCK_ALERT", url: "/medicines" },
    actions: [{ action: "view", title: "View Details" }],
  };
}
