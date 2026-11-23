# First-visit conversion UX — V0.2

## Trigger and diagnosis

First invited prospect opened the public site but did not understand how to use it and left. The site opened directly into a dense three-column engineering dashboard with controls, acronyms, tests, and assumptions. The actionable first step was not specified.

This is an **observed abandonment**, not proof of a particular reason. The design hypothesis is that task ambiguity and information overload contributed. It must be checked with real users.

## Desired first-minute experience

Without logging in, uploading data, or reading documentation:

1. **Observe baseline** — synthetic ore C, 0.80 g/t, constant-recovery hypothesis. Inspect engine-computed illustrative route comparison.
2. **Change one input** — press the prominent button that changes Au to 1.60 g/t. The same engine computes a different leading route (CIL). The user sees the recalculated route and both illustrative netbacks.
3. **Test a competing model assumption** — press the same prominent button again. Select constant-residue loss model, which conflicts with endpoint observations. **No qualified winner** must be asserted; a visible warning explains the need for additional testwork.
4. Optionally open laboratory evidence/formula trace or contact the operator about a real pilot.

The sequence must always call `evaluate(data, state)`; it must not select a route from a case-ID answer table or hardcode prices/recoveries as static UI results. No numerical engineering claim is made for any real ore. The engine baseline and lab fixtures remain unchanged.

## Required interface behaviour

- A compact **60-second quick-start** above the existing dashboard, with step buttons and one primary advancing action.
- The outcome, comparison numbers, label and warnings are rendered from the **current engine evaluation**.
- Manual edits to the ore profile, grade, availability or site constraints exit the guided narrative without reverting the edited state.
- Shared links with query parameters are preserved and not overwritten by an auto-start.
- Russian and English labels, accessible `aria-pressed` step buttons, responsive 390 px/mobile.
- Persistent disclosure: all data, tests and costs are **synthetic**; neither model is industrially qualified.
- A visible contact action links to the existing `mailto` discovery request; no extra login, CRM, tracker or backend.

## Acceptance

- Quick start is visible in the first viewport (desktop and mobile).
- Baseline computed ~32.81 USD/t heap vs ~26.29 USD/t direct CIL.
- The primary action changes grade to 1.60 g/t and switches the illustrative route leader to direct CIL.
- The next action activates the contradictory constant-residue hypothesis; the guide says **no evidence-backed leader**.
- The current ore and route panels in the underlying workspace stay in sync with the guided scenario.
- Re-clicking any step reproduces its result; unsupported options or missing data do not generate fake recommendations.
- No horizontal overflow at 390 px; no JS errors or extra network dependencies.

## How to validate actual product-market UX

Give 5 people unfamiliar with the interface the URL without explaining it. Watch (with their agreement) whether they can tell what the system does, complete the change-of-grade scenario, interpret the evidence warning, and name what a pilot would test. Record confusion points, rather than adding tracking scripts.

**Success criterion to test (not claimed yet):** at least 4/5 users complete the guided comparison unassisted and can correctly articulate the product's limitation; at least one qualified prospect asks a substantive question about a real pilot. If this fails, iterate on narrative language, not on the calculation engine.
