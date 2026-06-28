"use client";

import { useEffect } from "react";
import { markAllNotificationsRead } from "./actions";

/** Sayfa açılınca tüm bildirimleri okundu işaretler. */
export function MarkRead() {
  useEffect(() => {
    markAllNotificationsRead();
  }, []);
  return null;
}
