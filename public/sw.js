const CACHE_NAME = "medcare-v2";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(clients.claim()));

// ── Push event ────────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const isMedicineReminder = data.data?.type === "MEDICINE_REMINDER";

  const options = {
    body: data.body,
    icon: "/icons/medcare-logo.svg",
    badge: "/icons/badge-72x72.svg",
    // Alarm-style vibration for medicine reminders: long-short repeated
    vibrate: isMedicineReminder
      ? [800, 300, 800, 300, 800, 300, 800]
      : [300, 100, 300],
    data: data.data,
    actions: data.actions || [],
    requireInteraction: true,   // stays on screen — user must act
    renotify: true,             // re-vibrate even if same tag shown before
    tag: data.data?.patientMedicineId || data.data?.type || "medcare",
    silent: false,
    timestamp: Date.now(),
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options).then(() => {
      // Tell any open app window to show in-app alarm modal
      if (isMedicineReminder) {
        return clients.matchAll({ type: "window" }).then((windowClients) => {
          windowClients.forEach((client) =>
            client.postMessage({ type: "MEDICINE_ALARM", payload: data })
          );
        });
      }
    })
  );
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data;

  if (action === "take") {
    // Tell the open window to mark dose as taken
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((windowClients) => {
        if (windowClients.length > 0) {
          windowClients[0].postMessage({ type: "QUICK_TAKE", payload: notificationData });
          return windowClients[0].focus();
        }
        return clients.openWindow(`/dashboard?take=${notificationData?.patientMedicineId}`);
      })
    );
  } else if (action === "snooze") {
    // Re-ring in exactly 10 minutes
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          self.registration.showNotification(
            `⏰ Snooze over: ${event.notification.title}`,
            {
              body: event.notification.body,
              icon: "/icons/medcare-logo.svg",
              badge: "/icons/badge-72x72.svg",
              vibrate: [800, 300, 800, 300, 800, 300, 800],
              data: notificationData,
              actions: event.notification.actions,
              requireInteraction: true,
              renotify: true,
              tag: notificationData?.patientMedicineId || "snooze",
            }
          );
          resolve();
        }, 10 * 60 * 1000); // 10 minutes
      })
    );
  } else {
    // Default: focus or open app
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((windowClients) => {
        const url = notificationData?.url || "/dashboard";
        for (const client of windowClients) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        return clients.openWindow(url);
      })
    );
  }
});
