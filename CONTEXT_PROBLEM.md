# The Context Problem: Why GEAkr Matters for HC Teams

## The Problem We Solve

### The Context Problem

**In a government environment (Health Canada), teams face a fundamental challenge:**

When someone in your team—an analyst, architect, policy maker, or developer—works on a project, they need to answer questions like:

- "How does this decision affect our cloud architecture?"
- "What have other teams learned about this technology?"
- "Are there compliance implications I'm missing?"
- "What's our institutional knowledge on this domain?"

**Without GEAkr, the answer is always the same:** Dig through Slack, emails, wikis, scattered documents, and meeting notes. Context is fragmented across systems, people, and time. You can't ask "what does our organization know about Kubernetes?" and get a coherent answer.

**With limited time and many competing priorities, critical institutional knowledge is lost, rediscovered, or contradicted.**

### Why This Matters in Government

Health Canada (and any government organization) has unique constraints:

1. **Compliance Requirements**
   - You MUST know who accessed what data, when, and why
   - You MUST be able to reconstruct decisions months later for audits
   - You CANNOT trust untracked, unaudited knowledge systems

2. **Data Classification**
   - Some information is public
   - Some is internal (work-in-progress)
   - Some is personal or sensitive
   - These categories must flow through every operation

3. **Team Isolation**
   - Different teams have different clearances
   - A security team's knowledge ≠ a communications team's knowledge
   - But teams MUST be able to share across boundaries when appropriate

4. **Institutional Knowledge Decay**
   - When people leave, knowledge leaves with them
   - Decisions made years ago are forgotten
   - The same mistakes get remade in different teams

## Why Existing Solutions Don't Work

### The Naive Approach: "Just use Slack/Confluence"
- **Problem**: No audit trail. You can't prove who knew what, when.
- **Problem**: Data classification isn't enforced. Sensitive info mixes with public.
- **Problem**: Search is keyword-based, not semantic. "Kubernetes networking" returns everything with those words.
- **Problem**: No policy gates. Any authenticated user can see any document.
- **Problem**: Compliance teams can't generate audit reports.

### The Black-Box LLM Approach: "Just ask ChatGPT"
- **Problem**: No institutional context. ChatGPT hallucinates about HC policies.
- **Problem**: No audit trail. When a decision goes wrong, you can't explain HOW it was made.
- **Problem**: Data classification isn't enforced. You could accidentally send sensitive HC data to OpenAI.
- **Problem**: No policy control. Analysts in the public-facing team shouldn't access security team documents.
- **Problem**: Expensive and unreliable for specialized government domains.

### The Hybrid Approach: "RAG + LLM"
- **Better**: You can ground answers in organizational documents.
- **Better**: You can audit which documents were retrieved and by whom.
- **But still broken**: If you don't have policy enforcement, data classification, and team boundaries.

## Why GEAkr Solves This

GEAkr is a **modular, government-compliant knowledge system** that:

### 1. Establishes Control & Trust
- **Control Plane**: Every operation is policy-gated (metadata_only, local_only, external_api_public_only, approved_enterprise)
- **Policy Enforcement**: Runtime mode determines what data you can access
- **Audit Trail**: WHO did WHAT, WHEN, with WHICH data, using WHICH LLM

### 2. Preserves Data Classification
- Documents are classified: public, work, personal
- Policy modes enforce classification boundaries:
  - `metadata_only` → No KB access (pure metadata analysis)
  - `external_api_public_only` → Only public documents via OpenAI
  - `approved_enterprise` → Work + public via Claude (more capable)
- Classification flows through retrieval → policy enforcement → audit log

### 3. Enables Team Isolation Without Breaking Collaboration
- Teams have separate knowledge bases
- Specific documents can be marked "work" (team-only) or "public" (organization-wide)
- Policy gates ensure a metadata_only user can't accidentally query work documents
- Audit trail shows exactly who tried to access what, and whether it was allowed

### 4. Creates Institutional Memory
- When a decision is made, it's logged:
  - "Decided to use Kubernetes because: [linked documents]"
  - "Policy gate checked classification:work, mode:approved_enterprise → ALLOW"
  - "Retrieved 3 similar past decisions, 1 blocked by classification"
- Years later: "Why did we choose Kubernetes?" → Audit shows the context

### 5. Provides Compliance-Ready Audit Trails
Government auditors ask: "Prove this decision was sound and authorized."

GEAkr answers:
```
Audit Entry:
- WHO: alice@hc.ca
- WHAT: Retrieved "Kubernetes for HC systems" (classification: work)
- WHEN: 2026-04-27 14:35:00 UTC
- WHERE: Team=platform, Mode=approved_enterprise, Policy=ALLOW
- WHY: "Need context for cloud architecture decision"
- EVIDENCE: 4 documents retrieved, 1 blocked (classification:personal)
```

