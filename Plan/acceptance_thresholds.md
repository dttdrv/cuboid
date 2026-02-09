# Cuboid Overhaul Acceptance Thresholds

## Gate-wide scoring model
- Visual consistency: 0-5
- Functional correctness: 0-5
- Security posture: 0-5
- Prism parity progress: 0-5

## Pass criteria by gate
- Gate A: minimum 4 in visual consistency, no `rounded-` classes in UI files, no ad-hoc hex colors in UI class strings.
- Gate B: minimum 4 in visual consistency and functional correctness for `Dashboard` and `EditorPage` flows.
- Gate C: minimum 4 in visual consistency across auth/workspace/modals/shared components.
- Gate D: minimum 4 in functional correctness and reliability for auth/data/compile/AI service boundaries.
- Gate E: minimum 4 in security posture, with high-severity findings closed or explicitly accepted with rationale.
- Gate F: minimum 4 in Prism parity progress with clear status tags for each parity item.

## Operational constraints
- Local-first runtime remains mandatory.
- Cloud parity work is represented as adapters/contracts/stubs only unless explicitly upgraded later.
- Tooling note: build/test are runnable in current shell via explicit Node PATH override; browser automation evidence is still required for final gate closure.
