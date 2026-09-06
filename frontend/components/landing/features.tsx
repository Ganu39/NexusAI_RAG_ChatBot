"use client";

import { FEATURES } from "@/lib/constants";
import { SectionHeader } from "@/components/shared/section-header";
import { AnimatedContainer, StaggerContainer, staggerChild } from "@/components/shared/animated-container";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function Features() {
  return (
    <section id="features" className="py-24 relative bg-background">
      <div className="container mx-auto px-4">
        <SectionHeader 
          badge="Features"
          title="Engineered for Document Intelligence"
          description="A complete suite of AI-powered tools designed to transform how you extract and interact with your knowledge base."
        />
        
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <AnimatedContainer key={i} variants={staggerChild}>
                <div className="h-full rounded-2xl border border-border bg-surface p-6 hover:border-accent hover:bg-surface-elevated transition-all duration-300 group flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4 group-hover:bg-accent group-hover:text-white transition-colors">
                      <Icon className="w-6 h-6 text-accent group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary mb-2">{feature.title}</h3>
                    <p className="text-xs text-text-secondary leading-relaxed">{feature.description}</p>
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
