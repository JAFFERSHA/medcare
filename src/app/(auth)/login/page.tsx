"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Smartphone, Mail, Lock, User, Eye, EyeOff, AlertCircle, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OTPInput } from "@/components/auth/OTPInput";
import { AuthShell } from "@/components/auth/AuthShell";
import { cn } from "@/lib/utils";

type AuthMode = "phone" | "email";
type PhoneStep = "phone" | "otp";

function PasswordToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? "Hide password" : "Show password"}
      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
    >
      {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}

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
  });
  const [showPassword, setShowPassword] = useState(false);

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

  const title =
    mode === "phone"
      ? phoneStep === "otp"
        ? "Enter your code"
        : "Welcome back"
      : isRegistering
        ? "Create your account"
        : "Welcome back";
  const subtitle =
    mode === "phone" && phoneStep === "otp"
      ? `We sent a 6-digit code to +91 ${mobile}`
      : isRegistering && mode === "email"
        ? "It takes less than a minute."
        : "Sign in to manage your medicines.";

  return (
    <AuthShell title={title} subtitle={subtitle}>
      {/* Segmented control */}
      <div role="tablist" aria-label="Sign-in method" className="relative mb-6 grid grid-cols-2 rounded-2xl bg-slate-100 p-1">
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-xl bg-white shadow-[0_4px_12px_-4px_rgb(15_23_42/0.25)]",
            "transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
            mode === "email" && "translate-x-full"
          )}
        />
        {(
          [
            ["phone", "Phone OTP", Smartphone],
            ["email", "Email", Mail],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            role="tab"
            aria-selected={mode === value}
            onClick={() => switchMode(value)}
            className={cn(
              "relative z-10 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-colors",
              mode === value ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Phone OTP Flow */}
      {mode === "phone" && (
        <div key={phoneStep} className="animate-fade-up">
          {phoneStep === "phone" ? (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <label htmlFor="mobile" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Mobile number
                </label>
                <div className="flex overflow-hidden rounded-xl border border-slate-200 bg-white/85 shadow-sm transition-all focus-within:border-brand-400 focus-within:ring-4 focus-within:ring-brand-500/15">
                  <span className="flex items-center gap-1.5 border-r border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-600">
                    +91
                  </span>
                  <input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    placeholder="10-digit mobile number"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    disabled={loading}
                    maxLength={10}
                    className="w-full bg-transparent px-3 py-3 text-base tracking-wide text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>
              <Button type="submit" size="lg" loading={loading} disabled={mobile.length !== 10} className="w-full">
                Send OTP
              </Button>
              <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                We never share your number.
              </p>
            </form>
          ) : (
            <div className="space-y-6">
              <OTPInput length={6} onComplete={handleVerifyOTP} disabled={loading} />
              {loading && <p className="text-center text-sm text-slate-500">Verifying…</p>}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPhoneStep("phone")}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Change phone number
                </button>
                <p className="text-center text-xs text-slate-500">
                  A wrong code cancels it. Tap &ldquo;Change phone number&rdquo; and send a new OTP.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Email Flow */}
      {mode === "email" && (
        <div key={isRegistering ? "reg" : "signin"} className="animate-fade-up">
          {!isRegistering ? (
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                icon={<Mail className="h-4 w-4" />}
                value={emailForm.email}
                onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
                disabled={loading}
                required
              />
              <div>
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  icon={<Lock className="h-4 w-4" />}
                  trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((s) => !s)} />}
                  value={emailForm.password}
                  onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
                  disabled={loading}
                  required
                />
                <div className="mt-2 text-right">
                  <Link href="/forgot-password" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                    Forgot password?
                  </Link>
                </div>
              </div>
              <Button type="submit" size="lg" loading={loading} className="w-full">
                Sign In
              </Button>
              <p className="pt-1 text-center text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(true);
                    setError("");
                  }}
                  className="font-semibold text-brand-600 hover:text-brand-700"
                >
                  Register
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <Input
                label="Full name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                icon={<User className="h-4 w-4" />}
                value={registerForm.name}
                onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                disabled={loading}
                required
              />
              <Input
                label="Email"
                type="email"
                autoComplete="email"
                placeholder="you@email.com"
                icon={<Mail className="h-4 w-4" />}
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                disabled={loading}
                required
              />
              <Input
                label="Password (min 8 characters)"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Create a password"
                icon={<Lock className="h-4 w-4" />}
                trailing={<PasswordToggle shown={showPassword} onToggle={() => setShowPassword((s) => !s)} />}
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                disabled={loading}
                required
              />
              {registerForm.password.length > 0 && (
                <div className="flex items-center gap-2" aria-live="polite">
                  {[0, 1, 2].map((i) => {
                    const strength =
                      (registerForm.password.length >= 8 ? 1 : 0) +
                      (/[A-Z]/.test(registerForm.password) && /[a-z]/.test(registerForm.password) ? 1 : 0) +
                      (/\d|[^A-Za-z0-9]/.test(registerForm.password) ? 1 : 0);
                    return (
                      <span
                        key={i}
                        className={cn(
                          "h-1.5 flex-1 rounded-full transition-colors",
                          i < strength ? ["bg-rose-400", "bg-amber-400", "bg-emerald-500"][strength - 1] : "bg-slate-200"
                        )}
                      />
                    );
                  })}
                </div>
              )}
              <Button type="submit" size="lg" loading={loading} className="w-full">
                Create Account
              </Button>
              <p className="text-center text-xs text-slate-500">
                You can add and verify your mobile number later in Settings.
              </p>
              <p className="text-center text-sm text-slate-500">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setError("");
                  }}
                  className="font-semibold text-brand-600 hover:text-brand-700"
                >
                  Sign in
                </button>
              </p>
            </form>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div role="alert" className="mt-5 flex animate-fade-up items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </AuthShell>
  );
}
