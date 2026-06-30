"use client";

import { Download } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-lg"
    >
      <Download className="h-4 w-4" /> PDF / Yazdır
    </button>
  );
}
