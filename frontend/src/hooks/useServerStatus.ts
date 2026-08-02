"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";

export type ServerStatus = "checking" | "online" | "error";

const RETRY_INTERVAL_MS = 3000;
const REQUEST_TIMEOUT_MS = 2500;

export function useServerStatus() {
  const [status, setStatus] = useState<ServerStatus>("checking");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkServer = async () => {
      try {
        await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/`, {
          timeout: REQUEST_TIMEOUT_MS,
        });
        if (!isMounted) return;
        setStatus("online");
      } catch {
        if (!isMounted) return;
        setStatus("error");
      }
    };

    checkServer(); // cek pertama kali
    intervalRef.current = setInterval(checkServer, RETRY_INTERVAL_MS);

    return () => {
      isMounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return status;
}