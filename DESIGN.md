# Design system

Spectra is a typographic, content-first theme. It does not depend on photography to look finished: structure, type and a single accent carry the page.

## Principles

1. **One accent.** Everything is derived from the accent set in Ghost Admin. Tiles vary in depth of that one hue, never in hue. A secondary accent exists only for text selection and link underlines.
2. **Generated contrast.** Surfaces, ink, borders and tints are computed in OKLCH from the accent (relative colour syntax and `light-dark()`). The solid accent fill is nudged out of the lightness band where neither white nor black ink reaches AA, and the ink is chosen from the fill. Koenig cards that Ghost paints with the raw accent are remapped to the same fill.
3. **Hairlines, not shadows.** Depth comes from tint and 1px rules. There are no drop shadows.
4. **Type hierarchy from weight and width, not raw size.** Display type is Bricolage Grotesque (weight, width and optical-size axes); interface and prose are Instrument Sans, which has true italics.
5. **One label per intent.** The subscribe action is called the same everywhere on a page.
6. **Calm motion.** Short ease-out transitions on hover and focus, a one-off entrance on hero tiles, scroll-linked reveals where supported. Nothing loops. `prefers-reduced-motion` turns it off.
7. **Real data only.** Heroes and footers use the site's own title, description, topics, counts, featured post, navigation and cover. Nothing is invented.

## Tokens

| Token | Role |
| --- | --- |
| `--accent` | The accent from Ghost Admin (default `oklch(0.55 0.22 295)`) |
| `--color-bg`, `--color-surface`, `--color-fg`, `--color-muted`, `--color-border` | Surfaces and ink, derived from `--accent` |
| `--accent-ink` | Accent as text or line, lightened or darkened per scheme |
| `--accent-fill`, `--color-on-accent` | AA-safe solid fill and the ink on it |
| `--accent-2` | Secondary accent (selection, link underlines) |
| `--radius-tile`, `--radius-media`, pill | Shape lock: tiles, media and blocks, interactive controls |
| `--font-heading`, `--font-body`, `--font-prose` | Ghost's custom fonts win when set in Admin |

## Shape lock

Tiles use `--radius-tile` (1.25 to 1.75rem). Images, code blocks and cards inside content use `--radius-media` (1rem). Buttons, chips, the header, the scheme switch and icon buttons are full pills. No other radii.

## Layout

- Container 76rem; reading column 42rem; the content grid lets Koenig cards break out to wide and full width.
- Tiles are CSS containers: headings change size, width and weight with their own width (container queries), so the same tile works as a feature or as a small card.
- Mobile first. The header is a single row with a menu button below 48rem.

## Do not

- Add a second hue, gradient text, neon glows, mesh backgrounds or decorative pills on photos.
- Use em dashes in visible text.
- Add a label above every section (eyebrows are rationed: one in the hero and one per article).
- Ship a button whose text does not reach AA on its fill.
