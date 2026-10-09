# Contributing

Thanks for taking an interest in Spectra.

## Set up

```bash
npm install
npm run check
```

`npm run check` runs `gscan`, the translation check and the static accessibility check. It must pass before a pull request.

To see the theme running, link the folder into a local Ghost install (`ln -s "$PWD" /path/to/ghost/content/themes/spectra`) and restart Ghost.

## Guidelines

- **No build step.** Plain CSS and small, progressive JavaScript. A page must work without JavaScript, except for the documented enhancements.
- **Design rules** are in [DESIGN.md](DESIGN.md). In short: one accent, hairlines instead of shadows, one label per intent, real data only, no em dashes in visible text.
- **Every string** goes through `{{t "..."}}` and exists in all files in `locales/`.
- **Accessibility.** Check pages you change with an engine such as axe-core, in light and dark and with a few different accents. New colour pairs must reach WCAG AA.
- If you add or change a setting, run `npm run docs` so the README and the documentation site match `package.json`.
- Keep changes focused and describe what you tested.

## Reporting bugs

Open an issue with the Ghost version, the theme version, your settings and, if possible, the page URL and a screenshot.
