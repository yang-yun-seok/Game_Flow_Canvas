# Refactoring Guide

This document records the current structure of the project and the recommended
order for the next cleanup passes.

## Current File Map

- `index.html`
  - Static markup and UI layout
  - Loads external assets only
- `styles.css`
  - All application styling
- `app-state.js`
  - Global state declarations
  - History helpers
  - Shared DOM references
  - Common helper utilities
- `app-render.js`
  - Shape catalogue
  - Node rendering
  - Edge routing and rendering
- `app-editor.js`
  - Create/select/move/delete
  - Viewport
  - Editing interactions
- `app-io.js`
  - JSON import/export
  - Capture/export helpers
  - Reset flows
- `app-analysis.js`
  - Validation
  - Shortcut system
  - Pseudocode/code review
  - Logic trace
- `app-shell.js`
  - Demo generation
  - Sheet system
  - Tooltip engine
  - App bootstrap
- `.github/workflows/deploy-pages.yml`
  - GitHub Pages deployment workflow

## Current Runtime Map

The runtime is now split by responsibility, but the files still share global
state through classic script loading.

1. `app-state.js`
2. `app-render.js`
3. `app-editor.js`
4. `app-io.js`
5. `app-analysis.js`
6. `app-shell.js`

## Recommended Next Extraction Order

Keep each step behavior-preserving. Avoid changing feature logic and structure
in the same pass.

1. Convert shared globals into one explicit app state object.
2. Reduce cross-file DOM lookups and centralize shell-owned UI wiring.
3. Isolate shortcut persistence from validation/trace tools.
4. Separate mode-specific behavior from generic canvas/editor logic.
5. Move from classic script globals to ES modules only after the above is stable.

## Refactor Guardrails

- Preserve script execution order.
- Prefer mechanical extraction over logic rewrites.
- Keep classic script loading unless a module migration is intentional.
- Do not rename data fields during structural cleanup.
- Only change one architectural dimension at a time.

## Suggested Done Criteria For The Next Pass

- Shared mutable state is explicit rather than implicit globals.
- Cross-file dependencies are documented or reduced.
- Mode-specific code is easier to locate and extend.
- README stays aligned with the actual file layout.
