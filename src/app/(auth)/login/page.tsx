"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OTPInput } from "@/components/auth/OTPInput";
import Link from "next/link";
import Image from "next/image";

type AuthMode = "phone" | "email";
type PhoneStep = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();

  // Mode
  const [mode, setMode] = useState<AuthMode>("phone");

  // Phone OTP flow
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("phone");
  const [mobile, setMobile] = useState("");

  // Email flow
  const [isRegistering, setIsRegistering] = useState(false);
  const [emailForm, setEmailForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
  });

  // Shared
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ---- Phone OTP handlers ----
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json();
      if (data.success) {
        setPhoneStep("otp");
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile, otp }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.message || "Invalid OTP");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---- Email Sign In handler ----
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailForm),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Invalid email or password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---- Register handler ----
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerForm),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setError(data.error || "Registration failed");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError("");
    setPhoneStep("phone");
    setIsRegistering(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-3">
            <Image src="/icons/medcare-logo.svg" alt="MedCare" width={64} height={64} className="rounded-2xl shadow-md" priority />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">MedCare</h1>
          <p className="text-gray-600 mt-2">Your personal medicine management assistant</p>
        </div>

        {/* Tab Bar */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            onClick={() => switchMode("phone")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === "phone"
                ? "bg-white shadow text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Phone OTP
          </button>
          <button
            onClick={() => switchMode("email")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${
              mode === "email"
                ? "bg-white shadow text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Email
          </button>
        </div>

        {/* Phone OTP Flow */}
        {mode === "phone" && (
          <>
            {phoneStep === "phone" ? (
              <form onSubmit={handleSendOTP} className="space-y-6">
                <Input
                  label="Mobile Number"
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  disabled={loading}
                  maxLength={10}
                />
                <Button type="submit" loading={loading} disabled={mobile.length !== 10} className="w-full">
                  Send OTP
                </Button>
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Demo OTP: <code className="bg-gray-100 px-2 py-1 rounded font-mono">123456</code>
                  </p>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <p className="text-center text-gray-600">
                  Enter the OTP sent to <strong>+91 {mobile}</strong>
                </p>
                <OTPInput length={6} onComplete={handleVerifyOTP} disabled={loading} />
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => setPhoneStep("phone")}
                    className="text-sm text-blue-600 hover:underline text-center"
                  >
                    Change phone number
                  </button>
                  <Button
                    variant="ghost"
                    onClick={() => handleVerifyOTP("123456")}
                    loading={loading}
                    className="w-full"
                  >
                    Use Demo OTP (123456)
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Email Flow */}
        {mode === "email" && (
          <>
            {!isRegistering ? (
              /* Sign In */
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  placeholder="your@email.com"
                  value={emailForm.email}
                  onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                  disabled={loading}
                  required
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="Enter your password"
                  value={emailForm.password}
                  onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                  disabled={loading}
                  required
                />
                <Button type="submit" loading={loading} className="w-full">
                  Sign In
                </Button>
                <div className="text-center space-y-2">
                  <Link
                    href="/forgot-password"
                    className="block text-sm text-blue-600 hover:underline"
                  >
                    Forgot password?
                  </Link>
                  <button
                    type="button"
                    onClick={() => { setIsRegistering(true); setError(""); }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Don&apos;t have an account?{" "}
                    <span className="text-blue-600 font-medium">Register</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Register */
              <form onSubmit={handleRegister} className="space-y-4">
                <Input
                  label="Full Name *"
                  type="text"
                  placeholder="Your name"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                  disabled={loading}
                  required
                />
                <Input
                  label="Email *"
                  type="email"
                  placeholder="your@email.com"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  disabled={loading}
                  required
                />
                <Input
                  label="Password * (min 8 characters)"
                  type="password"
                  placeholder="Create a password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  disabled={loading}
                  required
                />
                <Input
                  label="Mobile Number (optional)"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={registerForm.mobile}
                  onChange={(e) =>
                    setRegisterForm({
                      ...registerForm,
                      mobile: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                  disabled={loading}
                  maxLength={10}
                />
                <Button type="submit" loading={loading} className="w-full">
                  Create Account
                </Button>
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setIsRegistering(false); setError(""); }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Already have an account?{" "}
                    <span className="text-blue-600 font-medium">Sign in</span>
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* Error */}
        {error && <p className="mt-4 text-sm text-red-600 text-center">{error}</p>}
      </div>
    </div>
  );
}
