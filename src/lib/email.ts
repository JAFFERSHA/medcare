import nodemailer from "nodemailer";

const transporter =
  process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD,
        },
      })
    : null;

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  if (!transporter) {
    console.log("[MOCK EMAIL] To:", to, "Subject:", subject);
    return { success: true, mock: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"MedCare" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
    });
    return { success: true, data: info };
  } catch (error) {
    console.error("Email send error:", error);
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

export function getStockAlertEmail(
  medicineName: string,
  daysRemaining: number,
  currentStock: number,
  unitType: string
) {
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

export function getPasswordResetEmail(resetUrl: string, name?: string | null) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb;">
      <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">

        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 28px;">MedCare</h1>
          <p style="color: #6b7280; margin: 6px 0 0;">Medicine Management</p>
        </div>

        <h2 style="color: #1f2937; margin: 0 0 8px;">Reset your password</h2>
        <p style="color: #4b5563; margin: 0 0 24px; line-height: 1.6;">
          Hi ${name || "there"},<br><br>
          We received a request to reset your MedCare account password.
          Click the button below to set a new password.
        </p>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}"
             style="background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px;
                    text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
            Reset Password
          </a>
        </div>

        <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 24px 0;">
          <p style="color: #6b7280; font-size: 13px; margin: 0;">
            This link will expire in <strong>1 hour</strong>.
            If you did not request a password reset, you can safely ignore this email —
            your password will not change.
          </p>
        </div>

        <p style="color: #9ca3af; font-size: 12px; word-break: break-all;">
          If the button does not work, copy this link:<br>
          <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
          Stay healthy! — MedCare Team
        </p>
      </div>
    </body>
    </html>
  `;
}
