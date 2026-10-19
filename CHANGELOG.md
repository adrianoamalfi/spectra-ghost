# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.4.1] - 2026-10-19

A quiet release: no new features, just the small fixes that make the existing
ones feel more correct, plus a unit test suite so the next one is caught
before it ships.

### Added
- A **unit test suite** (`test/templates.test.js`, run with `npm run test:unit`
 and now part of `npm run check`): every template renders without invoking a
 helper with a bad argument, no helper call hides inside a CSS or JS comment,
 the footer recommendations partial keeps each site's full URL and escapes its
 attributes and text, and the v0.4.1 refinements below are each pinned by a
 regression test.

### Changed
- The footer's "Recommended sites" heading now uses the shared `.section-title`
 treatment instead of an all-caps eyebrow. The eyebrow was a DESIGN.md
 violation (eyebrows are rationed to the hero and one per article) and the
 only section title in the theme that did not follow the shared pattern.
- Infinite scroll now prefetches the next page 500px ahead instead of 600px, so
 readers who stop early trigger fewer requests with no visible change for those
 who scroll on.

### Fixed
- The search shortcut hint no longer reads the deprecated `navigator.platform`
 to decide between `⌘K` and `Ctrl K`; it reads the user agent instead.
- An empty tag or author archive now names the tag or author ("There are no
 posts for {name} right now.") instead of the generic "no posts" line, which
 read oddly on a page that was clearly about a specific topic or person. The
 new string is translated in all seven locales.
- The lightbox now closes on `Escape` through an explicit branch as well as the
 native `<dialog>` handler, so the behaviour is identical in every environment.

## [0.4.0] - 2026-10-14

### Added
- A **Portfolio** page template (`custom-portfolio.hbs`): the page content, then a responsive grid of project posts tagged `#portfolio` or `#project`, each with its image, excerpt and tags.
- A global keyboard shortcut for Ghost search: `⌘K` / `Ctrl+K` anywhere, or `/` when not typing, with a subtle `⌘K` hint in the header on desktop.
- A native share button in the share row, shown only where the Web Share API is supported, opening the system share sheet; the X, Facebook and copy-link buttons remain the fallback.
- A language badge on code blocks, read from the `language-*` class Ghost adds to the code, styled in the theme's monospace type.
- Dedicated styles for Markdown footnotes: superscript references that keep the line height, a hairline-separated footnotes list, a quiet back-reference, and a `:target` highlight when a footnote is jumped to.

### Changed
- The share row and reading experience now include the reader conveniences above; all new strings are translated across the seven supported locales.

## [0.3.2] - 2026-10-14

### Changed
- Bumped `actions/setup-node` to 7.1.0 and `actions/upload-artifact` to 7.0.2 in the CI and Release workflows.

## [0.3.1] - 2026-10-09

### Added
- Selectable Essay and Note post templates for long-form and short-form publishing, with documented visual examples.

### Changed
- Bumped `actions/checkout` to 7.0.1, `actions/setup-node` to 7.0.0 and `actions/upload-artifact` to 7.0.1 in the CI and Release workflows.

## [0.3.0] - 2026-10-09

### Added
- GitHub Pages documentation with 36 screenshots, an interactive accent picker, and a current-release download link.
- Scripts to capture documentation screenshots and generate settings tables from `package.json`; CI checks that the generated documentation is current.
- A GitHub Release workflow that validates tagged versions and publishes the installable theme ZIP.
- Dependabot updates for npm and GitHub Actions, plus pull request and issue templates for contributors.
- A repository ruleset that protects the default branch with required pull requests and CI checks.
- Membership pricing displays monthly and annual plans when available, with billing-specific accessible action names.
- Accessible success and error feedback for clipboard copying and infinite-scroll loading.

### Changed
- The homepage featured hero, featured slider, feed, and pagination avoid showing the same post twice.
- Dark-mode header logos are rendered monochrome white for contrast.
- Lazy-loaded card images include intrinsic dimensions and asynchronous decoding.
- `npm run zip` creates the theme archive with Node.js instead of relying on a system `zip` command.
- CI uses least-privilege permissions and immutable action references, cancels superseded runs, and validates the installable theme ZIP.

### Security
- Pin the development dependency `handlebars` to 4.7.10 through npm `overrides`.

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
