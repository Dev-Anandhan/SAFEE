"use client";

import React, { useState } from "react";
import type { SAFEEResponse } from "@/lib/api";

type Tab = "overview" | "code" | "tests" | "telemetry" | "raw";

interface ResultViewerProps {
    result: SAFEEResponse;
}

export default function ResultViewer({ result }: ResultViewerProps) {
    const [tab, setTab] = useState<Tab>("overview");

    const tabs: { id: Tab; label: string }[] = [
        { id: "overview", label: "Overview" },
        { id: "code", label: "Code Fix" },
        { id: "tests", label: "Tests" },
        { id: "telemetry", label: "Telemetry" },
        { id: "raw", label: "Raw JSON" },
    ];

    const riskColor =
        result.risk_score < 0.3
            ? "success"
            : result.risk_score < 0.6
                ? "warning"
                : "danger";

    const confidenceColor =
        result.requirement_confidence > 0.7
            ? "success"
            : result.requirement_confidence > 0.4
                ? "warning"
                : "danger";

    return (
        <div className="result-viewer fade-in-up">
            {/* Tabs */}
            <div className="result-tabs">
                {tabs.map((t) => (
                    <button
                        key={t.id}
                        className={`result-tab ${tab === t.id ? "active" : ""}`}
                        onClick={() => setTab(t.id)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="result-content">
                {tab === "overview" && (
                    <div>
                        {/* Status badges */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                            <span className={`badge ${result.human_approved ? "badge-success" : "badge-danger"}`}>
                                {result.human_approved ? "✓ Approved" : "✗ Needs Review"}
                            </span>
                            <span className={`badge ${result.patch_valid ? "badge-success" : "badge-danger"}`}>
                                {result.patch_valid ? "✓ Patch Valid" : "✗ Invalid Patch"}
                            </span>
                            <span className="badge badge-info">
                                Type: {result.requirement_type}
                            </span>
                            <span className="badge badge-warning">
                                ${result.total_cost_usd.toFixed(4)} cost
                            </span>
                        </div>

                        {/* Scores */}
                        <div className="score-row">
                            <span className="score-label">Confidence</span>
                            <div className="score-bar-track">
                                <div
                                    className={`score-bar-fill ${confidenceColor}`}
                                    style={{ width: `${result.requirement_confidence * 100}%` }}
                                />
                            </div>
                            <span className="score-value">
                                {(result.requirement_confidence * 100).toFixed(0)}%
                            </span>
                        </div>

                        <div className="score-row">
                            <span className="score-label">Risk Score</span>
                            <div className="score-bar-track">
                                <div
                                    className={`score-bar-fill ${riskColor}`}
                                    style={{ width: `${result.risk_score * 100}%` }}
                                />
                            </div>
                            <span className="score-value">
                                {(result.risk_score * 100).toFixed(0)}%
                            </span>
                        </div>

                        <div className="score-row">
                            <span className="score-label">Repo Similarity</span>
                            <div className="score-bar-track">
                                <div
                                    className="score-bar-fill success"
                                    style={{ width: `${result.similarity_with_repo * 100}%` }}
                                />
                            </div>
                            <span className="score-value">
                                {(result.similarity_with_repo * 100).toFixed(0)}%
                            </span>
                        </div>

                        {/* Plan */}
                        {result.plan && (
                            <div style={{ marginTop: 20 }}>
                                <h3 style={{ marginBottom: 8 }}>Plan</h3>
                                <pre style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                                    {result.plan}
                                </pre>
                            </div>
                        )}

                        {/* Ambiguity Flags */}
                        {result.ambiguity_flags?.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <h3 style={{ marginBottom: 8 }}>Ambiguity Flags</h3>
                                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                    {result.ambiguity_flags.map((f, i) => (
                                        <span key={i} className="badge badge-warning">{f}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Guardrail Violations */}
                        {result.guardrails?.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <h3 style={{ marginBottom: 8 }}>⚠ Guardrail Violations</h3>
                                {result.guardrails.map((g, i) => (
                                    <div key={i} className="badge badge-danger" style={{ display: "block", marginBottom: 4 }}>
                                        {g}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {tab === "code" && (
                    <div>
                        <h3 style={{ marginBottom: 12 }}>Suggested Fix</h3>
                        <pre>{result.suggested_fix || "No fix generated"}</pre>
                    </div>
                )}

                {tab === "tests" && (
                    <div>
                        <div className="status-grid" style={{ marginBottom: 20 }}>
                            <div className="status-item">
                                <div className={`status-dot ${result.unit_test_passed ? "pass" : "fail"}`} />
                                <span className="status-text">Unit Tests</span>
                            </div>
                            <div className="status-item">
                                <div className={`status-dot ${result.lint_passed ? "pass" : "fail"}`} />
                                <span className="status-text">Lint</span>
                            </div>
                            <div className="status-item">
                                <div className={`status-dot ${result.light_sast_passed ? "pass" : "fail"}`} />
                                <span className="status-text">SAST</span>
                            </div>
                        </div>

                        {result.test_results && (
                            <>
                                {result.test_results.unit_log && (
                                    <div style={{ marginBottom: 16 }}>
                                        <h3 style={{ marginBottom: 8 }}>Unit Test Log</h3>
                                        <pre>{result.test_results.unit_log}</pre>
                                    </div>
                                )}
                                {result.test_results.lint_log && (
                                    <div style={{ marginBottom: 16 }}>
                                        <h3 style={{ marginBottom: 8 }}>Lint Log</h3>
                                        <pre>{result.test_results.lint_log}</pre>
                                    </div>
                                )}
                                {result.test_results.sast_log && (
                                    <div>
                                        <h3 style={{ marginBottom: 8 }}>SAST Log</h3>
                                        <pre>{result.test_results.sast_log}</pre>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {tab === "telemetry" && (
                    <div>
                        <h3 style={{ marginBottom: 12 }}>Telemetry Events</h3>
                        <pre>{JSON.stringify(result.telemetry_events, null, 2)}</pre>
                    </div>
                )}

                {tab === "raw" && (
                    <pre>{JSON.stringify(result, null, 2)}</pre>
                )}
            </div>
        </div>
    );
}