### 6. Supports Multi-LLM Strategy
- Teams can choose their LLM per policy mode
- `external_api_public_only` → Use cheaper OpenAI (public docs only)
- `approved_enterprise` → Use more capable Claude (can access work docs)
- Local-only teams → Use self-hosted Ollama (zero external API calls)
- Audit shows which LLM was used for which query

## The Team Value Proposition

### For Analysts & Decision-Makers
- **Before**: Spend hours searching Slack, emails, old wikis for context
- **After**: "Summarize our past decisions on cloud migration" → Get grounded, cited evidence from organizational documents
- **Trust**: Audit trail proves the system used only appropriate, authorized documents

### For Security/Compliance Teams
- **Before**: Can't audit how decisions were made. Hoping people followed procedures.
- **After**: Complete audit trail. "Show me every query that accessed this sensitive document." ✓
- **Confidence**: Data classification is enforced by policy gates, not trust

### For Team Leads
- **Before**: Knowledge scattered. New team members rediscover problems solved 2 years ago.
- **After**: "What have we learned about Kubernetes?" → Get institutional knowledge in 10 seconds
- **Scalability**: Knowledge compounds. Each decision adds to the organizational memory.

### For Architects
- **Before**: "We decided to use X" → Why? When? What was the trade-off? Lost to time.
- **After**: Full decision context with audit trail. Institutional learning actually happens.

### For Developers & Technical Teams
- **Before**: "How did team X solve this?" → Ask them, hope they remember, hope it's relevant
- **After**: "Find solutions similar to ours" → RAG retrieves semantic matches from org docs
- **Efficiency**: Reduce duplicated work. Learn from others' experience.

## Why Now? Why This Approach?

### The Problem Was Getting Urgent

1. **AI is changing how we work**
   - Teams want to use LLMs for analysis, generation, decision support
   - But: uncontrolled LLM access = data leakage risk in government
   - GEAkr is the **policy layer** that makes LLMs safe for HC

2. **Compliance is tightening**
   - Access to AI tools requires audit trails
   - Data classification must be enforced, not assumed
   - GEAkr provides the **compliance foundation**

3. **Teams are isolated**
   - Security team, comms team, tech team work independently
   - Knowledge doesn't flow between them
   - GEAkr enables **controlled cross-team learning**

### Why a Modular Architecture?

Government environments are complex:
- Different teams, different compliance levels
- Some use public APIs, some require local-only solutions
- Some need advanced LLMs, some just need metadata analysis
- Team composition changes; systems must be maintainable

GEAkr's modularity means:
- **Control Plane**: Enforces policy consistently across all operations
- **LLM Adapter**: Swap providers without touching policy logic
- **RAG Module**: Add, improve, or replace semantic search independently
- **Policy Gate**: Update rules without redeploying everything
- **Audit Layer**: Compliance checks work independently
- **Plugin System**: Teams add custom analysis tools without core changes

## What This Enables Long-Term

### Month 1-3: Baseline Value
- Teams can ask semantic questions of organizational documents
- Audit trail proves compliance
- Data classification is enforced

### Month 3-6: Institutional Learning
- Teams recognize patterns across projects
- "We've solved this before" becomes detectable
- Decision rationales are preserved

### Month 6-12: Knowledge Compounds
- "Show me everything related to X" returns richer, deeper answers
- Teams make faster decisions with full context
- New team members onboard with instant institutional knowledge

### Year 2+: Strategic Advantage
- Compliance audits are trivial (complete audit trails exist)
- Technology decisions are traceable to their original context
- Knowledge doesn't leave when people do

## The Risk We're Addressing

**Without GEAkr (or something like it), government teams face:**

1. **Compliance Risk**: "We can't audit how this decision was made" = liability
2. **Operational Risk**: "We forgot we tried this 3 years ago" = wasted effort
3. **Security Risk**: "We exposed sensitive data to ChatGPT" = incident
4. **Knowledge Risk**: "When Sarah left, we lost all the Kubernetes context" = fragility

**With GEAkr:**
- Every decision is traceable and auditable
- Organizational memory grows, not decays
- Data classification is mechanically enforced
- Teams can safely use AI for analysis and generation

## Conclusion

The context problem isn't new—government teams have always struggled to access institutional knowledge. But **AI makes it urgent and solvable**.

GEAkr isn't just a search tool or an LLM interface. It's a **policy-enforced, audit-compliant, modular knowledge system** designed for government teams that:

1. **Need to prove** every decision was sound and authorized
2. **Need to preserve** institutional knowledge across turnover
3. **Need to scale** AI safely without exposing sensitive data
4. **Need to move fast** while maintaining compliance

For Health Canada and teams like yours, GEAkr solves the context problem while respecting the constraints government actually operates under.
