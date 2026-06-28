"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { savePushSubscription } from "@/app/panel/push-actions";
import { Card } from "@/components/ui";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function PushToggle() {
  const [supported, setSupported] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window;
    setSupported(ok);
    if (ok) {
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => setEnabled(!!sub))
        .catch(() => {});
    }
  }, []);

  async function enable() {
    setBusy(true);
    setMsg(null);
    try {
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) throw new Error("VAPID anahtarı tanımlı değil.");

      const reg = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Bildirim izni verilmedi.");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
      const json = sub.toJSON() as {
        endpoint: string;
        keys: { p256dh: string; auth: string };
      };
      const res = await savePushSubscription({
        endpoint: json.endpoint,
        keys: json.keys,
      });
      if (res?.error) throw new Error(res.error);
      setEnabled(true);
      setMsg("Bildirimler açıldı ✓");
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!supported) return null;

  return (
    <Card className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--primary)]/12 text-[var(--primary-glow)]">
          {enabled ? (
            <Bell className="h-5 w-5" />
          ) : (
            <BellOff className="h-5 w-5" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">Telefon Bildirimleri</p>
          <p className="text-xs text-[var(--muted)]">
            {msg ?? (enabled ? "Açık" : "Yeni program/mesaj için aç")}
          </p>
        </div>
      </div>
      {!enabled && (
        <button
          onClick={enable}
          disabled={busy}
          className="rounded-xl brand-gradient px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Aç"}
        </button>
      )}
    </Card>
  );
}
