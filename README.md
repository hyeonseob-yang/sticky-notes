# Sticky Notes

A single-page sticky notes app: create notes by dragging on the canvas, move and
resize them by dragging, edit their text, and delete them by dragging onto the
trash zone.

## Setup

Requires Node 20+.

```bash
npm install
npm run dev
```

Then open the printed local URL (typically http://localhost:5173).

Other commands:

```bash
npm test    # run the unit/component test suite (Vitest + React Testing Library)
npm run build   # type-check and produce a production build in dist/
npm run lint    # ESLint
```

## Features

- Create a note by clicking and dragging on the canvas.
- Move a note by dragging it; resize it by dragging its bottom-right corner handle.
- Delete a note by dragging it onto the trash zone (bottom-right); the trash
  highlights while a note is over it.
- Edit a note's text by double-clicking it and clicking away (or tabbing) to commit.
  While editing, a note grows taller to fit overflowing text and never shrinks
  below its manually set size.
- Notes come in one of five colors, assigned in rotation as they're created.
- Clicking or dragging a note brings it to the front of the stack.
- Notes persist to `localStorage` and are restored on page load.

## Architecture

The app is a single `App` component that owns all note state (an array of
`{ id, x, y, width, height, text, color, z }` objects) and a running
z-index counter, and persists that state to `localStorage` on every change.
It renders a `Canvas` (a full-viewport surface that turns a click-and-drag
gesture into a new note), a `NoteCard` per note, and a `TrashZone`. All
callbacks (move, resize, edit, activate, delete) flow up to `App`, which is
the single place that mutates note state — the components themselves are
stateless aside from ephemeral UI state like "am I currently in edit mode."

Dragging is centralized in one hook, `useDrag`, used by `Canvas` (create),
and `NoteCard` (move and resize). It wraps pointer events and pointer
capture, distinguishes an intentional drag from a click via a small movement
threshold, and reports deltas relative to the drag's start point. For
responsiveness, `NoteCard` mutates its own DOM node directly (via a ref) to
show live movement/resizing during a drag, and only commits the final
position or size back into React state once the drag ends — this avoids a
re-render of the whole note list on every pointer-move event. Trash-zone
deletion works by comparing the live pointer position against the trash
zone's bounding rect during a move; the note is deleted instead of
repositioned if it's released while over the trash.

Pure geometry logic (normalizing a drag into a rect, clamping to a minimum
size, clamping to bounds, rect/point intersection tests) lives in
`src/utils/geometry.ts` and is unit-tested independently of any component.

## Decisions and trade-offs

- **Hand-rolled dragging over a library**: the task explicitly asks for this,
  and a single `useDrag` hook covering create/move/resize kept the three
  interactions consistent rather than each being bespoke.
- **Trash hit-testing by pointer position, not full rect intersection**:
  simpler to reason about and implement correctly, and matches how a user
  actually judges "is this over the trash" — by where the cursor is, not by
  the note's full bounding box.
- **Bring-to-front, localStorage persistence, and colors as bonus features**:
  chosen because they meaningfully round out the interaction model without
  large added complexity within the time box; a mocked REST API sync and
  full keyboard-driven move/resize were left out.

## What I'd do with more time

- Keyboard support for moving/resizing/deleting notes (currently pointer-only).
- A color picker on each note instead of colors only being assigned at creation.
- Debounce the localStorage writes instead of writing on every state change.
- A mocked async REST API layer (with loading/error states) as an alternative
  or addition to localStorage persistence.
- Snapping/alignment guides when moving notes near each other or the canvas edges.
