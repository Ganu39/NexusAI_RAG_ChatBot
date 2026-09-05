import Link from "next/link";
import { GitBranch, MessageCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { NexusLogo } from "@/components/ui/nexus-logo";

export function Footer() {
  return (
    <footer className="bg-[#080B11] border-t border-[#1E293B] pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-1">
            <NexusLogo size="sm" showText className="mb-4" />
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Enterprise-grade AI Knowledge Workspace powered by Retrieval-Augmented Generation.
            </p>
            <div className="flex gap-4">
              <Link href="https://github.com/Ganu39/NexusAI" target="_blank" rel="noreferrer" className="text-zinc-400 hover:text-white transition-colors">
                <GitBranch className="w-5 h-5" />
                <span className="sr-only">GitHub</span>
              </Link>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-zinc-300">Navigation</h4>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/documents" className="hover:text-white transition-colors">Documents</Link></li>
              <li><Link href="/chat" className="hover:text-white transition-colors">RAG Chat</Link></li>
              <li><Link href="#roadmap" className="hover:text-white transition-colors">Roadmap</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-zinc-300">Technology</h4>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li><span className="text-zinc-500">Google Gemini 2.5 Flash</span></li>
              <li><span className="text-zinc-500">FAISS Vector Database</span></li>
              <li><span className="text-zinc-500">FastAPI & Python</span></li>
              <li><span className="text-zinc-500">Next.js & Tailwind CSS</span></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4 text-xs uppercase tracking-wider text-zinc-300">Source Code</h4>
            <ul className="space-y-2.5 text-xs text-zinc-400">
              <li>
                <Link href="https://github.com/Ganu39/NexusAI" target="_blank" rel="noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
                  <span>GitHub Repository ↗</span>
                </Link>
              </li>
              <li>
                <Link href="https://github.com/Ganu39/NexusAI#readme" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  Documentation
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <Separator className="mb-8 border-[#1E293B]" />
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} NexusAI. Production RAG Knowledge Base.</p>
          <p className="flex items-center gap-1">
            Built for Developer & AI Workspaces
          </p>
        </div>
      </div>
    </footer>
  );
}
