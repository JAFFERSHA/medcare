"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Settings, User, Bell, Mail, Volume2, Play, Send, CheckCircle, XCircle } from "lucide-react";
import { playNotificationSound, playAlertSound } from "@/lib/sound";
import { useToast } from "@/hooks/useToast";

interface UserProfile {
  id: string;
  mobile: string;
  name: string | null;
  email: string | null;
  notificationPrefs: {
    emailEnabled: boolean;
    emailForReminders: boolean;
    emailForStockAlerts: boolean;
    pushEnabled: boolean;
    pushForReminders: boolean;
    pushForStockAlerts: boolean;
    soundEnabled: boolean;
  } | null;
}

export default function SettingsPage() {
  const toast = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    emailEnabled: true,
    emailForReminders: true,
    emailForStockAlerts: true,
    pushEnabled: true,
    pushForReminders: true,
    pushForStockAlerts: true,
    soundEnabled: true,
  });

  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>("default");
  const [testEmailStatus, setTestEmailStatus] = useState<Record<string, "idle" | "sending" | "success" | "error">>({
    reminder: "idle",
    stock: "idle",
  });

  useEffect(() => {
    fetchUser();
    checkPushSupport();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (!data.error) {
        setUser(data);
        setProfile({
          name: data.name || "",
          email: data.email || "",
        });
        if (data.notificationPrefs) {
          setNotificationPrefs(data.notificationPrefs);
        }
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkPushSupport = () => {
    const supported =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setPushSupported(supported);
    if (supported) {
      setPushPermission(Notification.permission);
    }
  };

  const requestPushPermission = async () => {
    if (!pushSupported) return;

    const permission = await Notification.requestPermission();
    setPushPermission(permission);

    if (permission === "granted") {
      // Register service worker and subscribe
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        });

        // Send subscription to server
        await fetch("/api/notifications/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: btoa(
                String.fromCharCode(
                  ...new Uint8Array(subscription.getKey("p256dh")!)
                )
              ),
              auth: btoa(
                String.fromCharCode(...new Uint8Array(subscription.getKey("auth")!))
              ),
            },
          }),
        });

        toast.success("Push notifications enabled!");
      } catch (error) {
        console.error("Error subscribing to push:", error);
        toast.error("Failed to enable push notifications");
      }
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        toast.success("Profile saved successfully!");
        fetchUser();
      } else {
        toast.error("Failed to save profile");
      }
    } catch {
      toast.error("Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);

    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationPrefs),
      });

      if (res.ok) {
        toast.success("Notification preferences saved!");
        fetchUser();
      } else {
        toast.error("Failed to save preferences");
      }
    } catch {
      toast.error("Error saving preferences");
    } finally {
      setSaving(false);
    }
  };

  const sendTestEmail = async (type: "reminder" | "stock") => {
    if (!profile.email) {
      toast.error("Please save an email address in your profile first.");
      return;
    }
    setTestEmailStatus((s) => ({ ...s, [type]: "sending" }));
    try {
      const res = await fetch("/api/test/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestEmailStatus((s) => ({ ...s, [type]: "success" }));
        toast.success(`Test email sent to ${data.sentTo}`);
      } else {
        setTestEmailStatus((s) => ({ ...s, [type]: "error" }));
        toast.error(data.error || "Failed to send test email");
      }
    } catch {
      setTestEmailStatus((s) => ({ ...s, [type]: "error" }));
      toast.error("Something went wrong");
    }
    setTimeout(() => setTestEmailStatus((s) => ({ ...s, [type]: "idle" })), 4000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Mobile Number</p>
            <p className="font-medium text-gray-900">+91 {user?.mobile}</p>
          </div>

          <Input
            label="Name"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            placeholder="Your name"
          />

          <Input
            label="Email"
            type="email"
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            placeholder="your@email.com"
          />

          <Button onClick={handleSaveProfile} loading={saving}>
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Push Notifications */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">Push Notifications</span>
            </div>

            {!pushSupported ? (
              <p className="text-sm text-gray-500">
                Push notifications are not supported in this browser.
              </p>
            ) : pushPermission === "denied" ? (
              <p className="text-sm text-red-600">
                Push notifications are blocked. Please enable them in your browser
                settings.
              </p>
            ) : pushPermission !== "granted" ? (
              <Button size="sm" onClick={requestPushPermission}>
                Enable Push Notifications
              </Button>
            ) : (
              <div className="space-y-2 pl-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.pushEnabled}
                    onChange={(e) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        pushEnabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    Enable push notifications
                  </span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.pushForReminders}
                    onChange={(e) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        pushForReminders: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Medicine reminders</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={notificationPrefs.pushForStockAlerts}
                    onChange={(e) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        pushForStockAlerts: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">Low stock alerts</span>
                </label>
              </div>
            )}
          </div>

          {/* Email Notifications */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">Email Notifications</span>
            </div>

            <div className="space-y-2 pl-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notificationPrefs.emailEnabled}
                  onChange={(e) =>
                    setNotificationPrefs({
                      ...notificationPrefs,
                      emailEnabled: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Enable email notifications
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notificationPrefs.emailForReminders}
                  onChange={(e) =>
                    setNotificationPrefs({
                      ...notificationPrefs,
                      emailForReminders: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Medicine reminders</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={notificationPrefs.emailForStockAlerts}
                  onChange={(e) =>
                    setNotificationPrefs({
                      ...notificationPrefs,
                      emailForStockAlerts: e.target.checked,
                    })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Low stock alerts</span>
              </label>
            </div>
          </div>

          {/* Test Email */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">Test Email Alerts</span>
            </div>
            <p className="text-xs text-gray-500 pl-6">
              Send a test email to <strong>{profile.email || "your email (not set)"}</strong> to verify alerts are working.
            </p>
            <div className="flex gap-3 pl-6 flex-wrap">
              {/* Test Reminder */}
              <button
                type="button"
                onClick={() => sendTestEmail("reminder")}
                disabled={testEmailStatus.reminder === "sending"}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-all ${
                  testEmailStatus.reminder === "success"
                    ? "bg-green-50 border-green-300 text-green-700"
                    : testEmailStatus.reminder === "error"
                    ? "bg-red-50 border-red-300 text-red-700"
                    : "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                }`}
              >
                {testEmailStatus.reminder === "sending" ? (
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                ) : testEmailStatus.reminder === "success" ? (
                  <CheckCircle className="w-4 h-4" />
                ) : testEmailStatus.reminder === "error" ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                {testEmailStatus.reminder === "sending" ? "Sending..." :
                 testEmailStatus.reminder === "success" ? "Email Sent!" :
                 testEmailStatus.reminder === "error" ? "Failed" :
                 "Test Reminder Email"}
              </button>

              {/* Test Stock Alert */}
              <button
                type="button"
                onClick={() => sendTestEmail("stock")}
                disabled={testEmailStatus.stock === "sending"}
                className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-all ${
                  testEmailStatus.stock === "success"
                    ? "bg-green-50 border-green-300 text-green-700"
                    : testEmailStatus.stock === "error"
                    ? "bg-red-50 border-red-300 text-red-700"
                    : "bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                }`}
              >
                {testEmailStatus.stock === "sending" ? (
                  <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                ) : testEmailStatus.stock === "success" ? (
                  <CheckCircle className="w-4 h-4" />
                ) : testEmailStatus.stock === "error" ? (
                  <XCircle className="w-4 h-4" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                {testEmailStatus.stock === "sending" ? "Sending..." :
                 testEmailStatus.stock === "success" ? "Email Sent!" :
                 testEmailStatus.stock === "error" ? "Failed" :
                 "Test Stock Alert Email"}
              </button>
            </div>
          </div>

          {/* Sound */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">Sound</span>
            </div>

            <label className="flex items-center gap-2 pl-6">
              <input
                type="checkbox"
                checked={notificationPrefs.soundEnabled}
                onChange={(e) =>
                  setNotificationPrefs({
                    ...notificationPrefs,
                    soundEnabled: e.target.checked,
                  })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                Play sound for reminders
              </span>
            </label>

            <div className="flex gap-2 pl-6 mt-2">
              <button
                type="button"
                onClick={() => playNotificationSound()}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Play className="w-3 h-3" />
                Test Reminder
              </button>
              <button
                type="button"
                onClick={() => playAlertSound()}
                className="flex items-center gap-1 px-3 py-1.5 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
              >
                <Play className="w-3 h-3" />
                Test Alert
              </button>
            </div>
          </div>

          <Button onClick={handleSaveNotifications} loading={saving}>
            Save Notification Preferences
          </Button>
        </CardContent>
      </Card>

      {/* App Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            About
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              <strong>MedCare</strong> - Medicine Stock Management
            </p>
            <p>Version 1.0.0</p>
            <p>Built with Next.js</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
