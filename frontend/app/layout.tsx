import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../styles/globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NexusAI — AI Knowledge Workspace",
  description:
    "Enterprise-grade AI Knowledge Workspace powered by Retrieval-Augmented Generation. Upload documents, chat with your knowledge, generate summaries, quizzes, and flashcards.",
  keywords: [
    "AI",
    "RAG",
    "Knowledge Base",
    "Enterprise AI",
    "Document AI",
    "NexusAI",
    "LangChain",
    "Gemini",
  ],
  authors: [{ name: "NexusAI Team" }],
  openGraph: {
    title: "NexusAI — AI Knowledge Workspace",
    description:
      "Enterprise-grade AI Knowledge Workspace powered by Retrieval-Augmented Generation.",
    url: "https://nexusai.dev",
    siteName: "NexusAI",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "NexusAI — AI Knowledge Workspace",
    description:
      "Enterprise-grade AI Knowledge Workspace powered by Retrieval-Augmented Generation.",
  },
  icons: {
    icon: "/icon.svg",
  },
  metadataBase: new URL("https://nexusai.dev"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
