#!/usr/bin/env node
/* Captures the documentation screenshots from a running Ghost site that uses Spectra.
   No dependencies: it drives a local Chrome through the DevTools protocol (Node 22+ has WebSocket).

   Usage:
     node scripts/screenshots.mjs --base http://localhost:2368 --out docs/screenshots --group featured

   Groups match the Ghost state they need (hero style, footer style, cover), see GROUPS below.
   Set CHROME to the browser binary if it is not in the default macOS location. */
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, all) => (v.startsWith('--') ? a.concat([[v.slice(2), all[i + 1]]]) : a), []));
const BASE = (args.base || 'http://localhost:2368').replace(/\/$/, '');
const OUT = args.out || 'docs/screenshots';
const GROUP = args.group;
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;

// Shot fields: name, path, w, h, dpr, scheme (light|dark), mobile, js (run before capture), scroll (selector to centre),
// clip (selector to crop to, with pad in px), wait (ms).
const desktop = { w: 1440, h: 900, dpr: 1 };
const phone = { w: 390, h: 844, dpr: 2, mobile: true };
const hero = (name) => [
    { name: `home-${name}`, path: '/', ...desktop, scheme: 'light' },
    { name: `home-${name}-dark`, path: '/', ...desktop, scheme: 'dark' },
];
const GROUPS = {
    // hero Featured, footer Colophon, cover set, featured slider on, page templates assigned
    featured: [
        ...hero('featured'),
        { name: 'feed-bento', path: '/', ...desktop, scheme: 'light', scroll: '.feed', clip: '.feed', pad: 24 },
        { name: 'featured-slider', path: '/', ...desktop, scheme: 'light', scroll: '.featured', clip: '.featured', pad: 24 },
        { name: 'subscribe', path: '/', ...desktop, scheme: 'light', scroll: '.subscribe-wrap', clip: '.subscribe-wrap', pad: 24 },
        { name: 'footer-colophon', path: '/', ...desktop, scheme: 'light', scroll: '.site-footer', clip: '.site-footer', pad: 32 },
        { name: 'post', path: '/guida-tipografia/', w: 1440, h: 1000, dpr: 1, scheme: 'light' },
        { name: 'post-dark', path: '/guida-tipografia/', w: 1440, h: 1000, dpr: 1, scheme: 'dark' },
        { name: 'post-share', path: '/guida-tipografia/', ...desktop, scheme: 'light', scroll: '.share' },
        { name: 'lightbox', path: '/kitchen-sink-tutte-le-card-koenig/', ...desktop, scheme: 'dark', js: "document.querySelector('img[data-zoom]').click()", wait: 900 },
        { name: 'gated', path: '/post-riservato-agli-iscritti/', ...desktop, scheme: 'light', scroll: '.post-upgrade' },
        { name: 'archive', path: '/about/', w: 1440, h: 1000, dpr: 1, scheme: 'light' },
        { name: 'membership', path: '/astrix/', w: 1440, h: 1000, dpr: 1, scheme: 'light' },
        { name: 'tag', path: '/tag/design/', ...desktop, scheme: 'light' },
        { name: 'error-404', path: '/page-that-does-not-exist/', ...desktop, scheme: 'light' },
        { name: 'header', path: '/', w: 1440, h: 200, dpr: 2, scheme: 'light', clip: '.site-header', pad: 12 },
        { name: 'mobile-home', path: '/', ...phone, scheme: 'light' },
        { name: 'mobile-home-dark', path: '/', ...phone, scheme: 'dark' },
        { name: 'mobile-menu', path: '/', ...phone, scheme: 'light', js: "document.querySelector('.nav-toggle').click()", wait: 500 },
        { name: 'mobile-post', path: '/guida-tipografia/', ...phone, scheme: 'light' },
    ],
    masthead: [...hero('masthead'), { name: 'footer-signoff', path: '/', ...desktop, scheme: 'light', scroll: '.site-footer', clip: '.site-footer', pad: 32 }],
    statement: hero('statement'),
    index: hero('index'),
    // same four heroes without a publication cover (run once per hero style)
    nocover: [{ name: 'home-HERO-nocover', path: '/', ...desktop, scheme: 'light' }],
    newsletter: [{ name: 'newsletter', path: '/astrix/', w: 1440, h: 1000, dpr: 1, scheme: 'light' }],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
if (!GROUP || !GROUPS[GROUP]) {
    console.error('Pass --group one of: ' + Object.keys(GROUPS).join(', '));
    process.exit(1);
}
mkdirSync(OUT, { recursive: true });

const profile = mkdtempSync(join(tmpdir(), 'spectra-shots-'));
const chrome = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, '--no-first-run', '--disable-gpu', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const stop = () => { try { chrome.kill(); } catch (e) { /* already gone */ } };
process.on('exit', stop);

let tab;
for (let i = 0; i < 50 && !tab; i++) {
    try { tab = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json(); } catch (e) { await sleep(200); }
}
if (!tab) { console.error('Could not reach Chrome'); process.exit(1); }

const ws = new WebSocket(tab.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let id = 0;
const pending = new Map();
const waiters = [];
ws.addEventListener('message', (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) { const { resolve, reject } = pending.get(msg.id); pending.delete(msg.id); msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result); }
    else if (msg.method) waiters.filter((w) => w.method === msg.method).forEach((w) => w.resolve(msg.params));
});
const send = (method, params = {}) => new Promise((resolve, reject) => { const i = ++id; pending.set(i, { resolve, reject }); ws.send(JSON.stringify({ id: i, method, params })); });
const once = (method) => new Promise((resolve) => waiters.push({ method, resolve }));
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result.value;

await send('Page.enable');
let heroName = args.hero || '';
for (const shot of GROUPS[GROUP]) {
    const name = shot.name.replace('HERO', heroName);
    await send('Emulation.setDeviceMetricsOverride', { width: shot.w, height: shot.h, deviceScaleFactor: shot.dpr, mobile: !!shot.mobile });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: shot.scheme }, { name: 'prefers-reduced-motion', value: 'no-preference' }] });
    const loaded = once('Page.loadEventFired');
    await send('Page.navigate', { url: BASE + shot.path });
    await loaded;
    await evaluate('document.fonts.ready.then(() => true)');
    await sleep(1400);
    if (shot.scroll) {
        await evaluate(`document.querySelector(${JSON.stringify(shot.scroll)}).scrollIntoView({ block: 'center' })`);
        await sleep(900);
    }
    if (shot.js) { await evaluate(shot.js); await sleep(shot.wait || 600); }
    let clip;
    if (shot.clip) {
        const r = await evaluate(`(() => { const b = document.querySelector(${JSON.stringify(shot.clip)}).getBoundingClientRect(); return { x: b.left + scrollX, y: b.top + scrollY, w: b.width, h: b.height }; })()`);
        const pad = shot.pad || 0;
        clip = { x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: r.w + pad * 2, height: r.h + pad * 2, scale: 1 };
    }
    const { data } = await send('Page.captureScreenshot', { format: 'webp', quality: 84, captureBeyondViewport: !!clip, ...(clip ? { clip } : {}) });
    writeFileSync(join(OUT, `${name}.webp`), Buffer.from(data, 'base64'));
    console.log('captured', name);
}
stop();
process.exit(0);
