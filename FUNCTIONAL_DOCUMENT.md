# MedCare — Functional Document

**Version:** 1.0
**Date:** March 2026
**Application URL:** https://medcare-vert.vercel.app
**Stack:** Next.js 16 · PostgreSQL (Neon) · Prisma ORM · Tailwind CSS

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [User Authentication](#2-user-authentication)
3. [Module: Dashboard](#3-module-dashboard)
4. [Module: My Medicines](#4-module-my-medicines)
5. [Module: Add Medicine](#5-module-add-medicine)
6. [Module: Medicine Detail](#6-module-medicine-detail)
7. [Module: Intake History](#7-module-intake-history)
8. [Module: Settings](#8-module-settings)
9. [Notification System](#9-notification-system)
10. [API Reference](#10-api-reference)
11. [Database Schema](#11-database-schema)
12. [Technology Stack](#12-technology-stack)
13. [Environment Configuration](#13-environment-configuration)

---

## 1. Application Overview

**MedCare** is a personal medicine stock management web application that helps users:

- Track all their prescribed and regular medicines in one place
- Never miss a dose with scheduled reminders (email + push notifications)
- Monitor stock levels and get alerted before medicines run out
- Review their medication adherence history over time

### Key Capabilities

| Capability | Description |
|---|---|
| Multi-form login | Phone OTP or Email + Password |
| Medicine tracking | Add, edit, and soft-delete medicines |
| Dosage scheduling | Daily, weekly, monthly, or as-needed schedules |
| Stock management | Track units, refill stock, view stock history |
| Intake logging | Mark doses as Taken, Skipped, or Missed |
| Adherence reports | View intake history with % adherence rate |
| Notifications | Email, browser push, and in-app sound alerts |
| Responsive design | Works on desktop, tablet, and mobile browsers |
| PWA ready | Installable as an app on mobile home screens |

---

## 2. User Authentication

### 2.1 Login Page (`/login`)

The login page provides two methods via a tab switcher:

#### Tab 1 — Phone OTP Login

| Step | Action | Details |
|---|---|---|
| 1 | Enter 10-digit mobile number | Validated as Indian mobile number |
| 2 | Click "Send OTP" | OTP record created (5-min expiry) |
| 3 | Enter 6-digit OTP | Auto-submits on complete entry |
| 4 | Verified | JWT session cookie set (7-day expiry) |

> **Demo OTP:** `123456` (for testing in development)

#### Tab 2 — Email Login

| Step | Action | Details |
|---|---|---|
| Sign In | Enter email + password | Bcrypt-hashed password comparison |
| Register | Enter name + email + password | New account created |
| Forgot Password | Click link | Redirects to `/forgot-password` |

### 2.2 Forgot Password (`/forgot-password`)

1. User enters their registered email address
2. System generates a unique reset token (1-hour expiry)
3. Reset link is sent to the email via Gmail SMTP
4. Link format: `https://medcare-vert.vercel.app/reset-password?token=<token>`

### 2.3 Reset Password (`/reset-password`)

1. User opens reset link from email
2. Token is validated (not expired, not already used)
3. User enters and confirms new password (minimum 8 characters)
4. Password is updated; token marked as used
5. User is redirected to login page

### 2.4 Session Management

- **Cookie name:** `medcare_session`
- **Type:** HttpOnly, Secure (production), SameSite=Lax
- **Expiry:** 7 days
- **Logout:** Clears cookie and redirects to `/login`

### 2.5 Route Protection (Middleware)

| Path | Access |
|---|---|
| `/login`, `/forgot-password`, `/reset-password` | Public — no auth required |
| `/dashboard`, `/medicines`, `/history`, `/settings` | Protected — valid session required |
| `/api/auth/*` | Public API endpoints |
| `/api/*` (all others) | Protected — JWT verified, `x-user-id` injected |
| `/api/cron/*` | Protected by `CRON_SECRET` Bearer token |

---

## 3. Module: Dashboard

**Route:** `/dashboard`

### 3.1 Summary Stats Cards

| Card | Data Shown |
|---|---|
| Total Medicines | Count of active medicines for the user |
| Low Stock | Count of medicines below their alert threshold |
| Taken Today | Number of doses logged as TAKEN today |
| Daily Doses | Total scheduled doses for today |

### 3.2 Today's Schedule

- Lists all medicines scheduled for today with their dose times
- Each row shows: Medicine name, dosage form icon, strength, scheduled time
- **Actions:**
  - **Take** — Marks the dose as TAKEN, deducts dosage from stock
  - **Skip** — Marks the dose as SKIPPED (no stock change)
- Status badges: `Taken` (green), `Skipped` (gray), `Missed` (red), `Upcoming` (blue)

### 3.3 Low Stock Alerts

- Displays medicines where current stock ÷ dosage per intake < low stock threshold (days)
- Shows medicine name, current stock quantity, and days remaining
- Provides a quick **Refill** link to the medicine detail page

### 3.4 Empty States

- If no medicines added: displays a prompt with an "Add Your First Medicine" button
- If all doses done for today: displays a completion message

---

## 4. Module: My Medicines

**Route:** `/medicines`

### 4.1 Medicine List View

Displays a responsive grid of all active medicines belonging to the logged-in user.

Each medicine card shows:

| Field | Description |
|---|---|
| Name | Brand name of the medicine |
| Dosage Form | Emoji + label (💊 Tablet, 🧪 Syrup, etc.) |
| Strength | Concentration (e.g., 500mg) |
| Current Stock | Units remaining with unit type |
| Days Remaining | Calculated as: `currentStock ÷ (dosagePerIntake × timesPerDay)` |
| Low Stock Badge | Shown in red when days remaining < threshold |

Clicking a card navigates to `/medicines/[id]` for detail view.

### 4.2 Empty State

When no medicines are added, a centered empty-state card is shown with an "Add Medicine" button.

---

## 5. Module: Add Medicine

**Route:** `/medicines/add`

### 5.1 Section: Medicine Details

| Field | Type | Required | Notes |
|---|---|---|---|
| Medicine Name | Text | Yes | Brand name (e.g., Paracetamol) |
| Generic Name | Text | No | Chemical name (e.g., Acetaminophen) |
| Dosage Form | Visual Card Grid | Yes | 8 options — auto-updates related fields |
| Strength | Text | No | Placeholder changes per dosage form |

### 5.2 Dosage Form — Dynamic Field Mapping

Selecting a dosage form automatically updates the fields below:

| Form | Unit Options | Default Dose | Strength Hint | Usage Tip |
|---|---|---|---|---|
| 💊 Tablet | tablets, caplets | 1 | e.g., 500mg | Swallow whole with water |
| 💊 Capsule | capsules, softgels, gelcaps | 1 | e.g., 250mg | Do not crush or chew |
| 🧪 Syrup | ml, teaspoons, tablespoons | 10 | e.g., 250mg/5ml | Measure carefully, shake well |
| 💉 Injection | ml, vials, ampoules, units (IU) | 1 | e.g., 100mg/ml | Follow doctor's instructions |
| 🧴 Cream | applications, grams, fingertip units | 1 | e.g., 1% | Apply thin layer, wash hands |
| 💧 Drops | drops, ml | 3 | e.g., 0.5% | Tilt head, avoid touching dropper |
| 💨 Inhaler | puffs, doses, inhalations | 2 | e.g., 100mcg/puff | Shake, breathe out, hold 10s |
| 🔵 Other | units, pieces, patches… | 1 | e.g., 500mg | Follow pharmacist instructions |

### 5.3 Section: Stock & Dosage

| Field | Type | Notes |
|---|---|---|
| Current Stock | Number | Initial units on hand |
| Unit Type | Dropdown | Options filtered by dosage form |
| Dose Per Intake | Decimal (step 0.5) | Unit shown inline (e.g., "2 puffs") |
| Low Stock Alert (days) | Number | Trigger alert when this many days of stock remain |

**Stock Preview:** When stock and dose fields are filled, a real-time preview shows:
> `30 tablets ÷ 1 tablet/dose = 30 doses`

### 5.4 Section: Schedule

| Field | Type | Notes |
|---|---|---|
| Frequency | Dropdown | Daily / Weekly / Monthly / As Needed |
| Schedule Times | Time inputs | One per dose; up to 10 times |
| Enable Reminders | Checkbox | Sends push/email at scheduled time |
| Enable Stock Alerts | Checkbox | Sends alert when stock runs low |

Times section is hidden for "As Needed" frequency.

### 5.5 Section: Notes

Free-text area for instructions (e.g., "Take after meals", "Avoid sunlight").

### 5.6 On Submit

- Validates required fields
- Creates a `Medicine` master record and a `PatientMedicine` record linked to the user
- Shows success toast and redirects to `/medicines`
- Shows error toast on failure

---

## 6. Module: Medicine Detail

**Route:** `/medicines/[id]`

### 6.1 Stock Information Card

| Field | Description |
|---|---|
| Current Stock | Units remaining |
| Days Remaining | Calculated estimate |
| Low Stock Warning | Red banner if days < threshold |
| Refill Stock | Number input + "Add Stock" button |

**Refill Action:** Adds the entered quantity to current stock, creates a `StockHistory` record of type `PURCHASE`.

### 6.2 Schedule Information Card

Shows dosage form, strength, frequency, times per day, scheduled times, and whether reminders are enabled.

### 6.3 Recent Intake History

Displays the last 10 intake records:

| Field | Description |
|---|---|
| Date & Time | When the dose was scheduled |
| Status | TAKEN (green), SKIPPED (gray), MISSED (red) |
| Dose Taken | Actual dosage recorded |
| Notes / Skip Reason | Optional note logged at time of action |

### 6.4 Stock History

Displays the last 10 stock changes with:
- Change type (PURCHASE, INTAKE, ADJUSTMENT)
- Previous stock → New stock
- Quantity change (+/-)
- Date

### 6.5 Edit Medicine

Full edit form pre-populated with current values. All fields from the Add Medicine form are editable.

### 6.6 Delete Medicine

- Soft-delete (sets `isActive = false`)
- Shows a red confirmation card before deleting
- Shows error toast if delete fails

---

## 7. Module: Intake History

**Route:** `/history`

### 7.1 Time Period Filter

User can filter history by:
- Last 7 days
- Last 14 days
- Last 30 days
- Last 90 days

### 7.2 Adherence Stats Cards

| Card | Formula |
|---|---|
| Adherence Rate | `(TAKEN ÷ (TAKEN + MISSED)) × 100` |
| Doses Taken | Count of TAKEN records |
| Doses Skipped | Count of SKIPPED records |
| Doses Missed | Count of MISSED records |

### 7.3 History Table

Records are grouped by date (most recent first). Each row shows:
- Medicine name and dosage form
- Scheduled time
- Status badge with icon
- Dose taken quantity

---

## 8. Module: Settings

**Route:** `/settings`

### 8.1 Profile Section

| Field | Editable | Notes |
|---|---|---|
| Name | Yes | Display name across app |
| Email | Yes | Used for email notifications |
| Mobile Number | No (read-only) | Shown with +91 prefix |

Saved via `PATCH /api/user/profile`. Shows success/error toast on save.

### 8.2 Push Notifications

| Control | Description |
|---|---|
| Enable Push Notifications | Requests browser permission and registers service worker subscription |
| Medicine Reminders | Toggle push for scheduled dose reminders |
| Low Stock Alerts | Toggle push for stock threshold alerts |

Browser compatibility is checked; section is hidden if not supported.

### 8.3 Email Notifications

| Control | Description |
|---|---|
| Enable Email Notifications | Master toggle for all email alerts |
| Medicine Reminders | Toggle email for scheduled reminders |
| Low Stock Alerts | Toggle email for stock alerts |

Sent via Gmail SMTP (sjsatechworld@gmail.com).

### 8.4 Sound Notifications

| Control | Description |
|---|---|
| Enable Sound | Master toggle for all notification sounds |
| Test Notification Sound | Plays a 3-tone chime (C5→E5→G5) |
| Test Alert Sound | Plays an urgent 2-tone alarm (A5→E5) |

Sounds are generated by the Web Audio API — no external audio files required.

### 8.5 Quiet Hours (Database-ready)

Quiet hours fields are stored in `NotificationPreference` but not yet exposed in UI. Planned for a future release.

---

## 9. Notification System

### 9.1 Channels

| Channel | Provider | When Sent |
|---|---|---|
| Email | Gmail SMTP (Nodemailer) | Medicine reminders, stock alerts, password reset |
| Browser Push | Web Push API (VAPID) | Medicine reminders, stock alerts |
| In-App Sound | Web Audio API | On intake actions (if sound enabled) |
| In-App Record | Database (Notification table) | All notifications logged |

### 9.2 Cron Jobs (Scheduled Tasks)

| Job | Endpoint | Trigger | Action |
|---|---|---|---|
| Medicine Reminders | `POST /api/cron/medicine-reminders` | Scheduled (e.g., every hour) | Sends email + push to users with upcoming doses |
| Stock Alerts | `POST /api/cron/stock-alerts` | Scheduled (e.g., daily) | Sends alert to users with low stock |

Both endpoints are protected by a `CRON_SECRET` Bearer token header.

### 9.3 Email Templates

**Password Reset Email**
- Subject: "Reset your MedCare password"
- Body: Reset link valid for 1 hour
- From: sjsatechworld@gmail.com

**Medicine Reminder Email**
- Subject: "Time to take your medicine"
- Lists each scheduled medicine with dose and time

**Stock Alert Email**
- Subject: "Medicine stock running low"
- Shows medicines with days remaining and urgency level (critical/low/warning)

### 9.4 Push Notification Payloads

**Medicine Reminder**
```
Title: "💊 Time for your medicine"
Body:  "Take [Name] — [Dose] [Unit]"
Actions: [Take Now] [Snooze 15min]
```

**Stock Alert**
```
Title: "⚠️ Medicine stock low"
Body:  "[Name] — only [N] days remaining"
Actions: [View Details]
```

---

## 10. API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Send OTP to mobile number |
| POST | `/api/auth/verify-otp` | Verify OTP and issue JWT session |
| POST | `/api/auth/login-email` | Login with email + password |
| POST | `/api/auth/register` | Register new email account |
| POST | `/api/auth/forgot-password` | Send password reset email |
| POST | `/api/auth/reset-password` | Reset password with token |
| POST | `/api/auth/logout` | Clear session cookie |
| GET  | `/api/auth/me` | Get current authenticated user |

### Medicines

| Method | Endpoint | Description |
|---|---|---|
| GET  | `/api/medicines` | List all active medicines with today's intakes |
| POST | `/api/medicines` | Add a new medicine |
| GET  | `/api/medicines/[id]` | Get medicine detail + recent history |
| PATCH | `/api/medicines/[id]` | Update medicine details |
| DELETE | `/api/medicines/[id]` | Soft-delete medicine |

### Intake

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/intake?days=7&medicineId=X` | Get intake history |
| POST | `/api/intake` | Record intake (TAKEN / SKIPPED) |

### Stock

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/stock` | Add stock refill |

### User

| Method | Endpoint | Description |
|---|---|---|
| PATCH | `/api/user/profile` | Update name and email |

### Notifications

| Method | Endpoint | Description |
|---|---|---|
| GET   | `/api/notifications/preferences` | Get user notification preferences |
| PATCH | `/api/notifications/preferences` | Update notification preferences |
| POST  | `/api/notifications/subscribe` | Register browser push subscription |
| DELETE| `/api/notifications/subscribe` | Unsubscribe from push |

### Cron

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/cron/medicine-reminders` | Bearer CRON_SECRET | Send scheduled reminders |
| POST | `/api/cron/stock-alerts` | Bearer CRON_SECRET | Send stock alert notifications |

---

## 11. Database Schema

### Entity Relationship Summary

```
User
 ├── OTPRequest            (mobile OTP records)
 ├── PasswordResetToken    (email reset tokens)
 ├── PatientMedicine       (user's medicines)
 │    ├── MedicineIntake   (intake logs per dose)
 │    └── StockHistory     (stock change audit trail)
 ├── PushSubscription      (browser push endpoints)
 ├── NotificationPreference (per-user notification settings)
 └── Notification          (all notifications sent/received)

Medicine ──< PatientMedicine  (medicine master → user link)
```

### Key Models

| Model | Purpose |
|---|---|
| `User` | Account with mobile, email, password hash |
| `OTPRequest` | Phone login OTP with expiry |
| `PasswordResetToken` | Email reset token with 1-hr expiry |
| `Medicine` | Global medicine master record |
| `PatientMedicine` | User-specific: stock, schedule, alerts |
| `MedicineIntake` | Per-dose: taken/skipped/missed log |
| `StockHistory` | Audit trail: purchase/intake/adjustment |
| `PushSubscription` | Browser push endpoint + VAPID keys |
| `NotificationPreference` | Per-user email/push/sound toggles |
| `Notification` | Log of all notifications (any channel) |

### Key Enums

| Enum | Values |
|---|---|
| `DosageForm` | TABLET, CAPSULE, SYRUP, INJECTION, CREAM, DROPS, INHALER, OTHER |
| `Frequency` | DAILY, WEEKLY, MONTHLY, AS_NEEDED, CUSTOM |
| `IntakeStatus` | PENDING, TAKEN, SKIPPED, MISSED |
| `StockChangeType` | PURCHASE, INTAKE, ADJUSTMENT, EXPIRED, LOST |
| `NotificationType` | MEDICINE_REMINDER, STOCK_ALERT, STOCK_OUT, WELCOME, SYSTEM |
| `NotificationChannel` | EMAIL, PUSH, IN_APP |
| `NotificationStatus` | PENDING, SENT, DELIVERED, FAILED, READ |

---

## 12. Technology Stack

| Category | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.1.2 |
| UI Library | React | 19.2.3 |
| Styling | Tailwind CSS | 4.x |
| ORM | Prisma | 7.2.0 |
| Database | PostgreSQL (Neon serverless) | — |
| Auth | Jose (JWT) | 6.1.3 |
| Validation | Zod | 4.3.5 |
| Email | Nodemailer + Gmail SMTP | 6.x |
| Push Notifications | web-push (VAPID) | 3.6.7 |
| Icons | Lucide React | 0.562.0 |
| Date Utilities | date-fns | 4.1.0 |
| Cookie Management | cookies-next | 6.1.1 |
| Deployment | Vercel | — |

### Architecture Pattern

```
Browser (React Client Components)
       │  fetch()
       ▼
Next.js Middleware  ──→  JWT verification → x-user-id header
       │
       ▼
Next.js API Route Handlers  ──→  Zod validation → Prisma ORM → PostgreSQL
                            │
                            └──→  Nodemailer (Gmail SMTP) for emails
                            └──→  web-push for browser notifications
```

---

## 13. Environment Configuration

### Required Environment Variables

| Variable | Description | Where Used |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon) | Prisma ORM |
| `JWT_SECRET` | Secret key for signing JWT tokens (≥32 chars) | Auth middleware |
| `GMAIL_USER` | Gmail address for sending emails | Nodemailer |
| `GMAIL_APP_PASSWORD` | Gmail App Password (not account password) | Nodemailer |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app | Email links |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | VAPID public key for push | Service worker |
| `VAPID_PRIVATE_KEY` | VAPID private key for push | web-push server |
| `CRON_SECRET` | Bearer token for cron job endpoints | Cron protection |

### Gmail App Password Setup

1. Go to Google Account → Security → 2-Step Verification (must be enabled)
2. Go to Security → App Passwords
3. Select "Mail" and generate a password
4. Use the 16-character code (without spaces) as `GMAIL_APP_PASSWORD`

---

## Appendix: User Flow Diagrams

### New User Registration Flow (Email)
```
/login (Email tab)
  └── Click "Register"
        └── Enter name + email + password
              └── POST /api/auth/register
                    ├── Success → JWT set → /dashboard
                    └── Error → Toast "Email already in use"
```

### Forgot Password Flow
```
/login → "Forgot password?"
  └── /forgot-password
        └── Enter email → POST /api/auth/forgot-password
              └── Email sent with reset link
                    └── /reset-password?token=xyz
                          └── Enter new password → POST /api/auth/reset-password
                                └── Success → /login with success toast
```

### Add Medicine + Take Dose Flow
```
/medicines/add
  └── Select dosage form (fields auto-update)
        └── Fill in stock, dosage, schedule
              └── Submit → POST /api/medicines
                    └── /dashboard (next day)
                          └── Schedule shows medicine
                                └── Click "Take"
                                      └── POST /api/intake (TAKEN)
                                            └── Stock auto-decremented
                                                  └── Intake record created
```

### Low Stock Alert Flow
```
Cron job: POST /api/cron/stock-alerts
  └── Find users with stock < threshold
        └── Send email (Gmail SMTP)
        └── Send browser push (web-push)
        └── Log to Notification table
```

---

*Document generated for MedCare v1.0 — March 2026*
