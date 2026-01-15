import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getStockAlertEmail } from "@/lib/resend";
import { sendPushNotification, getStockAlertPush } from "@/lib/webpush";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Find all active medicines
    const patientMedicines = await prisma.patientMedicine.findMany({
      where: {
        isActive: true,
        stockAlertEnabled: true,
      },
      include: {
        medicine: true,
        user: {
          include: {
            pushSubscriptions: { where: { isActive: true } },
            notificationPrefs: true,
          },
        },
      },
    });

    // Filter for low stock medicines
    const lowStockMedicines = patientMedicines.filter((pm) => {
      const dailyUsage = pm.dosagePerIntake * pm.timesPerDay;
      if (dailyUsage === 0) return false;
      const daysRemaining = Math.floor(pm.currentStock / dailyUsage);
      return daysRemaining <= pm.lowStockThreshold && daysRemaining > 0;
    });

    const outOfStockMedicines = patientMedicines.filter(
      (pm) => pm.currentStock <= 0
    );

    // Send notifications for low stock
    const results = await Promise.allSettled(
      lowStockMedicines.map(async (pm) => {
        const prefs = pm.user.notificationPrefs;
        const dailyUsage = pm.dosagePerIntake * pm.timesPerDay;
        const daysRemaining = Math.floor(pm.currentStock / dailyUsage);
        const notifications: Promise<unknown>[] = [];

        // Check if we already sent an alert today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const existingAlert = await prisma.notification.findFirst({
          where: {
            userId: pm.userId,
            type: "STOCK_ALERT",
            createdAt: { gte: today },
            data: {
              path: ["patientMedicineId"],
              equals: pm.id,
            },
          },
        });

        if (existingAlert) {
          return { skipped: true, reason: "Already sent today" };
        }

        // Send email notification
        if (prefs?.emailEnabled && prefs?.emailForStockAlerts && pm.user.email) {
          notifications.push(
            sendEmail({
              to: pm.user.email,
              subject: `Low Stock Alert: ${pm.medicine.name}`,
              html: getStockAlertEmail(
                pm.medicine.name,
                daysRemaining,
                pm.currentStock,
                pm.unitType
              ),
            })
          );
        }

        // Send push notifications
        if (prefs?.pushEnabled && prefs?.pushForStockAlerts) {
          for (const sub of pm.user.pushSubscriptions) {
            notifications.push(
              sendPushNotification(
                sub,
                getStockAlertPush(pm.medicine.name, daysRemaining)
              ).then(async (result) => {
                if (result.expired) {
                  await prisma.pushSubscription.update({
                    where: { id: sub.id },
                    data: { isActive: false },
                  });
                }
                return result;
              })
            );
          }
        }

        // Log notification
        await prisma.notification.create({
          data: {
            userId: pm.userId,
            type: "STOCK_ALERT",
            channel: "EMAIL",
            title: "Low Stock Alert",
            body: `${pm.medicine.name} - ${daysRemaining} days remaining`,
            data: { patientMedicineId: pm.id, daysRemaining },
            status: "SENT",
            sentAt: new Date(),
          },
        });

        return Promise.all(notifications);
      })
    );

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      lowStock: lowStockMedicines.length,
      outOfStock: outOfStockMedicines.length,
      processed: results.length,
      results: results.map((r) => r.status),
    });
  } catch (error) {
    console.error("Stock alert cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
