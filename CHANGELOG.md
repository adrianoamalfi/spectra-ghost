# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Documentation site (GitHub Pages) in `docs/`, with 33 screenshots and an accent picker that recolours the page with the theme's own colour model.
- `scripts/screenshots.mjs` (screenshots through Chrome's DevTools protocol) and `scripts/docs-settings.mjs` (settings tables generated from `package.json`); CI checks that the generated tables are current.

### Security
- Pin `handlebars` to 4.7.10 through npm `overrides` (development dependency of `gscan`).

## [0.2.0] - 2026-10-09

First feature-complete release.

### Added
- Colour system generated in OKLCH from one accent, in light and dark, with an AA-safe fill and ink.
- Four hero styles (Featured, Masthead, Statement, Index) using the publication cover, topics and featured post.
- Two footers (Colophon, Signoff) with secondary navigation, X and Facebook accounts, RSS, recommendations and a donations button.
- Bento, Grid and List feeds with container-query tiles, infinite scroll and an optional featured slider.
- Reading experience: table of contents with scroll-spy, share row, previous and next post, breadcrumbs with structured data, reading progress, heading anchors, code copy, image lightbox, scrollable tables, lazy comments.
- Header with a mobile menu and a system / light / dark switch applied before first paint.
- Page templates: Landing, Archive, Membership, Newsletter.
- Subscribe section, a single call to action for gated posts, empty states and a back-to-top button.
- Cross-document View Transitions between tiles and articles.
- Author photo and name on cards and posts, with a three-way setting.
- Seven languages: en, it, de, es, fr, pt, nl.
- Print stylesheet.
- `npm run check`: gscan, translation and static accessibility checks, plus a CI workflow.

### Changed
- Display type is Bricolage Grotesque; interface and prose are Instrument Sans (true italics).
- Koenig cards painted with the raw accent now use the AA-safe fill and ink.

## [0.1.0]

- Initial neutral scaffold.
