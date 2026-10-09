#!/usr/bin/env node
/* Regenerates the settings tables in README.md and docs/index.html from package.json, between the
   <!-- settings:start --> and <!-- settings:end --> markers, so the documentation cannot drift. */
import { readFileSync, writeFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const settings = pkg.config.custom;
const labels = {
    color_scheme: 'Colour scheme', header_style: 'Header layout', footer_text: 'Footer line', footer_style: 'Footer style',
    show_hero: 'Show hero', hero_style: 'Hero style', hero_eyebrow: 'Hero greeting', post_feed_style: 'Feed layout',
    show_featured_slider: 'Featured slider', personal_hero_headline: 'Statement headline', personal_hero_text: 'Statement line',
    cta_headline: 'Subscribe headline', cta_text: 'Subscribe line', show_reading_time: 'Reading time',
    show_author_meta: 'Author on posts and cards', show_toc: 'Table of contents', show_reading_progress: 'Reading progress bar',
    show_related_posts: 'Related posts', secondary_accent: 'Secondary accent',
};
const groups = { General: [], Homepage: [], Post: [] };
const groupName = { homepage: 'Homepage', post: 'Post' };
for (const [key, s] of Object.entries(settings)) {
    const values = s.type === 'select' ? `${s.options.join(' / ')} (default: ${s.default})`
        : s.type === 'boolean' ? `On / Off (default: ${s.default ? 'on' : 'off'})`
        : s.type === 'color' ? `Colour (default: ${s.default})` : 'Text';
    groups[groupName[s.group] || 'General'].push({ key, label: labels[key] || key, values, note: s.description || '' });
}

const markdown = Object.entries(groups).map(([g, rows]) =>
    `\n### ${g}\n\n| Key | Setting | Values | Notes |\n| --- | --- | --- | --- |\n` +
    rows.map((r) => `| \`${r.key}\` | ${r.label} | ${r.values} | ${r.note} |`).join('\n') + '\n').join('');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const html = Object.entries(groups).map(([g, rows]) =>
    `<h3>${g}</h3>\n<div class="table-wrap"><table>\n<thead><tr><th>Key</th><th>Setting</th><th>Values</th><th>Notes</th></tr></thead>\n<tbody>\n` +
    rows.map((r) => `<tr><td><code>${r.key}</code></td><td>${esc(r.label)}</td><td>${esc(r.values)}</td><td>${esc(r.note)}</td></tr>`).join('\n') +
    '\n</tbody></table></div>').join('\n');

const inject = (file, body) => {
    const src = readFileSync(file, 'utf8');
    const re = /(<!-- settings:start -->)[\s\S]*?(<!-- settings:end -->)/;
    if (!re.test(src)) throw new Error(`${file}: settings markers not found`);
    writeFileSync(file, src.replace(re, `$1\n${body}\n$2`));
    console.log('updated', file);
};
inject('README.md', markdown);
inject('docs/index.html', html);
