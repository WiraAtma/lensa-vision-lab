"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

type CounterStatus = "idle" | "counting" | "success" | "error" | "timeout";

interface CounterPredictProps {
  isLoading: boolean;
  isError?: boolean;
  maxSeconds?: number;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  timeoutMessage?: string;
  onTimeout?: () => void;
}

export const CounterPredict = ({
  isLoading,
  isError = false,
  maxSeconds = 30,
  loadingMessage = "Almost ready ...",
  successMessage = "Prediction ready",
  errorMessage = "Something went wrong on the server",
  timeoutMessage = "Taking too long, something went wrong on the server",
  onTimeout,
}: CounterPredictProps) => {
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<CounterStatus>("idle");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const hasTimedOutRef = useRef(false);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (isLoading) {
      // mulai siklus hitung baru
      hasTimedOutRef.current = false;
      startTimeRef.current = performance.now();
      setElapsed(0);
      setStatus("counting");

      intervalRef.current = setInterval(() => {
        const secondsPassed = (performance.now() - startTimeRef.current) / 1000;

        if (secondsPassed >= maxSeconds && !hasTimedOutRef.current) {
          hasTimedOutRef.current = true;
          setElapsed(maxSeconds);
          setStatus("timeout");
          clearTimer();
          onTimeout?.();
          return;
        }

        setElapsed(secondsPassed);
      }, 50); // update tiap 50ms biar mulus & presisi
    } else {
      clearTimer();

      // kunci angka final di titik selesai (biar gak lanjut naik)
      if (!hasTimedOutRef.current) {
        setElapsed((performance.now() - startTimeRef.current) / 1000);
      }

      setStatus((prev) => {
        if (prev === "counting") {
          return isError ? "error" : "success";
        }
        return prev;
      });
    }

    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  if (status === "idle") return null;

  const stylesByStatus: Record<
    Exclude<CounterStatus, "idle">,
    { container: string; text: string; icon: React.ReactNode }
  > = {
    counting: {
      container: "border-amber-300 bg-amber-50",
      text: "text-amber-900",
      icon: <Loader2 className="h-5 w-5 animate-spin text-amber-600" />,
    },
    success: {
      container: "border-green-300 bg-green-50",
      text: "text-green-900",
      icon: <CheckCircle2 className="h-5 w-5 text-green-600" />,
    },
    error: {
      container: "border-red-300 bg-red-50",
      text: "text-red-900",
      icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
    },
    timeout: {
      container: "border-red-300 bg-red-50",
      text: "text-red-900",
      icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
    },
  };

  const messageByStatus: Record<Exclude<CounterStatus, "idle">, string> = {
    counting: loadingMessage,
    success: successMessage,
    error: errorMessage,
    timeout: timeoutMessage,
  };

  const style = stylesByStatus[status];

  return (
    <div className={`w-full my-5 rounded-lg border p-4 transition-colors ${style.container}`}>
      <div className="flex items-center gap-3">
        {style.icon}
        <h1 className="font-bold text-xl">{elapsed.toFixed(2)}s</h1>
        <p className={`text-sm ${style.text}`}>{messageByStatus[status]}</p>
      </div>
    </div>
  );
};