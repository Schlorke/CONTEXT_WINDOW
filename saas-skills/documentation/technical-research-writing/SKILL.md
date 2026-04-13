---
name: technical-research-writing
description: Procedural guide for conducting technical research and writing high-quality reports following international standards, covering research question formulation, systematic source collection, evidence evaluation (CRAAP Test), synthesis methodology, citation systems, report architecture, and epistemic differentiation.
metadata:
  author: SaaS Skills Library
  version: 1.0
  last_validated: "2026-04-12"
  sources:
    - "William Booth, Gregory Colomb, Joseph Williams - The Craft of Research"
    - "Kate Turabian - A Manual for Writers"
    - "CRAAP Test (Meriam Library, California State University)"
    - "ISO 690:2021 - Information and documentation — Guidelines for bibliographic references"
    - "ISO 5966:2020 - Information and documentation — Presentation of scientific and technical reports"
---

# When to Use This Skill

Use this skill when:

- Writing technical reports, whitepapers, or research documents
- Conducting literature reviews or background research
- Evaluating source credibility for a technical topic
- Structuring research-driven documentation
- Applying citation standards (APA, IEEE, Chicago)
- Reviewing research methodology or evidence quality
- Synthesizing findings from multiple sources
- Establishing research question scope and specificity

**Triggers:** technical report, research methodology, literature review, CRAAP test, source evaluation, citation, technical writing, evidence hierarchy, synthesis, research question, background research, whitepapers.

## Core Workflow

### 1. Formulate a Precise Research Question

The research question determines everything that follows. Weak questions lead to unfocused research.

#### Characteristics of Strong Questions

- **Specific:** Narrow enough to answer thoroughly, broad enough to be interesting
- **Answerable:** Evidence exists to address it; not purely philosophical
- **Scoped:** Clear boundaries (technology, time period, use case)
- **Relevant:** Addresses a real problem or gap

#### Examples

❌ Weak: "How does React work?"
✓ Strong: "What are the performance trade-offs of Server Components vs. Client Components in Next.js 14 for data-heavy dashboards (>5K rows)?"

❌ Weak: "What is cloud security?"
✓ Strong: "How do container isolation mechanisms (cgroups, namespaces) compare to VM-based isolation for compliance with SOC 2 Type II requirements?"

❌ Weak: "Why is AI important?"
✓ Strong: "What is the latency overhead of RAG-based retrieval in LLM applications when using vector databases vs. traditional full-text search for legal document discovery?"

Spend 20% of research time refining the question.

### 2. Create a Systematic Source Collection Strategy

#### Breadth-first approach

- Start broad (web search, documentation overview)
- Progressively narrow based on patterns
- Minimum 10 independent sources per research question

#### Source discovery sequence

1. Official documentation (if evaluating a product)
2. Academic/peer-reviewed literature (major papers)
3. Industry standards documents (RFCs, ISO specs)
4. Technical books by recognized experts
5. Conference presentations and recorded talks
6. Well-maintained blog posts and tutorials
7. Community discussions (Stack Overflow, forums)
8. AI-generated summaries (only as starting point; always verify)

#### Search strategy

- Use 3-5 different search terms (synonym variation)
- Track which sources are cited by multiple authors (indicates importance)
- Search publication dates: for fast-moving topics, prefer last 2 years; for fundamental concepts, include classic papers
- Document your search process so work is reproducible

### 3. Evaluate Every Source with CRAAP Test

Before using a source, apply the CRAAP Test to assess reliability:

**Currency:** When was it published? Is it current for your topic?

- Fast-moving domains (AI, web frameworks): prefer last 12 months
- Foundational concepts (algorithms, databases): older is acceptable if peer-reviewed
- Look for updates; single version might be outdated

**Relevance:** Does it directly answer your research question?

- Does the source address your specific use case or industry?
- Is it at the right technical depth (not oversimplified, not overly specialized)?
- Reject sources that are tangentially related but don't address core question

**Authority:** Who wrote this? What are their credentials?

- Academic authors: university affiliation, publication record
- Corporate/product sources: does the company make this product? (disclosed interest)
- Practitioners: do they work in this domain? for how long?
- Unknown author = significant credibility penalty unless peer-reviewed

**Accuracy:** Is the information supported by evidence?

- Are claims backed by citations or references?
- Does it cite opposing viewpoints?
- Has it been peer-reviewed or fact-checked?
- Can you verify key claims independently?

**Purpose:** Why was this published? What bias might exist?

- Informational: educational or neutral
- Promotional: selling a product or viewpoint
- Political/advocacy: advancing a particular position
- Disclosure of bias doesn't disqualify a source; undisclosed bias does

**Score:** Each dimension gets 1 (weak) to 5 (strong). Sources averaging <3 should be rejected or used only to acknowledge an opposing viewpoint.

### 4. Organize Sources by Taxonomy

Categorize your sources to ensure balanced coverage:

#### Academic Sources

- Peer-reviewed journal articles
- Conference proceedings (top venues: CHI, OSDI, ICML, OOPSLA)
- Doctoral dissertations
- Technical reports from research institutions

