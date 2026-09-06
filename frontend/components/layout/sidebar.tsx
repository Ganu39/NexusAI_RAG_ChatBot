"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NexusLogo } from "@/components/ui/nexus-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
  badge?: string;
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Documents",
    href: "/documents",
    icon: FileText,
  },
  {
    name: "RAG Q&A Chat",
    href: "/chat",
    icon: MessageSquare,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

const STORAGE_KEY = "nexus-sidebar-collapsed";
let cachedSidebarCollapsed: boolean | null = null;

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined" && cachedSidebarCollapsed !== null) {
      return cachedSidebarCollapsed;
    }
    return false;
  });
  const [hasMounted, setHasMounted] = useState(false);

  // Restore persistence safely on initial mount without hydration animation
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        const parsed = stored === "true";
        setIsCollapsed(parsed);
        cachedSidebarCollapsed = parsed;
      }
    } catch {
      // Ignore localStorage errors (e.g. privacy mode)
    }

    // Enable smooth transitions only after the initial width synchronization
    const timer = setTimeout(() => {
      setHasMounted(true);
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      cachedSidebarCollapsed = next;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // Ignore localStorage errors
      }
      return next;
    });
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="flex w-full items-center justify-between border-b border-border bg-background px-4 py-3 md:hidden">
        <Link href="/" className="flex items-center">
          <NexusLogo size="sm" showText />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-text-secondary hover:bg-surface hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-95 transition-all duration-150"
            aria-label="Toggle Navigation Menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Overlay for Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-background overflow-x-hidden md:static md:translate-x-0 ${
          isCollapsed ? "w-64 md:w-[68px]" : "w-64"
        } ${
          hasMounted
            ? "transition-[width,transform] duration-[400ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
            : "transition-none"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Brand Header */}
        <div
          className={`flex h-16 items-center border-b border-border ${
            isCollapsed
              ? "justify-between px-6 md:justify-center md:px-2"
              : "justify-between px-4 sm:px-6"
          }`}
        >
          {/* Expanded Logo: visible on mobile drawer, and desktop when expanded */}
          <Link
            href="/"
            className={`items-center ${isCollapsed ? "flex md:hidden" : "flex"}`}
          >
            <NexusLogo size="md" showText subtitle="RAG Chatbot" />
          </Link>

          {/* Collapsed Monogram: desktop only when collapsed */}
          <Link
            href="/"
            className={`items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-xl p-1 ${
              isCollapsed ? "hidden md:flex" : "hidden"
            }`}
            title="NexusAI Home"
            aria-label="NexusAI Home"
          >
            <NexusLogo size="md" showText={false} />
          </Link>

          {/* Desktop Collapse Toggle (Expanded Mode Header) */}
          {!isCollapsed && (
            <button
              type="button"
              onClick={toggleCollapse}
              className="hidden md:flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-elevated hover:border-accent/40 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all duration-150 btn-hover-shadow"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}

          {/* Mobile Drawer Close Button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1 text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-95 transition-all duration-150 md:hidden"
            aria-label="Close navigation drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Desktop Expand Control (Collapsed Mode Top Area) */}
        {isCollapsed && (
          <div className="hidden md:flex flex-col items-center py-2.5 px-2 border-b border-border/40">
            <button
              type="button"
              onClick={toggleCollapse}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-elevated hover:border-accent/40 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all duration-150 btn-hover-shadow"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4 text-accent" />
            </button>
          </div>
        )}

        {/* Navigation Section */}
        <div
          className={`flex-1 overflow-y-auto ${
            isCollapsed ? "px-3 md:px-2 py-6" : "px-3 py-6"
          }`}
        >
          <div
            className={`space-y-1.5 ${
              isCollapsed ? "flex flex-col items-center" : ""
            }`}
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              if (item.disabled) {
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-text-muted cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span className={isCollapsed ? "md:hidden" : ""}>
                        {item.name}
                      </span>
                    </div>
                    {item.badge && (
                      <span
                        className={`rounded-full bg-surface-muted px-2 py-0.5 text-[10px] text-text-muted font-mono ${
                          isCollapsed ? "md:hidden" : ""
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
              }

              return (
                <React.Fragment key={item.name}>
                  {/* Expanded Nav Link (mobile drawer, and desktop when expanded) */}
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`${
                      isCollapsed ? "flex md:hidden" : "flex"
                    } items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98] transition-all duration-150 ${
                      isActive
                        ? "bg-accent/10 text-accent border border-accent/20 font-semibold"
                        : "text-text-secondary hover:bg-surface hover:text-text-primary border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive ? "text-accent" : ""
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                  </Link>

                  {/* Collapsed Nav Link (desktop only when collapsed) */}
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={item.name}
                    aria-label={item.name}
                    className={`${
                      isCollapsed ? "hidden md:flex" : "hidden"
                    } h-10 w-10 items-center justify-center rounded-xl text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.95] transition-all duration-150 ${
                      isActive
                        ? "bg-accent/15 text-accent border border-accent/30 font-semibold shadow-sm"
                        : "text-text-secondary hover:bg-surface hover:text-text-primary border border-transparent hover:border-border"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${isActive ? "text-accent" : ""}`}
                    />
                  </Link>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Footer Section — Expanded Mode */}
        <div
          className={`${
            isCollapsed ? "block md:hidden" : "block"
          } border-t border-border p-4 space-y-3`}
        >
          <ThemeToggle
            showLabel
            className="w-full justify-between px-3 py-2 bg-surface text-text-secondary hover:text-text-primary"
          />
          <div className="rounded-xl bg-surface border border-border p-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span className="font-mono text-[10px] text-text-tertiary">
                Status
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
            <p className="text-xs font-semibold text-text-primary font-mono truncate">
              Nexus_Bot Active
            </p>
          </div>
        </div>

        {/* Footer Section — Collapsed Mode (Desktop Icon Rail) */}
        <div
          className={`${
            isCollapsed ? "hidden md:flex" : "hidden"
          } border-t border-border p-2 space-y-2.5 flex-col items-center`}
        >
          {/* Compact Theme Toggle */}
          <ThemeToggle
            showLabel={false}
            className="h-10 w-10 justify-center bg-surface text-text-secondary hover:text-text-primary border-border"
          />

          {/* Status Indicator Dot */}
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-border cursor-help"
            title="Status: Online • Nexus_Bot Active"
            aria-label="Status: Online • Nexus_Bot Active"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
