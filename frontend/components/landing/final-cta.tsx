"use client";

import Link from "next/link";
import { AnimatedContainer } from "@/components/shared/animated-container";
import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutDashboard, FileText, MessageSquare } from "lucide-react";
import { GradientBlob } from "@/components/shared/gradient-blob";

export function FinalCTA() {
  return (
    <section className="py-28 relative overflow-hidden bg-background-subtle border-b border-border">
      <div className="container mx-auto px-4 relative z-10 text-center">
        <AnimatedContainer animation="slide-up" className="max-w-3xl mx-auto border border-border bg-surface rounded-3xl p-10 md:p-14 shadow-xl space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-text-primary">
            Ready to Turn Your Documents into <span className="text-gradient-accent">Grounded Intelligence?</span>
          </h2>
          <p className="text-sm md:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Experience the enterprise-grade AI knowledge workspace. Upload your documents and start receiving verified answers backed by source citations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button asChild size="lg" className="h-12 px-7 text-sm font-semibold group bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg shadow-accent/20 w-full sm:w-auto">
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Open Dashboard
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-sm font-semibold border-border bg-surface-muted hover:bg-surface-elevated text-text-primary w-full sm:w-auto">
              <Link href="/documents">
                <FileText className="mr-2 h-4 w-4 text-emerald-500" />
                Manage Documents
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-sm font-semibold border-border bg-surface-muted hover:bg-surface-elevated text-text-primary w-full sm:w-auto">
              <Link href="/chat">
                <MessageSquare className="mr-2 h-4 w-4 text-purple-500" />
                Start RAG Chat
              </Link>
            </Button>
          </div>
        </AnimatedContainer>
      </div>
    </section>
  );
}
