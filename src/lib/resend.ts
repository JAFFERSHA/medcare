import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!resend) {
    console.log("[MOCK EMAIL] To:", to, "Subject:", subject);
    return { success: true, mock: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "MedCare <noreply@resend.dev>",
      to,
      subject,
      html,
    });

    if (error) {
      console.error("Email send error:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Email send exception:", error);
    return { success: false, error };
  }
}

export function getMedicineReminderEmail(medicineName: string, time: string, dosage: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">MedCare</h1>
        <p style="color: #6b7280; margin: 5px 0;">Medicine Reminder</p>
      </div>

      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h2 style="margin: 0 0 10px; color: #1f2937;">Time to take your medicine</h2>
        <div style="background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb;">
          <h3 style="margin: 0; color: #1f2937;">${medicineName}</h3>
          <p style="margin: 8px 0 0; color: #6b7280;">Scheduled: ${time}</p>
          <p style="margin: 4px 0 0; color: #6b7280;">Dosage: ${dosage}</p>
        </div>
      </div>

      <p style="color: #6b7280; font-size: 14px; text-align: center;">
        Stay healthy! - MedCare Team
      </p>
    </body>
    </html>
  `;
}

export function getStockAlertEmail(medicineName: string, daysRemaining: number, currentStock: number, unitType: string) {
  const isUrgent = daysRemaining <= 3;
  const bgColor = isUrgent ? "#fef2f2" : "#fffbeb";
  const borderColor = isUrgent ? "#dc2626" : "#d97706";
  const textColor = isUrgent ? "#dc2626" : "#d97706";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">MedCare</h1>
        <p style="color: ${textColor}; margin: 5px 0; font-weight: bold;">Stock Alert</p>
      </div>

      <div style="background: ${bgColor}; padding: 20px; border-radius: 8px; border-left: 4px solid ${borderColor}; margin: 20px 0;">
        <h2 style="margin: 0 0 10px; color: #1f2937;">Low Stock Warning</h2>
        <h3 style="margin: 0; color: #1f2937;">${medicineName}</h3>
        <p style="margin: 8px 0 0; color: #6b7280;">Current stock: ${currentStock} ${unitType}</p>
        <p style="margin: 4px 0 0; color: ${textColor}; font-weight: bold;">
          Only ${daysRemaining} days of supply remaining!
        </p>
      </div>

      <p style="color: #1f2937; margin: 20px 0;">
        Please refill your medicine soon to avoid running out.
      </p>

      <p style="color: #6b7280; font-size: 14px; text-align: center;">
        Stay healthy! - MedCare Team
      </p>
    </body>
    </html>
  `;
}
