/* Spectra docs: colour scheme switch, accent picker and the hero showcase. */
(function () {
    'use strict';
    var root = document.documentElement;

    // Colour scheme: system / light / dark, remembered in the browser
    var KEY = 'spectra-docs-scheme';
    var schemeButtons = document.querySelectorAll('[data-scheme-set]');
    var apply = function (v) {
        if (v === 'light' || v === 'dark') root.setAttribute('data-scheme', v); else root.removeAttribute('data-scheme');
        schemeButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-scheme-set') === (v || 'system'))); });
    };
    var saved; try { saved = localStorage.getItem(KEY); } catch (e) { /* storage blocked */ }
    apply(saved);
    schemeButtons.forEach(function (b) {
        b.addEventListener('click', function () {
            var v = b.getAttribute('data-scheme-set');
            apply(v === 'system' ? null : v);
            try { localStorage.setItem(KEY, v); } catch (e) { /* storage blocked */ }
        });
    });

    // Accent picker: the whole page re-derives its palette from the chosen colour
    var picker = document.getElementById('accent');
    var setAccent = function (c) {
        root.style.setProperty('--ghost-accent-color', c);
        if (picker && picker.value !== c) picker.value = c;
        try { localStorage.setItem('spectra-docs-accent', c); } catch (e) { /* storage blocked */ }
    };
    var accent; try { accent = localStorage.getItem('spectra-docs-accent'); } catch (e) { /* storage blocked */ }
    if (accent) setAccent(accent);
    if (picker) picker.addEventListener('input', function () { setAccent(picker.value); });
    document.querySelectorAll('[data-accent]').forEach(function (b) {
        b.style.background = b.getAttribute('data-accent');
        b.addEventListener('click', function () { setAccent(b.getAttribute('data-accent')); });
    });

    // Showcase: hero style x cover x scheme
    var stage = document.getElementById('stage-img');
    if (stage) {
        var state = { hero: 'featured', cover: 'cover', scheme: 'light' };
        var dark = document.querySelector('input[name="scheme"][value="dark"]');
        var notes = {
            featured: 'Your identity next to the featured post (the latest post if none is featured). With the slider off, the hero shows the latest posts as a ruled list; with it on, other featured posts appear in the slider when available.',
            masthead: 'The site name across the full width, a hairline, then description and subscribe.',
            statement: 'The site description is the headline, with your top topics as links. With a cover the tile splits in two.',
            index: 'Your topics and their real post counts are the hero.'
        };
        var render = function () {
            var nocover = state.cover === 'nocover';
            if (dark) { dark.disabled = nocover; if (nocover && state.scheme === 'dark') { state.scheme = 'light'; document.querySelector('input[name="scheme"][value="light"]').checked = true; } }
            var file = 'home-' + state.hero + (nocover ? '-nocover' : (state.scheme === 'dark' ? '-dark' : ''));
            stage.src = 'screenshots/' + file + '.webp';
            stage.alt = 'Spectra home page with the ' + state.hero + ' hero' + (nocover ? ', no cover image' : '') + (state.scheme === 'dark' ? ', dark scheme' : '');
            document.getElementById('hero-note').textContent = notes[state.hero];
        };
        document.querySelectorAll('.controls input').forEach(function (i) {
            i.addEventListener('change', function () { state[i.name] = i.value; render(); });
        });
        render();
    }
})();
