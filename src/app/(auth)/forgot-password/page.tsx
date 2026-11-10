"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, MailCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AuthShell } from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={sent ? "Check your inbox" : "Forgot password?"}
      subtitle={sent ? undefined : "Enter your email and we'll send you a reset link."}
    >
      {sent ? (
        <div className="animate-fade-up space-y-6">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center text-sm text-emerald-800">
            <span className="flex h-12 w-12 animate-pop items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/30">
              <MailCheck className="h-6 w-6" />
            </span>
            If an account with that email exists, a password reset link has been sent. Please check your inbox (and spam
            folder).
          </div>
          <Link href="/login" className="block">
            <Button variant="secondary" className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            icon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
          />
          <Button type="submit" size="lg" loading={loading} disabled={!email} className="w-full">
            Send Reset Link
          </Button>
          {error && (
            <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <div className="text-center">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
              <ArrowLeft className="h-4 w-4" />
              Back to Login
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
