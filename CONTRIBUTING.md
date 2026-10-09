# Contributing

Thanks for taking an interest in Spectra.

## Set up

```bash
npm ci
npm run check
```

`npm run check` runs `gscan`, the translation check and the static accessibility check. It must pass before a pull request.

Use `npm install` when intentionally updating dependencies so `package-lock.json` stays in sync.
`npm run zip` creates the installable theme archive with Node.js; it does not require a system ZIP utility.

To see the theme running, link the folder into a local Ghost install (`ln -s "$PWD" /path/to/ghost/content/themes/spectra`) and restart Ghost.

## Pull requests

Open a pull request against `main` and describe the change, the behavior affected, and how you tested it. The CI workflow runs on pull requests and checks theme compatibility, translations, static accessibility, generated documentation, and the installable theme ZIP. The `main` branch ruleset requires this check before merge.

Keep pull requests focused. Include screenshots for visual changes and update `CHANGELOG.md` under `Unreleased` for user-visible changes. Do not include secrets, member data, or production content.

Repository maintainers can import [`.github/rulesets/main-branch.json`](.github/rulesets/main-branch.json) from **Settings → Rules → Rulesets → New branch ruleset → Import a ruleset**. It targets the default branch (currently `main`), requires a pull request and the `CI / check` status check, and blocks force-pushes and branch deletion. Required approvals are set to zero so a solo maintainer can merge; raise this to one when a second maintainer is available.

## Releases

Releases use Semantic Versioning. Update `package.json` and `package-lock.json` to the same version, move the corresponding `Unreleased` changelog entries into a dated version heading, then push a matching `vX.Y.Z` tag. The Release workflow verifies the tag/version match, reruns CI and ZIP validation, and publishes `spectra.zip` to a GitHub Release. Do not create the release manually.

## Guidelines

- **No build step.** Plain CSS and small, progressive JavaScript. A page must work without JavaScript, except for the documented enhancements.
- **Design rules** are in [DESIGN.md](DESIGN.md). In short: one accent, hairlines instead of shadows, one label per intent, real data only, no em dashes in visible text.
- **Every string** goes through `{{t "..."}}` and exists in all files in `locales/`.
- **Accessibility.** Check pages you change with an engine such as axe-core, in light and dark and with a few different accents. New colour pairs must reach WCAG AA.
- If you add or change a setting, run `npm run docs` so the README and the documentation site match `package.json`.
- Keep changes focused and describe what you tested.

## Reporting bugs

Open an issue with the Ghost version, the theme version, your settings and, if possible, the page URL and a screenshot.
