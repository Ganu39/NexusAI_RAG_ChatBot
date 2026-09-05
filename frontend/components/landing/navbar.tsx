"use client";

import Link from "next/link";
import { GitBranch, Menu, X, FileText, MessageSquare, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { NexusLogo } from "@/components/ui/nexus-logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function Navbar() {
  const scrolled = useScroll(50);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300 border-b",
        scrolled ? "bg-background/90 backdrop-blur-md border-border shadow-sm" : "bg-transparent border-transparent"
      )}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <NexusLogo size="md" showText />
        </Link>

        <nav className="hidden md:flex items-center gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary px-2 py-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98] transition-all"
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-400" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/documents"
            className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary px-2 py-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98] transition-all"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Documents</span>
          </Link>
          <Link
            href="/chat"
            className="flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text-primary px-2 py-1 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98] transition-all"
          >
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span>RAG Chat</span>
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Button asChild variant="ghost" size="icon" className="text-text-secondary hover:text-text-primary hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <Link href="https://github.com/Ganu39/NexusAI" target="_blank" rel="noreferrer">
              <GitBranch className="w-5 h-5" />
              <span className="sr-only">GitHub</span>
            </Link>
          </Button>

          <Button asChild className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <Link href="/dashboard">Open Workspace</Link>
          </Button>
        </div>

        <button
          className="md:hidden p-2 text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg active:scale-95 transition-all duration-150"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full bg-background border-b border-border shadow-xl py-4 px-4 flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm font-medium text-text-primary py-2 px-2 rounded-lg border-b border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98] transition-all"
            onClick={() => setMobileMenuOpen(false)}
          >
            <LayoutDashboard className="w-4 h-4 text-indigo-400" />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/documents"
            className="flex items-center gap-2 text-sm font-medium text-text-primary py-2 px-2 rounded-lg border-b border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98] transition-all"
            onClick={() => setMobileMenuOpen(false)}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Documents</span>
          </Link>
          <Link
            href="/chat"
            className="flex items-center gap-2 text-sm font-medium text-text-primary py-2 px-2 rounded-lg border-b border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent active:scale-[0.98] transition-all"
            onClick={() => setMobileMenuOpen(false)}
          >
            <MessageSquare className="w-4 h-4 text-purple-400" />
            <span>RAG Chat</span>
          </Link>
          <div className="flex items-center justify-between py-2 border-b border-border/60">
            <span className="text-sm font-medium text-text-secondary">Theme</span>
            <ThemeToggle showLabel />
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                Open Workspace
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full gap-2 border-border bg-surface text-text-primary hover:bg-surface-elevated">
              <Link href="https://github.com/Ganu39/NexusAI" target="_blank" rel="noreferrer">
                <GitBranch className="w-4 h-4" /> View GitHub Repository
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
