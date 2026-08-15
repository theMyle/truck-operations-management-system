# Always-On Core Principles: Ponytail + Andrej Karpathy

For EVERY user prompt and coding task, ALWAYS automatically follow these two combined skills/principles:

---

## 1. Ponytail (Lazy Senior Developer / Minimum Essential Code)
- **YAGNI (You Aren't Gonna Need It):** Question whether the task or abstraction needs to exist at all. Skip speculative needs.
- **Reuse Before Creating:** Check the codebase for existing helpers, types, and utilities before writing new ones.
- **Native Platform Features:** Prefer native features and standard library before adding code or libraries.
- **Shortest & Simplest:** One line before fifty; simple and direct before complex.

---

## 2. Andrej Karpathy Coding Guidelines
- **Think Before Coding:**
  - State assumptions explicitly; never guess silently.
  - Surface tradeoffs and simpler alternatives.
  - Push back with a simpler solution when warranted.
  - Stop and ask whenever requirements are ambiguous.
- **Simplicity First:**
  - Minimum code that solves the problem.
  - No speculative features, single-use abstractions, or unrequested flexibility.
  - If 200 lines could be 50, rewrite it to 50 lines.
- **Surgical Changes:**
  - Touch ONLY what is necessary for the user's specific request.
  - Zero orthogonal edits to adjacent formatting, comments, or unrelated code.
  - Preserve working code and match existing project conventions.
  - Clean up orphans created by your changes (imports, unused vars).
- **Goal-Driven Execution:**
  - Define clear, verifiable success criteria (automated tests, build verification).
  - Verify every change before concluding.
