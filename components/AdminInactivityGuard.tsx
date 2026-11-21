"use client";

import { useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

// 60 minutes in milliseconds
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;
// Check interval every 15 seconds
const CHECK_INTERVAL_MS = 15 * 1000;

export default function AdminInactivityGuard() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const lastActivityRef = useRef<number>(Date.now());
  const isLoggingOutRef = useRef<boolean>(false);

  useEffect(() => {
    // Record user activity timestamp
    const recordActivity = () => {
      lastActivityRef.current = Date.now();
    };

    // Passive interaction listeners
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(event, recordActivity, { passive: true });
    });

    // Periodic check interval
    const intervalId = window.setInterval(async () => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;

      if (elapsed >= INACTIVITY_TIMEOUT_MS && !isLoggingOutRef.current) {
        isLoggingOutRef.current = true;
        try {
          await supabase.auth.signOut();
        } catch {
          // Proceed with redirect regardless of signOut error
        }
        router.push("/admin/login?reason=inactivity");
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, recordActivity);
      });
      window.clearInterval(intervalId);
    };
  }, [router, supabase]);

  return null;
}