#### Corporate/Official Sources

- Product documentation
- Company engineering blogs (if by company employees)
- Standards specifications (RFC, ISO, W3C)
- Whitepapers from companies

#### Technical References

- Published technical books (O'Reilly, Manning, Addison-Wesley)
- Official language specifications
- RFC documents
- Protocol specifications

#### Community Sources

- Blog posts by recognized practitioners
- Conference talks (recorded, speaker identified)
- Open-source project documentation
- Technical forums (Stack Overflow, Reddit /r/programming)

Avoid relying on a single source type. Triangulate: if only marketing materials support a claim, you haven't validated it. If only one blog post mentions it, find independent confirmation.

### 5. Extract and Synthesize Findings

Extract key findings per source without evaluating yet:

| Source              | Main Claim                             | Supporting Evidence             | Caveats                           |
| ------------------- | -------------------------------------- | ------------------------------- | --------------------------------- |
| Smith et al. (2024) | Server Components reduce JS bundle 40% | Benchmark on 3 real apps        | Assumes SSR-friendly architecture |
| NextJS Docs v14     | "Out-of-the-box streaming"             | Feature listed in release notes | No performance data provided      |

After extracting, organize by **theme**, not by source:

#### Theme: Bundle Size Impact

- Smith et al. claim 40% reduction; benchmarked on 3 production apps
- Next.js docs claim streaming support but no quantified metrics
- ClientComponent analysis shows ~15% reduction in simple cases

This approach reveals: (1) what is well-established, (2) what is disputed, (3) what has no evidence yet.

### 6. Differentiate Epistemic Status of Claims

Label every significant claim with its epistemic status. This prevents readers from mistaking informed opinion for established fact:

#### (a) Established Fact

- Peer-reviewed research, multiple independent replications
- Industry-wide consensus (e.g., "SQL requires ACID transactions")
- Specification documents
- Example phrase: "PostgreSQL implements MVCC at the engine level, which enables..."

#### (b) Expert Consensus

- Most authoritative sources agree
- Minor dissent exists but is acknowledged
- Industry standards (e.g., "REST is the dominant web API pattern")
- Example phrase: "Leading database researchers recommend indexing on foreign keys because..."

#### (c) Informed Opinion

- Well-reasoned interpretation of available evidence
- Author has relevant expertise
- Alternative interpretations exist
- Example phrase: "Based on the evidence, Server Components likely improve developer experience because they reduce client-side state management complexity, though long-term productivity gains remain unmeasured."

#### (d) Emerging Trend

- Early signals, not yet confirmed
- Fewer than 3 independent sources
- Might change as more evidence emerges
- Example phrase: "Some practitioners report that AI-assisted code review catches 20% more bugs (early stage; limited data)."

### 7. Structure the Research Report

Follow this architecture:

#### Title Page

- Title, author, date, affiliations

#### Executive Summary / Abstract

- 150-300 words
- Research question, methodology, key findings, implications
- Reader should understand conclusions without reading full report

#### Introduction

- Context: why does this question matter?
- Problem statement
- Research question explicitly stated
- Scope and limitations

#### Methodology

- How sources were selected
- Search strategy and databases
- Inclusion/exclusion criteria (which sources did you reject and why?)
- How evidence was evaluated
- This section enables reproducibility

#### Findings

- Organized by theme, not by source
- Present evidence supporting different viewpoints
- Include epistemic markers (established fact vs. informed opinion)
- Quantitative data (benchmarks, statistics) in tables/figures
- Quote directly only for key definitions or strong claims (max 1-2 per 5 pages)

#### Analysis

- Interpret findings
- Identify contradictions and explain them
- Discuss gaps in current knowledge
- Connect to original research question

#### Conclusions

- Direct answer to research question
- Implications and applications
- Limitations of this research
- Recommended next steps

**Recommendations** (optional, project-dependent)

- How to apply findings
- Policy or technical decisions informed by research

#### References

- Complete bibliography in chosen citation format
- Verify all sources are actually cited in text

#### Appendices

- Supplementary data, raw search results, excluded sources with reasons

### 8. Apply Citation Standards Consistently

Choose ONE citation format and apply consistently throughout:

#### APA (American Psychological Association)

- Used in: social sciences, psychology, education, business
- Format: (Author Year) for parenthetical citations; full citations in References
- Tool support: Zotero (free), Mendeley (free)

#### IEEE (Institute of Electrical and Electronics Engineers)

- Used in: engineering, computer science, electrical disciplines
- Format: [1], [2] numbered citations; numbered References
- Compact, good for space-constrained documents

#### Chicago (Chicago Manual of Style)

- Used in: humanities, history, some business contexts
- Format: superscript numbers or (Author Year); footnotes or endnotes
- Most formal; supports extensive supplementary notes

Pick based on your domain. If publishing in a venue (conference, journal), follow their style guide. Otherwise, APA is most universal for technical writing.

#### Citation completeness

- Journal articles: Author(s), Title, Journal, Volume(Issue), Pages, DOI
- Books: Author(s), Title, Publisher, Year, ISBN
- Websites: Author (if available), Title, URL, Access Date
- Conference: Author(s), Title, Conference Name, Location, Year

**Verification:** Before submitting, check that every citation in your References section appears in text, and every claim in text with a source has a citation.

## Advanced Cases

**Contradictory Evidence:** When sources disagree, present both viewpoints with equal epistemic weight. Example: "Smith et al. (2023) argue that Server Components reduce latency by 40%, while Chen et al. (2024) found only 8% improvement in their benchmark. The difference may stem from different workload profiles (e-commerce vs. content sites)."

**Emerging or Evolving Topics:** Label findings as "preliminary" or "early-stage." Reassess findings quarterly. Flag when new evidence contradicts earlier consensus.

**Industry vs. Academic Split:** Acknowledge when practitioners and researchers disagree. Both perspectives are valid; synthesize rather than dismissing one.

**Cross-Disciplinary Research:** When question spans multiple fields (e.g., performance optimization + cognitive load), use sources from both domains. Clearly separate which findings come from which field.

**Replicating Prior Research:** If reproducing someone else's experiment, document exactly how your methodology differs. Explain whether differences might account for divergent results.

## Fallback Clause

If critical information about a source or finding is missing:

- Output `[INFORMATION NEEDED: {specific info}]` rather than inventing data
- Examples: `[INFORMATION NEEDED: author credentials]`, `[INFORMATION NEEDED: publication date]`
- Do not estimate or guess at data (benchmark numbers, publication years, author affiliations)
- Flag these gaps in your Methodology section so readers understand the limitation
- Assign investigation tasks with clear owner and deadline

## Anti-Patterns

### Anti-Pattern 1: Cherry-Picking Sources

Including only sources that support your preferred conclusion. Discard sources that contradict you without explanation.

**Better:** Include opposing viewpoints and explain why one interpretation is more credible based on evidence quality, not preference.

#### Anti-Pattern 2: No Epistemic Differentiation

Stating opinion as fact. Presenting emerging research as established consensus.

**Better:** Label claims clearly. "We don't yet know..." is honest; "X researchers found..." is specific.

#### Anti-Pattern 3: Plagiarism (Accidental)

Paraphrasing without citation. Using a source's structure without attribution.

**Better:** Cite the source even when paraphrasing. When in doubt, cite. Quotation marks for exact text.

#### Anti-Pattern 4: Single Source Type

All sources are blog posts, or all are academic papers. No triangulation.

**Better:** Intentionally balance academic, corporate, and community sources. If one type dominates, explain why.

#### Anti-Pattern 5: Outdated Sources for Fast-Moving Topics

Citing a 2019 paper about JavaScript frameworks as current evidence.

**Better:** For fast-moving domains, prefer sources <2 years old. Explicitly note when citing older work, and explain why (foundational, historical context).

#### Anti-Pattern 6: Marketing Language in Technical Reports

"Revolutionary," "industry-leading," "cutting-edge" without evidence.

**Better:** Use neutral, descriptive language. "20% faster than the previous version" not "dramatically faster."

#### Anti-Pattern 7: Missing Methodology Section

Readers can't tell how sources were selected or how evidence was evaluated.

**Better:** Include Methodology section explaining search strategy, inclusion criteria, and evaluation process.

## Enforcement

This skill is MANDATORY and must be followed without exception when its trigger fires. Specifically:

- Every research report must include an explicit, documented research question before source collection begins
- Every source used must pass the CRAAP Test (documented scoring provided in appendix if space permits)
- Every significant claim must be attributed to a source with a complete citation
- Every claim must be labeled with its epistemic status (established fact / expert consensus / informed opinion / emerging trend)
- Methodology section is non-optional and must describe search strategy and evaluation criteria
- Sources must be balanced across taxonomy (not all blogs, not all academic papers)
- All contradictions between sources must be explicitly acknowledged, not hidden
- The report structure must follow the architecture in Section 7 (title, abstract, introduction, methodology, findings, analysis, conclusions)

## Source References

- William Booth, Gregory Colomb, Joseph M. Williams. _The Craft of Research_. 4th ed., University of Chicago Press, 2016. — Classic guide to research methodology for all disciplines.
- Kate L. Turabian. _A Manual for Writers of Research Papers, Theses, and Dissertations_. 9th ed., University of Chicago Press, 2018. — Comprehensive citation and style guide (Chicago format).
- California State University, Chico. "CRAAP Test" — <https://www.csuchico.edu/lins/handouts/evaluating_websites.pdf>
- ISO 690:2021. _Information and documentation — Guidelines for bibliographic references and citations of information resources_ — International standard for citation and bibliography.
- ISO 5966:2020. _Information and documentation — Presentation of scientific and technical reports_ — International standard for report structure and formatting.
- APA Publications. _Publication Manual of the American Psychological Association_. 7th ed., 2020 — Official APA citation guide.
- IEEE. _IEEE Standard for Information Technology - Preparation of Papers and Reports for Publication in IEEE Transactions, Journals, and Magazines_ (IEEE 802.3) — Official IEEE citation guide.
