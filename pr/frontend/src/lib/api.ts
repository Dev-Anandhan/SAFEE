import { auth, User } from "./firebase";

const API_URL = process.env.NEXT_PUBLIC_SAFEE_API_URL || "http://localhost:8000";

export interface SAFEERequest {
    user_id: string;
    raw_requirement: string;
    repo_context: Record<string, unknown>;
    project_state: Record<string, unknown>;
    vulnerable_code: string;
    allow_human_approval: boolean;
    allow_ci_inject: boolean;
}

export interface SAFEEResponse {
    user_id: string;
    raw_requirement: string;
    requirement_confidence: number;
    requirement_type: string;
    ambiguity_flags: string[];
    plan: string;
    retrieved_snippets: string[];
    guardrails: string[];
    suggested_fix: string;
    patch_valid: boolean;
    risk_score: number;
    similarity_with_repo: number;
    unit_test_passed: boolean;
    lint_passed: boolean;
    light_sast_passed: boolean;
    test_results: Record<string, string>;
    retries: number;
    total_cost_usd: number;
    failures: Array<Record<string, unknown>>;
    telemetry_events: Array<Record<string, unknown>>;
    human_approved: boolean | null;
    ci_approved: boolean | null;
    deployed: boolean;
}

export async function callSAFEE(
    user: User,
    rawRequirement: string,
    vulnerableCode: string,
    repoContext: Record<string, unknown> = {},
    projectState: Record<string, unknown> = {},
): Promise<SAFEEResponse> {
    const idToken = await user.getIdToken();

    const body: SAFEERequest = {
        user_id: user.uid,
        raw_requirement: rawRequirement,
        vulnerable_code: vulnerableCode,
        repo_context: Object.keys(repoContext).length
            ? repoContext
            : { code_snippets: [vulnerableCode] },
        project_state: Object.keys(projectState).length
            ? projectState
            : { source: "web_client" },
        allow_human_approval: true,
        allow_ci_inject: false,
    };

    const res = await fetch(`${API_URL}/safe/run`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(`SAFEE API error ${res.status}: ${text}`);
    }

    return res.json();
}
