"use client";

import { SectionHeader } from "@/components/shared/section-header";
import { AnimatedContainer, StaggerContainer, staggerChild } from "@/components/shared/animated-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Layers, Zap, CheckCircle2 } from "lucide-react";

const CAPABILITIES = [
  {
    icon: Brain,
    title: "Context-Aware Generation",
    description: "Powered by Google's Gemini, NexusAI doesn't just retrieve facts; it understands the nuance of your specialized domain.",
    bullets: ["Synthesizes information across multiple sources", "Maintains conversational memory", "Cites exact page numbers and paragraphs"]
  },
  {
    icon: Layers,
    title: "Multi-Modal Understanding",
    description: "Knowledge isn't just text. NexusAI processes and indexes rich documents to capture the full picture.",
    bullets: ["PDFs with complex layouts", "Images and scanned documents via OCR", "Tabular data extraction"]
  },
  {
    icon: Zap,
    title: "Adaptive Learning",
    description: "Your knowledge base evolves. The vector store automatically updates and optimizes as you add new information.",
    bullets: ["Real-time document ingestion", "Automatic semantic chunking", "Continuous index optimization"]
  }
];

export function AiCapabilities() {
  return (
    <section className="py-24 relative bg-background-subtle border-b border-border">
      <div className="container mx-auto px-4">
        <SectionHeader 
          badge="Intelligence"
          title="AI-Powered Capabilities"
          description="State-of-the-art AI models combined with advanced FAISS vector search."
        />
        
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {CAPABILITIES.map((cap, i) => {
            const Icon = cap.icon;
            return (
              <AnimatedContainer key={i} variants={staggerChild}>
                <div className="h-full rounded-2xl border border-border bg-surface p-6 hover:border-accent/40 hover:bg-surface-elevated transition-all duration-300 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="h-12 w-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-accent" />
                    </div>
                    <h3 className="text-xl font-bold text-text-primary mb-2">{cap.title}</h3>
                    <p className="text-xs text-text-secondary mb-6 leading-relaxed">
                      {cap.description}
                    </p>
                  </div>
                  <ul className="space-y-2.5 border-t border-border pt-4">
                    {cap.bullets.map((bullet, j) => (
                      <li key={j} className="flex items-start gap-2 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-text-primary">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimatedContainer>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
