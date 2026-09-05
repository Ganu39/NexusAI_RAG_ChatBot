"use client";

import React, { useState } from "react";
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
  Sparkles,
  ExternalLink,
  ShieldAlert,
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

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3 md:hidden">
        <Link href="/" className="flex items-center">
          <NexusLogo size="sm" showText />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="rounded-lg p-2 text-text-secondary hover:bg-surface hover:text-text-primary"
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
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-background transition-colors duration-200 md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <Link href="/" className="flex items-center">
            <NexusLogo size="md" showText subtitle="RAG Chatbot" />
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1 text-text-secondary hover:text-text-primary md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-6">
          <div className="space-y-1">
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
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] text-text-muted font-mono">
                        {item.badge}
                      </span>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent/10 text-accent border border-accent/20 font-semibold"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? "text-accent" : ""}`} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* User Workspace Info & Theme Switcher Footer */}
        <div className="border-t border-border p-4 space-y-3">
          <ThemeToggle showLabel className="w-full justify-between px-3 py-2 bg-surface text-text-secondary hover:text-text-primary" />
          <div className="rounded-xl bg-surface border border-border p-3 space-y-1">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span className="font-mono text-[10px] text-text-tertiary">Status</span>
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
      </aside>
    </>
  );
}

export default Sidebar;
