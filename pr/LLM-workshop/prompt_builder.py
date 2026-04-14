from typing import Any, Dict, List


def build_messages(query: str, contexts: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """
    Builds chat messages for the interactive Q&A assistant.
    """
    system_prompt = (
        "You are an Indian Legal Document Compliance Engine.\n\n"
        "Your task:\n"
        "1. Identify document type.\n"
        "2. Detect missing mandatory elements.\n"
        "3. Detect statutory violations.\n"
        "4. Map violations to applicable Indian laws.\n"
        "5. Classify severity level (Critical, High, Medium, Low).\n"
        "6. Provide corrective remediation steps.\n"
        "7. Output STRICT JSON only.\n\n"
        "Rules:\n"
        "- Do not speculate.\n"
        "- If uncertain, mark 'confidence': 'low'.\n"
        "- Only cite applicable Indian statutes strictly based on the provided retrieved context.\n"
        "- Use structured legal reasoning.\n"
        "- Do not output explanations outside JSON.\n"
        "- Assume state-level stamp variation unless specified."
    )

    context_str = ""
    for idx, ctx in enumerate(contexts):
        context_str += (
            f"--- Context {idx + 1} ---\n"
            f"Document Type: {ctx.get('doc_type')}\n"
            f"Clause Title: {ctx.get('clause_title')}\n"
            f"Governing Law: {ctx.get('governing_law')}\n"
            f"Risk Level: {ctx.get('risk_level')}\n"
            f"Content: {ctx.get('content')}\n\n"
        )

    user_prompt = (
        f"Context Information:\n{context_str}\n"
        f"User Question: {query}\n\n"
        f"Please provide a precise, professional answer based strictly on the context above."
    )

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]


def build_scan_messages(document_text: str, rule_contexts: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """
    Builds messages for scanning an uploaded document against the rules database.
    The model receives the full document text AND the relevant rules/checklist chunks,
    then outputs a strict JSON compliance report.
    """
    system_prompt = (
        "You are an Indian Legal Document Compliance Engine.\n\n"
        "You will be given:\n"
        "A) The full text of an uploaded legal document.\n"
        "B) Relevant legal rules from the compliance database.\n\n"
        "CRITICAL GROUNDING RULES (you MUST follow these):\n"
        "- ONLY flag an issue if you can point to a specific phrase, clause, or ABSENCE in the actual document text that proves the violation.\n"
        "- For every issue, you MUST provide an 'evidence' field that quotes the exact text from the document, or explicitly states what specific mandatory element is missing and WHERE it should appear.\n"
        "- Do NOT assume a document is defective simply because a rule exists in the rules database. Only apply rules that are relevant to the identified document type.\n"
        "- Do NOT invent or fabricate violations. If the document appears compliant for a particular rule, do NOT flag it.\n"
        "- If the document does not contain enough information to confirm a violation, do NOT flag it.\n"
        "- If you find zero issues, return an empty issues array. That is perfectly acceptable.\n"
        "- Do not speculate. If uncertain, set 'confidence': 'low'.\n\n"
        "Your task:\n"
        "1. Identify the document type.\n"
        "2. Scan the document for missing mandatory elements ONLY where evidence supports the finding.\n"
        "3. Detect statutory violations ONLY where the document text confirms them.\n"
        "4. Map each confirmed violation to the applicable Indian law.\n"
        "5. Classify severity: Critical, High, Medium, or Low.\n"
        "6. Provide remediation steps.\n"
        "7. Output STRICT JSON only in this format:\n"
        '{\n'
        '  "document_type": "string",\n'
        '  "confidence": "high|medium|low",\n'
        '  "summary": "brief summary of the document",\n'
        '  "issues": [\n'
        '    {\n'
        '      "id": "1",\n'
        '      "severity": "critical|high|medium|low",\n'
        '      "title": "short title",\n'
        '      "description": "what is wrong",\n'
        '      "evidence": "exact quote from document OR explicit description of what is missing",\n'
        '      "applicable_law": "Indian statute name and section",\n'
        '      "location": "where in the document",\n'
        '      "recommendation": "how to fix it"\n'
        '    }\n'
        '  ],\n'
        '  "metrics": {\n'
        '    "critical_issues": 0,\n'
        '    "warnings": 0,\n'
        '    "compliant_sections": 0\n'
        '  }\n'
        '}\n\n'
        "Rules:\n"
        "- Do not output explanations outside JSON.\n"
        "- Assume state-level stamp variation unless specified.\n"
        "- Only cite Indian statutes from the provided rules context."
    )

    rules_str = ""
    for idx, ctx in enumerate(rule_contexts):
        rules_str += (
            f"--- Rule {idx + 1} ---\n"
            f"Source: {ctx.get('clause_title', 'Unknown')}\n"
            f"Law: {ctx.get('governing_law', 'Unknown')}\n"
            f"Content: {ctx.get('content', ctx.get('text', ''))}\n\n"
        )

    # Truncate document text if extremely long to fit within token limits
    max_doc_chars = 12000
    if len(document_text) > max_doc_chars:
        document_text = document_text[:max_doc_chars] + "\n\n[... document truncated for processing ...]"

    user_prompt = (
        f"=== UPLOADED DOCUMENT TEXT ===\n{document_text}\n\n"
        f"=== COMPLIANCE RULES ===\n{rules_str}\n\n"
        f"Compare the document against ONLY the rules relevant to this document type. For each issue you flag, you MUST quote the exact evidence from the document text in the 'evidence' field. Output STRICT JSON."
    )

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]
