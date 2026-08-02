"use client";

import { useServerStatus } from "@/hooks/useServerStatus";
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";

export function ServerStatusIndicator() {
  const status = useServerStatus();
  const [showOnline, setShowOnline] = useState(true);

  // auto-hide badge "online" setelah beberapa detik biar gak ganggu
  useEffect(() => {
    if (status === "online") {
      const t = setTimeout(() => setShowOnline(false), 4000);
      return () => clearTimeout(t);
    }
    setShowOnline(true);
  }, [status]);

  if (status === "online" && !showOnline) return null;

  const config = {
    checking: {
      icon: <Loader2 className="w-4 h-4 animate-spin text-white" />,
      text: "Menghubungkan ke server...",
      classes: "bg-black border-white/20 text-white",
    },
    online: {
      icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
      text: "Terhubung ke server",
      classes: "bg-black border-white/20 text-white",
    },
    error: {
      icon: <AlertCircle className="w-4 h-4 text-red-500" />,
      text: "Server bermasalah atau tidak ada koneksi",
      classes: "bg-black border-white/20 text-white",
    },
  }[status];

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full border shadow-lg text-sm font-medium transition-all duration-300 ${config.classes}`}
    >
      {config.icon}
      <span>{config.text}</span>
      {status === "error" && (
        <button
          onClick={() => window.location.reload()}
          className="ml-1 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Refresh
        </button>
      )}
    </div>
  );
}