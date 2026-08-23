"use client";

import React from "react";
import { Sidebar } from "./sidebar";

interface AppShellProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  fullBleed?: boolean;
}

export function AppShell({
  children,
  title,
  description,
  action,
  fullBleed = false,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header (Hidden in Full-Bleed mode to eliminate double-headers) */}
        {!fullBleed && (
          <header className="border-b border-white/10 bg-[#020617]/90 px-6 py-5 backdrop-blur-md sticky top-0 z-30">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl font-mono">
                  {title}
                </h1>
                {description && (
                  <p className="mt-1 text-xs text-slate-400">{description}</p>
                )}
              </div>
              {action && <div className="mt-2 md:mt-0">{action}</div>}
            </div>
          </header>
        )}

        {/* Content Body */}
        <main
          className={`flex-1 overflow-y-auto bg-[#020617] ${
            fullBleed ? "p-0 h-full" : "p-5 md:p-8"
          }`}
        >
          {fullBleed ? (
            <div className="h-full w-full">{children}</div>
          ) : (
            <div className="mx-auto max-w-7xl">{children}</div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AppShell;
