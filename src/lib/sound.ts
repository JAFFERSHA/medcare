// Sound notification utility using Web Audio API

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

// Play a pleasant notification chime
export function playNotificationSound(): void {
  if (typeof window === "undefined") return;

  try {
    const ctx = getAudioContext();

    // Resume context if it was suspended (browser autoplay policy)
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Create a pleasant two-tone chime
    const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5 (C major chord)

    frequencies.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(freq, now);

      // Envelope
      const startTime = now + index * 0.1;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.6);
    });
  } catch (error) {
    console.error("Error playing notification sound:", error);
  }
}

// Play an alert/alarm sound (more urgent)
export function playAlertSound(): void {
  if (typeof window === "undefined") return;

  try {
    const ctx = getAudioContext();

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;

    // Create an urgent two-tone alert
    for (let i = 0; i < 3; i++) {
      const frequencies = [880, 660]; // A5, E5

      frequencies.forEach((freq, index) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(freq, now);

        const startTime = now + i * 0.4 + index * 0.15;
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.02);
        gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, startTime + 0.15);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.2);
      });
    }
  } catch (error) {
    console.error("Error playing alert sound:", error);
  }
}

// Check if sound is enabled and play
export async function playNotificationIfEnabled(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    // Check user preference from API
    const res = await fetch("/api/notifications/preferences");
    if (!res.ok) return;

    const prefs = await res.json();
    if (prefs?.soundEnabled) {
      playNotificationSound();
    }
  } catch (error) {
    console.error("Error checking sound preference:", error);
  }
}
