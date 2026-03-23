import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { sendPushNotification, getMedicineReminderPush } from "@/lib/webpush";

export const dynamic = "force-dynamic";

// Runs once daily at 7 AM — sends each user a summary of all today's medicines
export async function GET() {
  const now = new Date();

  try {
    // Get all users who have active medicines with reminders enabled
    const users = await prisma.user.findMany({
      where: {
        patientMedicines: {
          some: { isActive: true, reminderEnabled: true },
        },
      },
      include: {
        patientMedicines: {
          where: { isActive: true, reminderEnabled: true },
          include: { medicine: true },
        },
        pushSubscriptions: { where: { isActive: true } },
        notificationPrefs: true,
      },
    });

    const results = await Promise.allSettled(
      users.map(async (user) => {
        const prefs = user.notificationPrefs;
        const medicines = user.patientMedicines;
        if (!medicines.length) return;

        // Build today's schedule list
        const scheduleRows = medicines
          .flatMap((pm) =>
            pm.scheduleTimes.map((t) => ({
              name: pm.medicine.name,
              time: t,
              dose: `${pm.dosagePerIntake} ${pm.unitType}`,
              form: pm.medicine.dosageForm,
            }))
          )
          .sort((a, b) => a.time.localeCompare(b.time));

        // Create pending intake records for today
        for (const pm of medicines) {
          for (const timeStr of pm.scheduleTimes) {
            const [hours, minutes] = timeStr.split(":").map(Number);
            const scheduledTime = new Date(now);
            scheduledTime.setHours(hours, minutes, 0, 0);

            const exists = await prisma.medicineIntake.findFirst({
              where: { patientMedicineId: pm.id, scheduledTime },
            });
            if (!exists) {
              await prisma.medicineIntake.create({
                data: {
                  patientMedicineId: pm.id,
                  userId: user.id,
                  scheduledTime,
                  status: "PENDING",
                },
              });
            }
          }
        }

        // Send email summary
        if (prefs?.emailEnabled && prefs?.emailForReminders && user.email) {
          const rows = scheduleRows
            .map(
              (r) => `
              <tr>
                <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#1f2937;font-weight:500;">${r.name}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;">${r.time}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;">${r.dose}</td>
              </tr>`
            )
            .join("");

          const html = `
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
            <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9fafb;">
              <div style="background:white;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,.1);">
                <div style="text-align:center;margin-bottom:24px;">
                  <h1 style="color:#2563eb;margin:0;font-size:26px;">MedCare</h1>
                  <p style="color:#6b7280;margin:4px 0 0;">Your Daily Medicine Schedule</p>
                </div>

                <p style="color:#1f2937;margin:0 0 20px;">
                  Good morning${user.name ? ", " + user.name : ""}! Here are your medicines for today:
                </p>

                <table style="width:100%;border-collapse:collapse;background:#f9fafb;border-radius:8px;overflow:hidden;">
                  <thead>
                    <tr style="background:#eff6ff;">
                      <th style="padding:10px 12px;text-align:left;color:#1d4ed8;font-size:13px;">Medicine</th>
                      <th style="padding:10px 12px;text-align:left;color:#1d4ed8;font-size:13px;">Time</th>
                      <th style="padding:10px 12px;text-align:left;color:#1d4ed8;font-size:13px;">Dose</th>
                    </tr>
                  </thead>
                  <tbody>${rows}</tbody>
                </table>

                <div style="margin-top:24px;text-align:center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
                     style="background:#2563eb;color:white;padding:12px 28px;border-radius:8px;
                            text-decoration:none;font-weight:600;display:inline-block;">
                    Open MedCare
                  </a>
                </div>

                <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">
                <p style="color:#9ca3af;font-size:12px;text-align:center;margin:0;">
                  Stay healthy! — MedCare Team
                </p>
              </div>
            </body>
            </html>`;

          await sendEmail({
            to: user.email,
            subject: `Your medicine schedule for today — ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}`,
            html,
          });

          await prisma.notification.create({
            data: {
              userId: user.id,
              type: "MEDICINE_REMINDER",
              channel: "EMAIL",
              title: "Daily Medicine Summary",
              body: `${scheduleRows.length} dose(s) scheduled today`,
              status: "SENT",
              sentAt: new Date(),
            },
          });
        }

        // Send push notification summary
        if (prefs?.pushEnabled && prefs?.pushForReminders && user.pushSubscriptions.length) {
          const firstName = medicines[0].medicine.name;
          const count = scheduleRows.length;
          for (const sub of user.pushSubscriptions) {
            await sendPushNotification(
              sub,
              getMedicineReminderPush(
                `${count} medicine${count > 1 ? "s" : ""} scheduled today`,
                scheduleRows[0]?.time ?? "today"
              )
            ).then(async (result) => {
              if (result.expired) {
                await prisma.pushSubscription.update({
                  where: { id: sub.id },
                  data: { isActive: false },
                });
              }
            });
          }
        }
      })
    );

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      usersProcessed: users.length,
      results: results.map((r) => r.status),
    });
  } catch (error) {
    console.error("Reminder cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
