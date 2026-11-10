"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { Lock, CheckCircle2 } from "lucide-react";
import { AuthShell } from "@/components/auth/AuthShell";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (data.success) {
        setDone(true);
        setTimeout(() => router.push("/login"), 2500);
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-rose-600">Invalid reset link. Please request a new one.</p>
        <Link href="/forgot-password" className="font-semibold text-brand-600 hover:text-brand-700 text-sm">
          Request new reset link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-800">
          <CheckCircle2 className="h-10 w-10 animate-pop text-emerald-500" />
          Password reset successfully! Redirecting to login...
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="New Password (min 8 characters)"
        type="password"
        autoComplete="new-password"
        icon={<Lock className="h-4 w-4" />}
        placeholder="Enter new password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        required
      />
      <Input
        label="Confirm Password"
        type="password"
        autoComplete="new-password"
        icon={<Lock className="h-4 w-4" />}
        placeholder="Confirm new password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={loading}
        required
      />
      <Button type="submit" size="lg" loading={loading} className="w-full">
        Reset Password
      </Button>
      {error && <p className="text-sm text-rose-600 text-center">{error}</p>}
      <div className="text-center">
        <Link href="/login" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
          Back to Login
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Reset password" subtitle="Choose a new password for your account.">
      <Suspense fallback={<div className="text-center text-slate-500">Loading…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
