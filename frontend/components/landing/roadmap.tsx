"use client";

import { ROADMAP_PHASES } from "@/lib/constants";
import { SectionHeader } from "@/components/shared/section-header";
import { AnimatedContainer, StaggerContainer, staggerChild } from "@/components/shared/animated-container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, Sparkles, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function Roadmap() {
  return (
    <section id="roadmap" className="py-24 relative bg-background-subtle border-b border-border">
      <div className="container mx-auto px-4">
        <SectionHeader 
          badge="Milestones"
          title="Development Roadmap"
          description="NexusAI architectural progress and evolution toward enterprise-grade RAG."
        />
        
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
          {ROADMAP_PHASES.map((phase, i) => {
            const isCompleted = phase.status === "completed";
            const isCurrent = phase.status === "current";
            const isPlanned = phase.status === "planned";

            return (
              <AnimatedContainer key={i} variants={staggerChild} className="flex">
                <div className={`relative flex flex-col justify-between w-full rounded-2xl transition-all duration-300 ${
                  isCurrent
                    ? 'border-2 border-accent bg-surface shadow-xl glow-primary scale-[1.02] z-10'
                    : isCompleted
                    ? 'border border-border bg-surface'
                    : 'border border-border/60 bg-surface/60 opacity-80'
                }`}>
                  {isCurrent && (
                    <div className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground shadow-md">
                      Active Development
                    </div>
                  )}

                  <div className="p-6 pb-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                        {phase.phase}
                      </span>
                      {isCompleted && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-500 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          COMPLETED
                        </span>
                      )}
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-bold text-accent border border-accent/25">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                          IN PROGRESS
                        </span>
                      )}
                      {isPlanned && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-0.5 text-[11px] font-semibold text-text-muted border border-border">
                          <Clock className="w-3.5 h-3.5" />
                          PLANNED
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold leading-tight text-text-primary">
                      {phase.title}
                    </h3>
                  </div>

                  <div className="p-6 pt-0 flex-1">
                    <ul className="space-y-2.5 mt-2">
                      {phase.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-xs">
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          ) : isCurrent ? (
                            <Sparkles className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-text-muted shrink-0 mt-0.5" />
                          )}
                          <span className={isCurrent ? 'text-text-primary font-medium' : isCompleted ? 'text-text-primary' : 'text-text-secondary'}>
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AnimatedContainer>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
