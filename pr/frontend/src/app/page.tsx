"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  auth,
  googleProvider,
  signInWithPopup,
  onAuthStateChanged,
  User,
} from "@/lib/firebase";

const FEATURES = [
  {
    icon: "🧠",
    title: "Planner + RAG",
    desc: "Small LLM parses requirements, SBERT-FAISS retrieves relevant repo context.",
  },
  {
    icon: "🛡️",
    title: "Guardrails",
    desc: "Deterministic regex rules block eval(), sudo, shell injection, and more.",
  },
  {
    icon: "⚡",
    title: "CodeT5+ Generation",
    desc: "GPU-accelerated code-fix generation scoped tightly to the rule.",
  },
  {
    icon: "🔍",
    title: "GraphCodeBERT Validation",
    desc: "Semantic similarity check ensures patches stay aligned with your repo.",
  },
  {
    icon: "✅",
    title: "Tier-1 Tests",
    desc: "Parallel lint, unit tests, and light SAST — all before human review.",
  },
  {
    icon: "📊",
    title: "Risk Scoring & Telemetry",
    desc: "Every run is scored, budgeted, and logged for full observability.",
  },
];

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  const handleGetStarted = async () => {
    if (user) {
      router.push("/safe");
    } else {
      try {
        await signInWithPopup(auth, googleProvider);
        router.push("/safe");
      } catch (err) {
        console.error("Login failed:", err);
      }
    }
  };

  return (
    <>
      <Navbar />

      <main className="container">
        {/* Hero */}
        <section className="hero">
          <div className="hero-badge fade-in-up">
            🔒 AI-Powered Code Security Pipeline
          </div>

          <h1 className="fade-in-up delay-1">
            Secure Code,{" "}
            <span>Automatically.</span>
          </h1>

          <p className="hero-subtitle fade-in-up delay-2">
            SAFEE detects vulnerabilities, generates minimal fixes with CodeT5+,
            validates patches with GraphCodeBERT, and enforces guardrails —
            all orchestrated through a LangGraph agent pipeline.
          </p>

          <div className="fade-in-up delay-3">
            <button className="btn btn-primary" onClick={handleGetStarted}>
              {user ? "Go to Dashboard →" : "Get Started — Sign in with Google"}
            </button>
          </div>
        </section>

        {/* Features */}
        <section className="features-grid">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className={`feature-card fade-in-up delay-${Math.min(i + 1, 4)}`}
            >
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </section>

        {/* Architecture */}
        <section style={{ padding: "80px 0 100px", textAlign: "center" }}>
          <h2 className="fade-in-up" style={{ marginBottom: 12 }}>
            How SAFEE Works
          </h2>
          <p className="fade-in-up delay-1" style={{ maxWidth: 560, margin: "0 auto 40px" }}>
            A stateful LangGraph agent orchestrates 13 specialised nodes,
            from planning to deployment.
          </p>

          <div
            className="card fade-in-up delay-2"
            style={{ maxWidth: 720, margin: "0 auto", textAlign: "left" }}
          >
            <pre style={{ fontFamily: "var(--font-mono)", fontSize: "0.82rem", lineHeight: 1.7, color: "var(--text-secondary)", overflowX: "auto" }}>
              {`User → FastAPI (HTTP)
  └─→ LangGraph Agent (stateful hub)
        ├─ Planner Node (small LLM)
        │    └─ SBERT-FAISS RAG Node
        │         └─ Repo-State Node
        ├─ Guardrail Node (deterministic)
        ├─ CodeT5+ Node (GPU, generate fix)
        │    └─ GraphCodeBERT Validate (GPU)
        ├─ Tier-1 Test Runner (CPU, parallel)
        │    ├─ Unit tests
        │    ├─ Lint / type-check
        │    └─ Light-SAST / security
        ├─ Retry-Control Node
        ├─ Risk-Scoring Node
        ├─ Cost-Budget Node
        ├─ Failure-Memory Node
        ├─ Observability / Telemetry Node
        └─ Human-Approval Node
              └─ Deploy / CI-Injector → Real CI/CD`}
            </pre>
          </div>
        </section>
      </main>
    </>
  );
}
