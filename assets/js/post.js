/* Spectra: reading enhancements for posts and pages. Progressive: the content works without this. */
(function () {
    'use strict';

    var content = document.getElementById('gh-content') || document.querySelector('.gh-content');

    function legacyCopy(text) {
        return new Promise(function (resolve, reject) {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
            document.body.appendChild(ta);
            ta.select();
            var ok = false;
            try { ok = document.execCommand('copy'); } catch (e) {}
            ta.remove();
            ok ? resolve() : reject(new Error('copy failed'));
        });
    }
    // The Clipboard API can be refused (permissions, embedded browsers): fall back to the legacy path
    function copy(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text).catch(function () { return legacyCopy(text); });
        }
        return legacyCopy(text);
    }
    var copyStatus, copyStatusTimer;
    function announceCopy(success) {
        if (!copyStatus) {
            copyStatus = document.createElement('p');
            copyStatus.className = 'action-status';
            copyStatus.setAttribute('role', 'status');
            copyStatus.setAttribute('aria-live', 'polite');
            copyStatus.setAttribute('aria-atomic', 'true');
            document.body.appendChild(copyStatus);
        }
        window.clearTimeout(copyStatusTimer);
        copyStatus.hidden = false;
        copyStatus.textContent = '';
        window.requestAnimationFrame(function () {
            copyStatus.textContent = document.body.getAttribute(success ? 'data-copy-success' : 'data-copy-error') || (success ? 'Copied to clipboard.' : 'Could not copy. Please try again.');
        });
        copyStatusTimer = window.setTimeout(function () { copyStatus.hidden = true; }, 2600);
    }
    function flash(el, cls, ms) { el.classList.add(cls); setTimeout(function () { el.classList.remove(cls); }, ms || 1600); }

    // Share: copy link
    document.querySelectorAll('[data-share-url]').forEach(function (b) {
        b.addEventListener('click', function () {
            copy(b.getAttribute('data-share-url')).then(function () {
                b.setAttribute('data-state', 'copied');
                announceCopy(true);
                setTimeout(function () { b.removeAttribute('data-state'); }, 1800);
            }).catch(function () { announceCopy(false); });
        });
    });

    // Comments: inject the Ghost comments script only when the reader scrolls near
    var host = document.querySelector('[data-lazy-comments]');
    if (host) {
        var tpl = host.querySelector('template');
        var inject = function () {
            if (!tpl) return;
            host.appendChild(tpl.content.cloneNode(true));
            host.querySelectorAll('script').forEach(function (old) {
                var s = document.createElement('script');
                Array.prototype.slice.call(old.attributes).forEach(function (a) { s.setAttribute(a.name, a.value); });
                s.text = old.text;
                old.replaceWith(s);
            });
            tpl = null;
        };
        if (location.hash.indexOf('#ghost-comments') === 0 || !('IntersectionObserver' in window)) inject();
        else new IntersectionObserver(function (e, o) { if (e[0].isIntersecting) { inject(); o.disconnect(); } }, { rootMargin: '600px 0px' }).observe(host);
    }

    // Reading progress: only where CSS scroll-driven animations are missing
    if (document.body.getAttribute('data-progress') === 'on' && document.body.classList.contains('post-template') && !(window.CSS && CSS.supports('animation-timeline: scroll()'))) {
        var bar = document.createElement('div');
        bar.className = 'read-progress';
        bar.setAttribute('aria-hidden', 'true');
        document.body.appendChild(bar);
        var tick = function () {
            var max = document.documentElement.scrollHeight - window.innerHeight;
            bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
        };
        window.addEventListener('scroll', tick, { passive: true });
        tick();
    }

    if (!content) return;
    var label = function (k, d) { return content.getAttribute('data-' + k) || d; };

    // Wide tables scroll inside a labelled region
    content.querySelectorAll('table').forEach(function (t) {
        if (t.parentElement.classList.contains('table-scroll')) return;
        var wrap = document.createElement('div');
        wrap.className = 'table-scroll';
        wrap.setAttribute('role', 'region');
        wrap.setAttribute('tabindex', '0');
        wrap.setAttribute('aria-label', label('table-label', 'Scrollable table'));
        t.parentNode.insertBefore(wrap, t);
        wrap.appendChild(t);
    });

    // Table of contents + scrollspy (built before the anchors are added)
    var details = document.getElementById('toc-details');
    var heads = Array.prototype.slice.call(content.querySelectorAll('h2[id], h3[id]'));
    if (details && heads.length >= 2) {
        var list = details.querySelector('.toc-list'), links = {};
        heads.forEach(function (h) {
            var li = document.createElement('li'), a = document.createElement('a');
            if (h.tagName === 'H3') li.className = 'toc-sub';
            a.href = '#' + h.id;
            a.textContent = h.textContent.trim();
            li.appendChild(a);
            list.appendChild(li);
            links[h.id] = a;
        });
        details.hidden = false;
        if (window.matchMedia('(min-width: 75rem)').matches) details.open = true;
        if ('IntersectionObserver' in window) {
            var current;
            var spy = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    if (!en.isIntersecting) return;
                    if (current) current.removeAttribute('aria-current');
                    current = links[en.target.id];
                    if (current) current.setAttribute('aria-current', 'true');
                });
            }, { rootMargin: '0px 0px -70% 0px' });
            heads.forEach(function (h) { spy.observe(h); });
        }
    }

    // Heading anchors: a link that also copies the section URL
    content.querySelectorAll('h2[id], h3[id], h4[id]').forEach(function (h) {
        var a = document.createElement('a');
        a.className = 'heading-anchor';
        a.href = '#' + h.id;
        a.setAttribute('aria-label', label('anchor-label', 'Copy link to this section'));
        a.textContent = '#';
        a.addEventListener('click', function () {
            copy(location.origin + location.pathname + '#' + h.id).then(function () {
                flash(a, 'is-copied');
                announceCopy(true);
            }).catch(function () { announceCopy(false); });
        });
        h.appendChild(a);
    });

    // Code blocks: copy button
    content.querySelectorAll('pre').forEach(function (pre) {
        if (pre.parentElement.classList.contains('code-wrap')) return;
        var wrap = document.createElement('div'), b = document.createElement('button');
        wrap.className = 'code-wrap';
        b.type = 'button';
        b.className = 'code-copy';
        b.textContent = label('copy', 'Copy');
        b.addEventListener('click', function () {
            copy((pre.querySelector('code') || pre).textContent).then(function () {
                b.textContent = label('copied', 'Copied');
                b.classList.add('is-copied');
                announceCopy(true);
                setTimeout(function () { b.textContent = label('copy', 'Copy'); b.classList.remove('is-copied'); }, 1600);
            }).catch(function () { announceCopy(false); });
        });
        pre.setAttribute('tabindex', '0');
        pre.parentNode.insertBefore(wrap, pre);
        wrap.appendChild(pre);
        wrap.appendChild(b);
    });

    // Lightbox for images in the content (a native <dialog>: focus trap and Escape for free)
    var imgs = Array.prototype.slice.call(content.querySelectorAll('img')).filter(function (i) {
        return !i.closest('a') && !i.closest('.kg-bookmark-card, .kg-product-card, .kg-header-card, .kg-signup-card');
    });
    if (imgs.length && typeof HTMLDialogElement === 'function') {
        var svg = function (d) { return '<svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>'; };
        var dlg = document.createElement('dialog');
        dlg.className = 'lightbox';
        dlg.setAttribute('aria-label', label('zoom-label', 'Zoom image'));
        dlg.innerHTML = '<figure class="lightbox-figure"><img alt=""><figcaption></figcaption></figure>' +
            '<button class="lightbox-btn lightbox-close" type="button" aria-label="' + label('close-label', 'Close') + '">' + svg('<path d="M6 6l12 12M18 6L6 18"/>') + '</button>' +
            '<button class="lightbox-btn lightbox-prev" type="button" aria-label="' + label('prev-label', 'Previous') + '">' + svg('<path d="M5 12h14M13 6l6 6-6 6"/>') + '</button>' +
            '<button class="lightbox-btn lightbox-next" type="button" aria-label="' + label('next-label', 'Next') + '">' + svg('<path d="M5 12h14M13 6l6 6-6 6"/>') + '</button>';
        document.body.appendChild(dlg);
        var big = dlg.querySelector('img'), cap = dlg.querySelector('figcaption'), idx = 0;
        var show = function (i) {
            idx = (i + imgs.length) % imgs.length;
            var im = imgs[idx], src = im.currentSrc || im.src;
            if (im.srcset) { var parts = im.srcset.split(',').map(function (p) { return p.trim().split(' ')[0]; }); src = parts[parts.length - 1] || src; }
            big.src = src;
            big.alt = im.alt || '';
            var fig = im.closest('figure'), fc = fig && fig.querySelector('figcaption');
            cap.textContent = fc ? fc.textContent : '';
            cap.hidden = !cap.textContent;
        };
        var many = imgs.length > 1;
        dlg.querySelector('.lightbox-prev').hidden = !many;
        dlg.querySelector('.lightbox-next').hidden = !many;
        imgs.forEach(function (im, i) {
            im.setAttribute('data-zoom', '');
            im.setAttribute('tabindex', '0');
            im.setAttribute('role', 'button');
            im.addEventListener('click', function () { show(i); dlg.showModal(); });
            im.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(i); dlg.showModal(); } });
        });
        dlg.querySelector('.lightbox-close').addEventListener('click', function () { dlg.close(); });
        dlg.querySelector('.lightbox-prev').addEventListener('click', function () { show(idx - 1); });
        dlg.querySelector('.lightbox-next').addEventListener('click', function () { show(idx + 1); });
        dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
        dlg.addEventListener('keydown', function (e) {
            if (!many) return;
            if (e.key === 'ArrowLeft') show(idx - 1);
            if (e.key === 'ArrowRight') show(idx + 1);
        });
    }
})();
