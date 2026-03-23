import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getMedicineReminderEmail } from "@/lib/email";
import { sendPushNotification, getMedicineReminderPush } from "@/lib/webpush";
import { sendSMS, getMedicineReminderSMS } from "@/lib/sms";
import { format, addMinutes, subMinutes } from "date-fns";

export const dynamic = "force-dynamic";

// Called every 5 minutes by external cron (cron-job.org)
// Sends per-dose reminders within ±3 minute window of scheduled time
export async function GET(request: Request) {
  // Verify CRON_SECRET
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowStart = subMinutes(now, 3);
  const windowEnd = addMinutes(now, 3);

  try {
    const patientMedicines = await prisma.patientMedicine.findMany({
      where: { isActive: true, reminderEnabled: true },
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

    const dosesToRemind: Array<{
      pm: (typeof patientMedicines)[0];
      scheduledTime: Date;
    }> = [];

    for (const pm of patientMedicines) {
      for (const timeStr of pm.scheduleTimes) {
        const [hours, minutes] = timeStr.split(":").map(Number);
        const scheduledTime = new Date(now);
        scheduledTime.setHours(hours, minutes, 0, 0);

        // Check if this dose time falls in our ±3 min window
        if (scheduledTime >= windowStart && scheduledTime <= windowEnd) {
          // Skip if intake already created for this slot
          const exists = await prisma.medicineIntake.findFirst({
            where: { patientMedicineId: pm.id, scheduledTime },
          });
          if (!exists) {
            dosesToRemind.push({ pm, scheduledTime });
          }
        }
      }
    }

    const results = await Promise.allSettled(
      dosesToRemind.map(async ({ pm, scheduledTime }) => {
        const prefs = pm.user.notificationPrefs;
        const formattedTime = format(scheduledTime, "h:mm a");

        // Create intake record
        await prisma.medicineIntake.create({
          data: {
            patientMedicineId: pm.id,
            userId: pm.userId,
            scheduledTime,
            status: "PENDING",
          },
        });

        const tasks: Promise<unknown>[] = [];

        // Email reminder
        if (prefs?.emailEnabled && prefs?.emailForReminders && pm.user.email) {
          tasks.push(
            sendEmail({
              to: pm.user.email,
              subject: `💊 Time to take ${pm.medicine.name} — ${formattedTime}`,
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
                  title: `Take ${pm.medicine.name}`,
                  body: `${pm.dosagePerIntake} ${pm.unitType} at ${formattedTime}`,
                  status: result.success ? "SENT" : "FAILED",
                  sentAt: result.success ? new Date() : null,
                  error: result.success ? null : String(result.error),
                },
              })
            )
          );
        }

        // Push reminder
        if (prefs?.pushEnabled && prefs?.pushForReminders) {
          for (const sub of pm.user.pushSubscriptions) {
            tasks.push(
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
                    title: `Take ${pm.medicine.name}`,
                    body: `${pm.dosagePerIntake} ${pm.unitType} at ${formattedTime}`,
                    status: result.success ? "SENT" : "FAILED",
                    sentAt: result.success ? new Date() : null,
                    error: result.success ? null : String(result.error),
                  },
                });
              })
            );
          }
        }

        // SMS reminder
        if (prefs?.smsEnabled && prefs?.smsForReminders && pm.user.mobile) {
          tasks.push(
            sendSMS(
              pm.user.mobile,
              getMedicineReminderSMS(pm.medicine.name, formattedTime, `${pm.dosagePerIntake} ${pm.unitType}`)
            ).then((result) =>
              prisma.notification.create({
                data: {
                  userId: pm.userId,
                  type: "MEDICINE_REMINDER",
                  channel: "IN_APP",
                  title: `SMS: Take ${pm.medicine.name}`,
                  body: `${pm.dosagePerIntake} ${pm.unitType} at ${formattedTime}`,
                  status: result.success ? "SENT" : "FAILED",
                  sentAt: result.success ? new Date() : null,
                  error: result.success ? null : String(result.error),
                },
              })
            )
          );
        }

        return Promise.all(tasks);
      })
    );

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      windowStart: windowStart.toISOString(),
      windowEnd: windowEnd.toISOString(),
      reminders_sent: dosesToRemind.length,
      results: results.map((r) => r.status),
    });
  } catch (error) {
    console.error("Dose reminder cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
