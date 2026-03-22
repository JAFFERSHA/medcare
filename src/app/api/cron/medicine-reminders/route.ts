import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getMedicineReminderEmail } from "@/lib/resend";
import { sendPushNotification, getMedicineReminderPush } from "@/lib/webpush";
import { format, addMinutes, subMinutes } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();
  const windowStart = subMinutes(now, 1);
  const windowEnd = addMinutes(now, 1);

  try {
    // Find all active medicines
    const patientMedicines = await prisma.patientMedicine.findMany({
      where: {
        isActive: true,
        reminderEnabled: true,
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

    const remindersToSend: Array<{
      patientMedicine: (typeof patientMedicines)[0];
      scheduledTime: Date;
      timeStr: string;
    }> = [];

    // Check each medicine's schedule
    for (const pm of patientMedicines) {
      for (const timeStr of pm.scheduleTimes) {
        const [hours, minutes] = timeStr.split(":").map(Number);
        const scheduledTime = new Date(now);
        scheduledTime.setHours(hours, minutes, 0, 0);

        // Account for reminder minutes before
        const reminderTime = subMinutes(scheduledTime, pm.reminderMinutesBefore);

        // Check if reminder time falls within the window
        if (reminderTime >= windowStart && reminderTime <= windowEnd) {
          // Check if we haven't already created an intake for this time today
          const existingIntake = await prisma.medicineIntake.findFirst({
            where: {
              patientMedicineId: pm.id,
              scheduledTime: scheduledTime,
            },
          });

          if (!existingIntake) {
            remindersToSend.push({ patientMedicine: pm, scheduledTime, timeStr });
          }
        }
      }
    }

    // Send notifications
    const results = await Promise.allSettled(
      remindersToSend.map(async ({ patientMedicine: pm, scheduledTime, timeStr }) => {
        const prefs = pm.user.notificationPrefs;
        const formattedTime = format(scheduledTime, "h:mm a");
        const notifications: Promise<unknown>[] = [];

        // Create pending intake record
        await prisma.medicineIntake.create({
          data: {
            patientMedicineId: pm.id,
            userId: pm.userId,
            scheduledTime,
            status: "PENDING",
          },
        });

        // Send email notification
        if (prefs?.emailEnabled && prefs?.emailForReminders && pm.user.email) {
          notifications.push(
            sendEmail({
              to: pm.user.email,
              subject: `Medicine Reminder: ${pm.medicine.name}`,
              html: getMedicineReminderEmail(
                pm.medicine.name,
                formattedTime,
                `${pm.dosagePerIntake} ${pm.unitType}`
              ),
            }).then((result) =>
              prisma.notification.create({
                data: {
                  userId: pm.userId,
                  type: "MEDICINE_REMINDER",
                  channel: "EMAIL",
                  title: "Medicine Reminder",
                  body: `Time to take ${pm.medicine.name}`,
                  status: result.success ? "SENT" : "FAILED",
                  sentAt: result.success ? new Date() : null,
                  error: result.success ? null : String(result.error),
                },
              })
            )
          );
        }

        // Send push notifications
        if (prefs?.pushEnabled && prefs?.pushForReminders) {
          for (const sub of pm.user.pushSubscriptions) {
            notifications.push(
              sendPushNotification(
                sub,
                getMedicineReminderPush(pm.medicine.name, formattedTime)
              ).then(async (result) => {
                if (result.expired) {
                  await prisma.pushSubscription.update({
                    where: { id: sub.id },
                    data: { isActive: false },
                  });
                }
                return prisma.notification.create({
                  data: {
                    userId: pm.userId,
                    type: "MEDICINE_REMINDER",
                    channel: "PUSH",
                    title: "Medicine Reminder",
                    body: `Time to take ${pm.medicine.name}`,
                    status: result.success ? "SENT" : "FAILED",
                    sentAt: result.success ? new Date() : null,
                    error: result.success ? null : String(result.error),
                  },
                });
              })
            );
          }
        }

        return Promise.all(notifications);
      })
    );

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      processed: remindersToSend.length,
      results: results.map((r: PromiseSettledResult<unknown>) => r.status),
    });
  } catch (error) {
    console.error("Reminder cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
