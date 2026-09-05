"use client";

import { SectionHeader } from "@/components/shared/section-header";
import { AnimatedContainer } from "@/components/shared/animated-container";
import { Check, X } from "lucide-react";

export function WhyNexusAi() {
  return (
    <section className="py-24 relative bg-background border-b border-border">
      <div className="container mx-auto px-4">
        <SectionHeader 
          badge="Comparison"
          title="Why Choose NexusAI?"
          description="See how a dedicated enterprise AI Knowledge Workspace compares to generic search and chat tools."
        />
        
        <AnimatedContainer animation="fade" delay={0.2} className="max-w-4xl mx-auto overflow-x-auto">
          <div className="min-w-[700px] rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <div className="grid grid-cols-4 gap-4 pb-4 border-b border-border text-xs font-bold text-text-secondary uppercase tracking-wider">
              <div className="col-span-1">Capability</div>
              <div className="col-span-1 text-center">Keyword Search</div>
              <div className="col-span-1 text-center">Standard Chatbots</div>
              <div className="col-span-1 text-center text-accent">NexusAI RAG</div>
            </div>
            
            {[
              { label: "Semantic Vector Search (FAISS)", t: false, c: false, n: true },
              { label: "Grounding in Private Documents", t: true, c: false, n: true },
              { label: "Explicit Page & Score Citations", t: false, c: false, n: true },
              { label: "Multi-Format Parsing (PDF/TXT/DOCX)", t: true, c: false, n: true },
              { label: "Strict Prompt Injection Defenses", t: false, c: false, n: true },
              { label: "Isolated Backend Persistence", t: true, c: false, n: true },
            ].map((row, i) => (
              <div key={i} className={`grid grid-cols-4 gap-4 py-3.5 border-b border-border/60 ${i % 2 === 0 ? 'bg-surface-muted/40' : ''} rounded-xl px-3 items-center text-xs`}>
                <div className="col-span-1 font-medium text-text-primary">{row.label}</div>
                <div className="col-span-1 flex justify-center">
                  {row.t ? <Check className="w-4 h-4 text-text-secondary" /> : <X className="w-4 h-4 text-text-muted" />}
                </div>
                <div className="col-span-1 flex justify-center">
                  {row.c ? <Check className="w-4 h-4 text-text-secondary" /> : <X className="w-4 h-4 text-text-muted" />}
                </div>
                <div className="col-span-1 flex justify-center bg-accent/10 py-1.5 rounded-lg border border-accent/20">
                  {row.n ? <Check className="w-4 h-4 text-accent font-bold" /> : <X className="w-4 h-4 text-text-muted" />}
                </div>
              </div>
            ))}
          </div>
        </AnimatedContainer>
      </div>
    </section>
  );
}
