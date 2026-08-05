"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../convex/_generated/api";

const IDLE_LIMIT_MS = 6 * 60 * 1000;
const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;

// Signs an inactive session out after 6 minutes with no interaction, rather
// than relying on the user remembering to log out or closing the tab —
// protects against someone walking away from an unlocked, unattended
// session on a shared HR workstation.
export function useIdleLogout(enabled: boolean) {
  const { signOut } = useAuthActions();
  const recordLogout = useMutation(api.users.recordLogout);
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleIdleLogout = async () => {
      sessionStorage.removeItem("ict_pin_unlocked");
      await recordLogout({}).catch(() => {});
      await signOut();
      router.push("/login");
    };

    const resetTimer = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(handleIdleLogout, IDLE_LIMIT_MS);
    };

    resetTimer();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer));

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);
}
