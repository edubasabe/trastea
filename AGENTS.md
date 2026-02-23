# AGENTS.md

## Project purpose
- Build a simple web app that generates a guitar chord diagram from a 6-character (or 6-token) input.
- Input order is always string `6 -> 1` (left to right in the parser and renderer).

## Input contract
- Accepted formats:
  - Compact: `2212xx`
  - Tokenized: `2 2 1 2 x x` (also supports separators like `,` `/` `-`)
- Allowed values per string:
  - `x` or `X`: muted string (do not play)
  - `0`: open string
  - integer `>= 1`: fret number
- Validation:
  - Exactly 6 values are required.
  - Any non-numeric token that is not `x` is invalid.

## Musical mapping rules
- Position `0` in the parsed array corresponds to the **6th string**.
- Position `5` corresponds to the **1st string**.
- Example `2212xx` means:
  - 6th string fret 2
  - 5th string fret 2
  - 4th string fret 1
  - 3rd string fret 2
  - 2nd string muted
  - 1st string muted

## Rendering rules (canvas)
- Use a fixed 6-string grid and 5 visible frets.
- Draw nut thicker only when the viewport starts at fret 1.
- If all fretted notes are above fret 1, shift viewport start fret to keep markers visible.
- Marker rules:
  - `x`: top `X` marker above the nut
  - `0`: open-circle marker above the nut
  - `>=1`: filled dot centered in the corresponding fret cell

## File responsibilities
- `index.html`: structure and controls.
- `styles.css`: visual system and responsive behavior.
- `app.js`: parsing, validation, mapping text, and canvas drawing.

## Design direction
- Tool-like interface (not marketing page), warm analog palette, clear instructional copy.
- Keep controls explicit and fast: input + generate + presets.
- Preserve mobile support (`single-column` layout under 840px).

## Extension guidelines
- Additions should preserve the existing parser contract.
- Prefer extending `app.js` in small pure functions:
  - `normalizePattern`
  - `getViewportFrets`
  - `drawChord`
- Candidate next features:
  - barre/cejilla support
  - finger numbers
  - PNG/SVG export
