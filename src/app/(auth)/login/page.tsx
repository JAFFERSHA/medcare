"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { OTPInput } from "@/components/auth/OTPInput";
import { Pill } from "lucide-react";

type Step = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        setStep("otp");
      } else {
        setError(data.message);
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
        setError(data.message);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <Pill className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">MedCare</h1>
          <p className="text-gray-600 mt-2">Your personal medicine management assistant</p>
        </div>

        {step === "phone" ? (
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
                onClick={() => setStep("phone")}
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

        {error && <p className="mt-4 text-sm text-red-600 text-center">{error}</p>}
      </div>
    </div>
  );
}
