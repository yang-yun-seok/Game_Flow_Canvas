# Game_Flow_Canvas

Game flow diagram editor for beginner-friendly game design work.

## Current Features

- Multi-sheet canvas editing
- Flowchart, FSM, Behavior Tree, and Sequence Chart modes
- JSON import/export and PNG/SVG capture
- Validation, pseudocode review, and logic trace tools
- Local autosave and session restore in the browser

## Structure

- `index.html`: document markup and UI layout
- `styles.css`: application styles
- `app-state.js`: shared state, DOM references, and small helpers
- `app-render.js`: shape catalogue, node rendering, edge routing, edge rendering
- `app-editor.js`: create/select/move/delete, viewport, mouse/keyboard editing
- `app-io.js`: export/import, reset flows, capture/export helpers
- `app-analysis.js`: validation, shortcuts, pseudocode review, logic trace
- `app-shell.js`: demos, sheets, tooltips, bootstrap/init
- `.github/workflows/deploy-pages.yml`: GitHub Pages deployment workflow
- `.nojekyll`: disables Jekyll processing for static hosting safety

## Current Refactor Direction

- Keep runtime behavior unchanged while reducing file responsibility
- Use the current split as the base for the next cleanup pass:
  - state/model separation
  - mode-specific module boundaries
  - validation/trace feature extraction

## Refactor Notes

- See `docs/REFACTORING.md` for the next extraction order and guardrails.
