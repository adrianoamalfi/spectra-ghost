#!/usr/bin/env node
/* Static accessibility invariants for the templates. A fast first line of defence: it does not
   replace testing the rendered pages with axe-core. */
'use strict';
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const skip = new Set(['node_modules', '.git', '.github', 'assets', 'locales', 'scripts']);

function templates(dir, out) {
    out = out || [];
    fs.readdirSync(dir, { withFileTypes: true }).forEach(function (e) {
        if (skip.has(e.name)) return;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) templates(p, out);
        else if (e.name.endsWith('.hbs')) out.push(p);
    });
    return out;
}

const rules = [
    { name: '<img> without alt', tag: /<img\b[^>]*>/gs, ok: /\balt=/ },
    { name: 'lazy <img> without width', tag: /<img\b(?=[^>]*\bloading="lazy")[^>]*>/gs, ok: /\bwidth=["'][^"']+["']/ },
    { name: 'lazy <img> without height', tag: /<img\b(?=[^>]*\bloading="lazy")[^>]*>/gs, ok: /\bheight=["'][^"']+["']/ },
    { name: '<button> without type', tag: /<button\b[^>]*>/gs, ok: /\btype=/ },
    { name: 'target="_blank" without rel', tag: /<a\b[^>]*target="_blank"[^>]*>/gs, ok: /\brel="[^"]*noopener/ },
    { name: '<svg> neither hidden nor labelled', tag: /<svg\b[^>]*>/gs, ok: /aria-hidden="true"|aria-label=|role="img"/ },
    { name: '<input> without a label', tag: /<input\b[^>]*>/gs, ok: /aria-label=|\bid=/ },
    { name: '<nav> without a label', tag: /<nav\b[^>]*>/gs, ok: /aria-label=|aria-labelledby=/ },
];

let failures = 0;
templates(root).forEach(function (file) {
    const src = fs.readFileSync(file, 'utf8');
    rules.forEach(function (r) {
        for (const m of src.matchAll(r.tag)) {
            if (!r.ok.test(m[0])) {
                const line = src.slice(0, m.index).split('\n').length;
                console.error(path.relative(root, file) + ':' + line + ' ' + r.name);
                failures++;
            }
        }
    });
    if (path.basename(file) === 'default.hbs' && !/<html[^>]*\blang=/.test(src)) { console.error('default.hbs: <html> without lang'); failures++; }
});

console.log('Templates checked, ' + failures + ' problem(s).');
if (failures) process.exit(1);
