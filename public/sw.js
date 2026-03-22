const CACHE_NAME = "medcare-v1";

// Install event
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.body,
    icon: data.icon || "/icons/icon-192x192.svg",
    badge: data.badge || "/icons/badge-72x72.svg",
    vibrate: [100, 50, 100],
    data: data.data,
    actions: data.actions || [],
    requireInteraction: true,
    tag: data.data?.type || "default",
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data;

  if (action === "take") {
    // Handle "Mark as Taken" action
    event.waitUntil(
      fetch("/api/intake/quick-take", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(notificationData),
      })
    );
  } else if (action === "snooze") {
    // Show notification again in 10 minutes
    event.waitUntil(
      new Promise((resolve) => {
        setTimeout(() => {
          self.registration.showNotification(event.notification.title, {
            body: event.notification.body + " (Snoozed)",
            icon: event.notification.icon,
            badge: event.notification.badge,
            data: notificationData,
            actions: event.notification.actions,
            requireInteraction: true,
          });
          resolve();
        }, 10 * 60 * 1000); // 10 minutes
      })
    );
  } else {
    // Default: open the app
    event.waitUntil(
      clients.matchAll({ type: "window" }).then((windowClients) => {
        const url = notificationData?.url || "/dashboard";

        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});
