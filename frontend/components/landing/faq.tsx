"use client";

import { FAQ_ITEMS } from "@/lib/constants";
import { SectionHeader } from "@/components/shared/section-header";
import { AnimatedContainer, StaggerContainer, staggerChild } from "@/components/shared/animated-container";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 relative bg-background border-b border-border">
      <div className="container mx-auto px-4">
        <SectionHeader 
          badge="FAQ"
          title="Frequently Asked Questions"
          description="Everything you need to know about NexusAI RAG architecture and document intelligence."
        />
        
        <StaggerContainer className="max-w-3xl mx-auto space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <AnimatedContainer key={i} variants={staggerChild}>
                <div 
                  className="border border-border bg-surface rounded-2xl overflow-hidden transition-all duration-200"
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="w-full text-left px-6 py-4 flex items-center justify-between focus:outline-none"
                  >
                    <span className="font-semibold text-sm text-text-primary">{item.question}</span>
                    <ChevronDown className={cn(
                      "w-4 h-4 text-text-muted transition-transform duration-200 shrink-0",
                      isOpen && "transform rotate-180 text-accent"
                    )} />
                  </button>
                  
                  <div 
                    className={cn(
                      "px-6 text-xs text-text-secondary overflow-hidden transition-all duration-300 ease-in-out",
                      isOpen ? "max-h-96 pb-5 opacity-100" : "max-h-0 opacity-0"
                    )}
                  >
                    <p className="leading-relaxed border-t border-border pt-3">{item.answer}</p>
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
