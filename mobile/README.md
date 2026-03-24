# MedCare Mobile

React Native (Expo) mobile application for MedCare — your personal medicine stock manager and reminder app.

## Features

- **Authentication** — Phone OTP login & Email/Password with registration
- **Dashboard** — Today's schedule, stats, low-stock alerts, take/skip actions
- **Medicine Management** — Add, view, edit, delete medicines with stock tracking
- **Intake History** — Adherence stats with day filters (7/14/30/90 days)
- **Settings** — Profile management, notification preferences

## Tech Stack

- [Expo](https://expo.dev) (SDK 53) with [Expo Router](https://expo.github.io/router)
- React Native + TypeScript
- Expo Secure Store (JWT token storage)
- Expo Notifications (push notifications)

## Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your phone (for development)

### Setup

```bash
cd mobile
npm install
cp .env.example .env
```

Edit `.env` to point to your backend:
```
EXPO_PUBLIC_API_URL=https://medcare-vert.vercel.app
```

### Run

```bash
# Start the dev server
npm start

# iOS simulator
npm run ios

# Android emulator / device
npm run android
```

Scan the QR code with **Expo Go** on your phone to run the app.

## Project Structure

```
mobile/
├── app/
│   ├── (auth)/          # Login, Register, Verify OTP, Forgot Password
│   ├── (main)/          # Dashboard, Medicines, History, Settings
│   │   └── medicines/   # List, Add, Detail screens
│   ├── _layout.tsx      # Root layout (AuthProvider + ToastProvider)
│   └── index.tsx        # Auth redirect
├── components/
│   └── ui/              # Button, Input, Card, EmptyState, LoadingScreen
├── contexts/
│   ├── AuthContext.tsx   # Authentication state
│   └── ToastContext.tsx  # In-app notifications
├── lib/
│   ├── api.ts           # API client (connects to medcare backend)
│   └── storage.ts       # Secure token/user storage
└── assets/images/       # App icons and splash screen
```

## Building for Production

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure build
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## API

The mobile app connects to the same backend as the web app (`medcare-vert.vercel.app`). All API calls include the JWT token stored in Expo Secure Store.
