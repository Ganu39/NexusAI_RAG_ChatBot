"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

export function PageTransitionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const [isExiting, setIsExiting] = useState(false);
  const exitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // When pathname changes (new route mounted), reset exit state
  useEffect(() => {
    setIsExiting(false);
  }, [pathname]);

  // Clean up pending navigation timeouts on unmount
  useEffect(() => {
    return () => {
      if (exitTimeoutRef.current) {
        clearTimeout(exitTimeoutRef.current);
      }
    };
  }, []);

  // Intercept client-side navigation clicks to orchestrate exit before route change
  useEffect(() => {
    if (shouldReduceMotion) return;

    const handleAnchorClick = (e: MouseEvent) => {
      // Ignore modified clicks (cmd, ctrl, shift, right-click) or already prevented events
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        e.shiftKey
      ) {
        return;
      }

      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignore external, anchor links, mailto, tel, downloads, or blank targets
      if (
        href.startsWith("http") ||
        href.startsWith("//") ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        anchor.target === "_blank" ||
        anchor.hasAttribute("download")
      ) {
        return;
      }

      try {
        const targetUrl = new URL(href, window.location.origin);
        if (targetUrl.origin !== window.location.origin) return;

        // Same route does not need transition
        if (
          targetUrl.pathname === window.location.pathname &&
          targetUrl.search === window.location.search
        ) {
          return;
        }

        // Avoid multiple concurrent exit triggers
        if (isExiting) {
          e.preventDefault();
          return;
        }

        // Intercept navigation to play exit animation first
        e.preventDefault();
        setIsExiting(true);

        // Landing page exception: navigating to landing page is rapid (150ms),
        // whereas navigating between internal app routes uses the full ~380ms exit
        const isGoingToLanding = targetUrl.pathname === "/";
        const exitDuration = isGoingToLanding ? 150 : 380;

        if (exitTimeoutRef.current) {
          clearTimeout(exitTimeoutRef.current);
        }

        exitTimeoutRef.current = setTimeout(() => {
          router.push(href);
        }, exitDuration);
      } catch {
        // Fallback to default navigation on invalid URL parse
      }
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleAnchorClick, {
        capture: true,
      });
    };
  }, [router, shouldReduceMotion, isExiting]);

  if (shouldReduceMotion) {
    return <>{children}</>;
  }

  // Landing page exception: landing page keeps its existing fast/custom animation choreography
  const isLandingPage = pathname === "/";

  return (
    <motion.div
      key={pathname}
      initial={isLandingPage ? false : { opacity: 0, scale: 0.985, y: 9 }}
      animate={
        isExiting
          ? { opacity: 0, scale: 0.985, y: -4 }
          : { opacity: 1, scale: 1, y: 0 }
      }
      transition={
        isExiting
          ? { duration: 0.38, ease: [0.22, 1, 0.36, 1] } // ~380ms exit
          : { duration: 0.6, ease: [0.16, 1, 0.3, 1] } // ~600ms enter (total ~980ms - 1000ms)
      }
      className="flex flex-1 flex-col w-full min-h-screen"
    >
      {children}
    </motion.div>
  );
}

export default PageTransitionWrapper;

