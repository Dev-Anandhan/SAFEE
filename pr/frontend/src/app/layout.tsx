import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SAFEE — Safe Automated Fix & Enforcement Engine",
  description:
    "AI-powered code security pipeline with LangGraph, CodeT5+, GraphCodeBERT, and SBERT-FAISS RAG. Detect vulnerabilities, generate fixes, validate patches, and enforce guardrails — all in one flow.",
  keywords: [
    "SAFEE",
    "code security",
    "AI code fix",
    "LangGraph",
    "CodeT5+",
    "GraphCodeBERT",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
