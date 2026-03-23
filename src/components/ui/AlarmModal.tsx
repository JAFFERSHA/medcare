"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, Clock } from "lucide-react";

interface AlarmData {
  title: string;
  body: string;
  data?: {
    patientMedicineId?: string;
    medicineName?: string;
    dose?: string;
    time?: string;
  };
}

export function AlarmModal() {
  const [alarm, setAlarm] = useState<AlarmData | null>(null);
  const [snoozed, setSnoozed] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Listen for MEDICINE_ALARM messages from the service worker
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "MEDICINE_ALARM") {
        setAlarm(event.data.payload);
        setSnoozed(false);
      }
    };
    navigator.serviceWorker?.addEventListener("message", handler);
    return () => navigator.serviceWorker?.removeEventListener("message", handler);
  }, []);

  // Play repeating alarm sound while modal is open
  useEffect(() => {
    if (!alarm || snoozed) {
      stopAlarm();
      return;
    }
    playAlarmLoop();
    return () => stopAlarm();
  }, [alarm, snoozed]);

  const playAlarmLoop = () => {
    playBeep();
    intervalRef.current = setInterval(playBeep, 3000);
  };

  const stopAlarm = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  };

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      audioCtxRef.current = ctx;

      const frequencies = [880, 1100, 880, 1100];
      let startTime = ctx.currentTime;

      frequencies.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.4, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
        startTime += 0.35;
      });
    } catch {
      // Audio not available
    }
  };

  const handleTake = async () => {
    if (alarm?.data?.patientMedicineId) {
      await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientMedicineId: alarm.data.patientMedicineId,
          status: "TAKEN",
          scheduledTime: new Date().toISOString(),
        }),
      });
    }
    stopAlarm();
    setAlarm(null);
  };

  const handleSnooze = () => {
    setSnoozed(true);
    stopAlarm();
    // Re-show alarm after 10 minutes
    setTimeout(() => {
      setSnoozed(false);
      setAlarm((prev) => prev); // re-trigger
    }, 10 * 60 * 1000);
    setAlarm(null);
  };

  const handleDismiss = () => {
    stopAlarm();
    setAlarm(null);
  };

  if (!alarm) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Pulsing top bar */}
        <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 animate-pulse" />

        <div className="p-6 text-center space-y-5">
          {/* Bell icon — pulsing */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center animate-bounce">
              <Bell className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          {/* Medicine info */}
          <div>
            <p className="text-xs font-medium text-blue-600 uppercase tracking-wider mb-1">
              Medicine Reminder
            </p>
            <h2 className="text-xl font-bold text-gray-900">
              {alarm.data?.medicineName || alarm.title}
            </h2>
            <p className="text-gray-600 mt-1">{alarm.body}</p>
            {alarm.data?.time && (
              <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 bg-blue-50 rounded-full text-xs text-blue-700">
                <Clock className="w-3 h-3" />
                Scheduled at {alarm.data.time}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleTake}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-200"
            >
              <Check className="w-5 h-5" />
              Mark as Taken
            </button>

            <div className="flex gap-2">
              <button
                onClick={handleSnooze}
                className="flex-1 py-2.5 bg-orange-50 text-orange-700 font-medium rounded-xl border border-orange-200 hover:bg-orange-100 transition-colors text-sm"
              >
                ⏰ Snooze 10 min
              </button>
              <button
                onClick={handleDismiss}
                className="flex-1 py-2.5 bg-gray-50 text-gray-600 font-medium rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors text-sm"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
