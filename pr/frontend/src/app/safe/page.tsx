"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ResultViewer from "@/components/ResultViewer";
import {
    auth,
    onAuthStateChanged,
    User,
} from "@/lib/firebase";
import { callSAFEE, SAFEEResponse } from "@/lib/api";

export default function SafePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<SAFEEResponse | null>(null);

    const [rawReq, setRawReq] = useState("");
    const [vulnCode, setVulnCode] = useState("");

    const router = useRouter();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            setUser(u);
            setLoading(false);
            if (!u) router.push("/");
        });
        return () => unsub();
    }, [router]);

    const handleSubmit = async () => {
        if (!user) return;
        if (!rawReq.trim()) {
            setError("Please enter a requirement.");
            return;
        }

        setError(null);
        setSubmitting(true);
        setResult(null);

        try {
            const data = await callSAFEE(user, rawReq, vulnCode);
            setResult(data);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Unknown error";
            setError(message);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="loading-overlay">
                    <div className="spinner" />
                    <p className="loading-text">Loading…</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />

            <main className="container safe-page">
                <div className="safe-page-header fade-in-up">
                    <h1>
                        SAFEE{" "}
                        <span style={{ background: "var(--gradient-brand)", backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                            Dashboard
                        </span>
                    </h1>
                    <p>Submit a requirement and vulnerable code to run the full SAFEE pipeline.</p>
                </div>

                <div className="safe-grid">
                    {/* Left — Input Form */}
                    <div className="card fade-in-up delay-1">
                        <div className="card-header">
                            <h3 className="card-title">🔧 Pipeline Input</h3>
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="requirement">
                                Requirement / Rule
                            </label>
                            <textarea
                                id="requirement"
                                className="form-textarea"
                                rows={4}
                                placeholder="e.g., Only paid users can access payment endpoints"
                                value={rawReq}
                                onChange={(e) => setRawReq(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label" htmlFor="vulnCode">
                                Vulnerable Code
                            </label>
                            <textarea
                                id="vulnCode"
                                className="form-textarea"
                                rows={12}
                                placeholder={`def get_payment_data(user):\n    # No subscription check!\n    return db.query("SELECT * FROM payments WHERE user_id = ?", user.id)`}
                                value={vulnCode}
                                onChange={(e) => setVulnCode(e.target.value)}
                            />
                        </div>

                        {error && (
                            <div className="badge badge-danger" style={{ marginBottom: 16, display: "block", padding: "10px 14px" }}>
                                ⚠ {error}
                            </div>
                        )}

                        <button
                            className="btn btn-primary"
                            onClick={handleSubmit}
                            disabled={submitting}
                            style={{ width: "100%" }}
                        >
                            {submitting ? (
                                <>
                                    <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, marginRight: 8 }} />
                                    Running SAFEE Pipeline…
                                </>
                            ) : (
                                "🚀 Run SAFEE"
                            )}
                        </button>
                    </div>

                    {/* Right — Results */}
                    <div className="fade-in-up delay-2">
                        {submitting && (
                            <div className="card">
                                <div className="loading-overlay">
                                    <div className="spinner" />
                                    <p className="loading-text">
                                        Running 13-node pipeline…<br />
                                        <small style={{ color: "var(--text-muted)" }}>
                                            Planner → RAG → CodeT5+ → GraphCodeBERT → Tests → Approval
                                        </small>
                                    </p>
                                </div>
                            </div>
                        )}

                        {result && <ResultViewer result={result} />}

                        {!submitting && !result && (
                            <div className="card" style={{ textAlign: "center", padding: "60px 28px" }}>
                                <div style={{ fontSize: "3rem", marginBottom: 16 }}>🔒</div>
                                <h3 style={{ marginBottom: 8, color: "var(--text-primary)" }}>
                                    Ready to Analyze
                                </h3>
                                <p style={{ fontSize: "0.9rem", maxWidth: 340, margin: "0 auto" }}>
                                    Enter a security requirement and vulnerable code, then hit
                                    &ldquo;Run SAFEE&rdquo; to execute the full pipeline.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}
