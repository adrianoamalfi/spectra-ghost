/* Spectra: progressive enhancements only. The theme works without JavaScript. */
(function () {
    'use strict';

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mobile menu: a disclosure panel under the header
    var header = document.querySelector('.site-header');
    var toggle = document.querySelector('.nav-toggle');
    if (header && toggle) {
        var setOpen = function (open) {
            if (open) header.setAttribute('data-open', ''); else header.removeAttribute('data-open');
            toggle.setAttribute('aria-expanded', String(open));
        };
        toggle.addEventListener('click', function () { setOpen(toggle.getAttribute('aria-expanded') !== 'true'); });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && header.hasAttribute('data-open')) { setOpen(false); toggle.focus(); }
        });
        document.addEventListener('click', function (e) {
            if (header.hasAttribute('data-open') && !header.contains(e.target)) setOpen(false);
        });
        window.matchMedia('(min-width: 48rem)').addEventListener('change', function (e) { if (e.matches) setOpen(false); });
    }

    // Colour scheme switch. The saved choice is applied in <head> before first paint (see default.hbs);
    // here we only wire the buttons. "system" maps to Auto, which follows the OS.
    var schemeKey = 'spectra-scheme';
    var schemeMap = { system: 'Auto', light: 'Light', dark: 'Dark' };
    var schemeBack = { Auto: 'system', Light: 'light', Dark: 'dark' };
    var schemeButtons = document.querySelectorAll('[data-scheme-set]');
    function showScheme() {
        var now = schemeBack[document.documentElement.getAttribute('data-scheme')] || 'system';
        schemeButtons.forEach(function (b) {
            b.setAttribute('aria-pressed', String(b.getAttribute('data-scheme-set') === now));
        });
    }
    schemeButtons.forEach(function (b) {
        b.addEventListener('click', function () {
            var v = b.getAttribute('data-scheme-set');
            document.documentElement.setAttribute('data-scheme', schemeMap[v]);
            try { localStorage.setItem(schemeKey, v); } catch (e) {}
            showScheme();
        });
    });
    showScheme();

    // Back to top
    var top = document.querySelector('.back-to-top');
    if (top) {
        var shown = false;
        var onScroll = function () {
            var s = window.scrollY > 800;
            if (s !== shown) { shown = s; top.hidden = !s; }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        top.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); });
    }

    // Infinite scroll: fetch the next page when the reader nears the end. The pagination
    // links stay in place, so it still works (and is reachable by keyboard) without this.
    var feed = document.querySelector('[data-feed-list]');
    var pager = document.querySelector('.pagination');
    if (feed && pager && 'IntersectionObserver' in window) {
        var busy = false;
        var note = document.createElement('p');
        note.className = 'feed-status';
        note.setAttribute('role', 'status');
        var sentinel = document.createElement('div');
        sentinel.setAttribute('aria-hidden', 'true');
        pager.parentNode.insertBefore(sentinel, pager);
        var io = new IntersectionObserver(function (entries) { if (entries[0].isIntersecting) more(); }, { rootMargin: '600px 0px' });
        var more = function () {
            var next = pager.querySelector('a[rel="next"]');
            if (!next) { io.disconnect(); return; }
            if (busy) return;
            busy = true;
            var failed = false;
            note.textContent = pager.getAttribute('data-loading-label') || '';
            feed.parentNode.insertBefore(note, pager);
            fetch(next.href, { credentials: 'same-origin' })
                .then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); })
                .then(function (html) {
                    var doc = new DOMParser().parseFromString(html, 'text/html');
                    var nextFeed = doc.querySelector('[data-feed-list]');
                    if (!nextFeed) throw new Error('Next page has no post feed');
                    nextFeed.querySelectorAll(':scope > .card').forEach(function (c) { feed.appendChild(document.importNode(c, true)); });
                    var np = doc.querySelector('.pagination');
                    if (np) pager.innerHTML = np.innerHTML; else { pager.remove(); io.disconnect(); }
                })
                .catch(function () {
                    failed = true;
                    io.disconnect();
                    note.textContent = pager.getAttribute('data-error-label') || '';
                })
                .then(function () {
                    busy = false;
                    if (!failed) { note.textContent = ''; note.remove(); }
                });
        };
        io.observe(sentinel);
    }

    // Archive page: group the flat list by year (flat with full dates without JS)
    var arch = document.getElementById('archive-posts');
    if (arch) {
        var frag = document.createDocumentFragment(), year, ol;
        Array.prototype.slice.call(arch.children).forEach(function (li) {
            if (li.getAttribute('data-year') !== year) {
                year = li.getAttribute('data-year');
                var h = document.createElement('h3');
                h.className = 'archive-year';
                h.textContent = year;
                ol = document.createElement('ol');
                ol.className = 'archive-posts';
                frag.appendChild(h);
                frag.appendChild(ol);
            }
            var t = li.querySelector('time');
            if (t && t.getAttribute('data-in-year')) t.textContent = t.getAttribute('data-in-year');
            ol.appendChild(li);
        });
        arch.replaceWith(frag);
    }

    // Fit display titles: if one long word (e.g. a domain) would overflow its tile,
    // shrink the type just enough. CSS alone cannot know the word's length.
    function fit(el) {
        el.style.fontSize = '';
        var wrap = el.style.overflowWrap, anim = el.style.animation;
        el.style.overflowWrap = 'normal';
        el.style.animation = 'none';
        if (el.scrollWidth > el.clientWidth + 1) {
            var size = parseFloat(getComputedStyle(el).fontSize);
            el.style.fontSize = Math.floor(size * el.clientWidth / el.scrollWidth * 0.97) + 'px';
        }
        el.style.overflowWrap = wrap;
        el.style.animation = anim;
    }

    var titles = document.querySelectorAll('.hero-title, .article-title');
    if (titles.length) {
        var run = function () { titles.forEach(fit); };
        (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(run);
        var raf;
        window.addEventListener('resize', function () {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(run);
        });
    }
})();
