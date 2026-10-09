#!/usr/bin/env node
/* Checks that every string used in the templates ({{t "..."}} or (t "...")) exists in every locale,
   and that placeholders such as {page} and % match the English source. */
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

const used = new Set();
templates(root).forEach(function (f) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/\bt "((?:[^"\\]|\\.)*)"/g)) used.add(m[1]);
});

const dir = path.join(root, 'locales');
const locales = fs.readdirSync(dir).filter(function (f) { return f.endsWith('.json'); });
const en = JSON.parse(fs.readFileSync(path.join(dir, 'en.json'), 'utf8'));
const tokens = function (s) { return (s.match(/\{[A-Za-z]+\}|%/g) || []).sort().join(','); };
let failures = 0;

used.forEach(function (k) {
    if (!(k in en)) { console.error('en.json is missing: ' + JSON.stringify(k)); failures++; }
});
locales.forEach(function (file) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    used.forEach(function (k) {
        if (!(k in data)) { console.error(file + ' is missing: ' + JSON.stringify(k)); failures++; }
        else if (typeof data[k] !== 'string' || data[k].trim() === '') { console.error(file + ' has an empty value for: ' + JSON.stringify(k)); failures++; }
        else if (k in en && tokens(data[k]) !== tokens(en[k])) { console.error(file + ' placeholders differ for: ' + JSON.stringify(k)); failures++; }
    });
    Object.keys(data).forEach(function (k) {
        if (!used.has(k)) console.warn(file + ' has an unused key: ' + JSON.stringify(k));
    });
});

console.log(used.size + ' strings used, ' + locales.length + ' locales checked.');
if (failures) { console.error(failures + ' problem(s).'); process.exit(1); }
