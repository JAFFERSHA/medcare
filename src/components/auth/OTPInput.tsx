"use client";

import { useRef, useState, useEffect, KeyboardEvent, ClipboardEvent } from "react";
import { cn } from "@/lib/utils";

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  disabled?: boolean;
}

export function OTPInput({ length = 6, onComplete, disabled = false }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (disabled) return;

    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, "");
    if (!numericValue && value !== "") return;

    const newOtp = [...otp];
    newOtp[index] = numericValue.slice(-1);
    setOtp(newOtp);

    // Move to next input
    if (numericValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    const otpString = newOtp.join("");
    if (otpString.length === length && !newOtp.includes("")) {
      onComplete(otpString);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/[^0-9]/g, "");
    const newOtp = [...otp];

    for (let i = 0; i < Math.min(pastedData.length, length); i++) {
      newOtp[i] = pastedData[i];
    }

    setOtp(newOtp);

    // Focus on the next empty input or last input
    const nextEmptyIndex = newOtp.findIndex((val) => !val);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[length - 1]?.focus();
      const otpString = newOtp.join("");
      if (otpString.length === length) {
        onComplete(otpString);
      }
    }
  };

  return (
    <div className="flex justify-center gap-2 [perspective:600px] sm:gap-2.5">
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          autoComplete={index === 0 ? "one-time-code" : "off"}
          className={cn(
            "h-14 w-11 rounded-xl border text-center text-2xl font-bold text-slate-900 shadow-sm sm:w-12",
            "transition-all duration-200 focus:outline-none",
            "focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15 focus:[transform:translateY(-3px)_rotateX(12deg)]",
            digit && "border-brand-300 bg-brand-50",
            disabled ? "bg-slate-100 text-slate-400" : !digit && "border-slate-200 bg-white"
          )}
        />
      ))}
    </div>
  );
}
