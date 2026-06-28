/* YK Coaching — push service worker */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "YK Coaching", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "YK Coaching";
  const options = {
    body: data.body || "",
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    data: { url: data.link || "/panel" },
    vibrate: [80, 40, 80],
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/panel";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes(url) && "focus" in c) return c.focus();
      }
      return self.clients.openWindow(url);
    }),
  );
});
