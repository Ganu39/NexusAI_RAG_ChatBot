"use client";

import { SectionHeader } from "@/components/shared/section-header";
import { AnimatedContainer } from "@/components/shared/animated-container";
import { Search, Bot, FileText, Send, User } from "lucide-react";

export function ProductPreview() {
  return (
    <section className="py-24 relative overflow-hidden bg-background-subtle border-y border-border">
      <div className="container mx-auto px-4">
        <SectionHeader 
          badge="Interface"
          title="Engineered for Deep Knowledge Workflows"
          description="A deterministic, low-latency interface designed for verified document intelligence."
        />
        
        <AnimatedContainer animation="slide-up" delay={0.2} className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-border bg-surface shadow-2xl overflow-hidden relative">
            {/* Window Controls Header */}
            <div className="h-10 border-b border-border bg-background flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <div className="ml-4 flex-1 text-center text-xs text-text-tertiary font-mono flex items-center justify-center gap-2">
                <Search className="w-3 h-3 text-accent" /> nexusai.dev/chat — Grounded Mode
              </div>
            </div>
            
            {/* App Layout Mockup */}
            <div className="flex h-[420px]">
              {/* Sidebar */}
              <div className="w-60 border-r border-border bg-surface-muted p-4 hidden md:flex flex-col gap-3">
                <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">Knowledge Scope</div>
                <div className="p-2.5 rounded-xl bg-accent/15 border border-accent/30 flex items-center gap-2 text-xs text-accent font-semibold">
                  <FileText className="w-4 h-4 text-accent" /> Q3_Financial_Report.pdf
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-border flex items-center gap-2 text-xs text-text-secondary">
                  <FileText className="w-4 h-4 text-text-tertiary" /> System_Architecture.docx
                </div>
                <div className="p-2.5 rounded-xl bg-surface border border-border flex items-center gap-2 text-xs text-text-secondary">
                  <FileText className="w-4 h-4 text-text-tertiary" /> Security_Protocols.txt
                </div>
              </div>
              
              {/* Main Chat Area */}
              <div className="flex-1 flex flex-col bg-surface justify-between p-6">
                <div className="space-y-4 overflow-hidden">
                  {/* User Message */}
                  <div className="flex gap-3 justify-end">
                    <div className="bg-accent text-white px-4 py-2.5 rounded-2xl text-xs max-w-[80%] shadow-sm">
                      <p>Can you summarize the key findings from the Q3 Financial Report?</p>
                    </div>
                    <div className="w-7 h-7 rounded-xl bg-surface-muted border border-border flex items-center justify-center shrink-0">
                      <User className="w-3.5 h-3.5 text-text-secondary" />
                    </div>
                  </div>
                  
                  {/* AI Response */}
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-xl bg-accent/15 text-accent border border-accent/25 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <div className="bg-surface-elevated border border-border p-4 rounded-2xl flex flex-col gap-2 max-w-[85%] text-xs shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          Grounded Answer
                        </span>
                        <span className="text-[10px] text-text-tertiary font-mono">(4 chunks matched)</span>
                      </div>
                      <p className="text-text-primary leading-relaxed">
                        Based on the ingested document <span className="text-accent font-mono">Q3_Financial_Report.pdf</span>:
                      </p>
                      <ul className="text-text-secondary space-y-1 list-disc pl-4">
                        <li>Quarterly recurring revenue expanded by 15.2% year-over-year.</li>
                        <li>Operating margins improved by 210 bps due to automated pipelines.</li>
                        <li>Enterprise document intelligence tier drove 34% of new ARR.</li>
                      </ul>
                      <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-border">
                        <div className="flex items-center gap-1 text-[10px] font-mono border border-border bg-surface rounded-lg px-2 py-0.5 text-accent">
                          <FileText className="w-3 h-3 text-accent" /> Page 4 • 95.4% Match
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-mono border border-border bg-surface rounded-lg px-2 py-0.5 text-accent">
                          <FileText className="w-3 h-3 text-accent" /> Page 7 • 91.8% Match
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Input Area Mock */}
                <div className="pt-4 border-t border-border">
                  <div className="relative">
                    <input 
                      type="text" 
                      disabled
                      placeholder="Ask questions with grounded source attribution..." 
                      className="w-full bg-background border border-border rounded-xl pl-4 pr-12 py-2.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none"
                    />
                    <div className="absolute right-2 top-1.5 bottom-1.5 w-8 bg-accent rounded-lg flex items-center justify-center text-white">
                      <Send className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedContainer>
      </div>
    </section>
  );
}

function MessageIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
}
