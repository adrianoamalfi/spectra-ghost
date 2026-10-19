import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import Handlebars from 'handlebars';

/*
 * Regression guard for the class of bug where a Handlebars helper is invoked
 * with a bad argument. Handlebars parses .hbs files in full and knows nothing
 * about CSS or JS comments, so a helper call written inside one is still
 * evaluated at render time. gscan compiles templates but never invokes
 * helpers, so nothing in the quality gate catches it. The `asset` helper below
 * mirrors Ghost's, which calls assetPath.match(...) and so throws exactly like
 * production when handed a non-string.
 */

const IGNORED_DIRS = /^(node_modules|\.git|docs|assets|locales|scripts|\.github|demo|dist)$/;

function findTemplates(dir = '.', out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.test(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) findTemplates(full, out);
    else if (entry.name.endsWith('.hbs')) out.push(full);
  }
  return out;
}

const templates = findTemplates();

function makeHandlebars() {
  const hbs = Handlebars.create();
  // Mirrors Ghost's asset helper, which calls assetPath.match(...) and so
  // throws exactly like production when handed a non-string.
  hbs.registerHelper('asset', (assetPath) => {
    if (typeof assetPath !== 'string') {
      throw new TypeError('assetPath.match is not a function');
    }
    return new hbs.SafeString(`/assets/${assetPath}?v=test`);
  });

  hbs.registerHelper('is', function (context, options) {
    return options.data.root._context === context ? options.fn(this) : options.inverse(this);
  });

  const contextBlockHelper = function (name) {
    return function (options) {
      const value = this[name];
      return value ? options.fn(value) : options.inverse(this);
    };
  };
  for (const name of ['author', 'primary_tag', 'post', 'page', 'tag', 'next_post', 'prev_post']) {
    hbs.registerHelper(name, contextBlockHelper(name));
  }

  const passthroughBlockHelper = function (...args) {
    const options = args[args.length - 1];
    return options && typeof options.fn === 'function' ? options.fn(this) : '';
  };
  for (const name of ['match', 'has', 'get', 'foreach']) {
    hbs.registerHelper(name, passthroughBlockHelper);
  }

  hbs.registerHelper('t', (value) => value);
  hbs.registerHelper('url', function (options) {
    const siteUrl = options.data.root['@site'].url;
    if (options.hash.absolute && this.url?.startsWith('/')) return `${siteUrl}${this.url}`;
    return this.url || siteUrl;
  });

  for (const name of [
    'comments',
    'date',
    'excerpt',
    'img_url',
    'navigation',
    'page_url',
    'price',
    'readable_url',
    'recommendations',
    'social_url',
    'plural',
  ]) {
    hbs.registerHelper(name, () => '');
  }
  // Partials are exercised on their own; stub them so each file is isolated.
  for (const file of templates) {
    const name = file.replace(/^partials\//, '').replace(/\.hbs$/, '');
    hbs.registerPartial(name, '');
  }
  return hbs;
}

describe('Handlebars expressions in CSS/JS comments', () => {
  // Handlebars comments ({{!-- --}}) are stripped before rendering, so a helper
  // call inside one is inert. A CSS or JS comment is not — it still renders.
  const stripHandlebarsComments = (src) =>
    src
      .replace(/\{\{!--[\s\S]*?--\}\}/g, (m) => m.replace(/[^\n]/g, ' '))
      .replace(/\{\{![\s\S]*?\}\}/g, (m) => m.replace(/[^\n]/g, ' '));

  it.each(templates)('%s has no helper call inside a CSS/JS comment', (file) => {
    const stripped = stripHandlebarsComments(readFileSync(file, 'utf8'));
    const offenders = [];
    for (const comment of stripped.matchAll(/\/\*[\s\S]*?\*\//g)) {
      for (const expr of comment[0].matchAll(/\{\{[^}]*\}\}/g)) offenders.push(expr[0]);
    }
    expect(offenders).toEqual([]);
  });
});

describe('templates render without invoking helpers incorrectly', () => {
  // Stubbing Ghost's full data shape is out of scope, so a template may still
  // fail on missing fixture data ("Cannot read properties of undefined"). That
  // is noise. What must never happen is a helper being *invoked wrongly* —
  // which surfaces as a TypeError of the "x is not a function" kind. Only that
  // class fails the test.
  it.each(templates)('%s never invokes a helper with a bad argument', (file) => {
    const hbs = makeHandlebars();
    const render = hbs.compile(readFileSync(file, 'utf8'));
    let helperMisuse = null;
    try {
      render({ '@site': { url: 'https://example.com', title: 'Spectra Test' } });
    } catch (err) {
      if (/is not a function/.test(err.message)) helperMisuse = err.message;
    }
    expect(helperMisuse).toBeNull();
  });
});

describe('footer recommendations partial', () => {
  function recommendationsHandlebars() {
    const hbs = Handlebars.create();
    hbs.registerHelper('t', (key) => key);
    hbs.registerHelper('readable_url', (url) => new URL(url).hostname);
    hbs.registerHelper('foreach', hbs.helpers.each);
    return hbs;
  }

  function renderRecommendations(recommendations) {
    const hbs = recommendationsHandlebars();
    return hbs.compile(readFileSync('partials/recommendations.hbs', 'utf8'))({ recommendations });
  }

  it('uses each recommendation URL including paths, query strings and fragments', () => {
    const html = renderRecommendations([
      { id: 'rec-1', title: 'Analista', url: 'https://diariodiunanalista.it/' },
      { id: 'rec-2', title: 'Pomaro', url: 'https://alessiopomaro.it/articles/?a=1&b=two#section' },
    ]);

    expect(html).toContain('href="https://diariodiunanalista.it/" data-recommendation="rec-1"');
    expect(html).toContain(
      'href="https://alessiopomaro.it/articles/?a&#x3D;1&amp;b&#x3D;two#section" data-recommendation="rec-2"',
    );
    expect(html).toContain('>diariodiunanalista.it</span>');
    expect(html).toContain('>alessiopomaro.it</span>');
  });

  it('escapes recommendation attributes and text', () => {
    const html = renderRecommendations([
      {
        id: 'rec-"quoted"',
        url: 'https://example.com/?q="quoted"&page=2',
        title: '<script>alert("title")</script>',
        description: '<img src=x onerror="alert(1)">',
        favicon: 'https://example.com/icon.png?q="quoted"',
      },
    ]);

    expect(html).toContain('href="https://example.com/?q&#x3D;&quot;quoted&quot;&amp;page&#x3D;2"');
    expect(html).toContain('data-recommendation="rec-&quot;quoted&quot;"');
    expect(html).toContain('src="https://example.com/icon.png?q&#x3D;&quot;quoted&quot;"');
    expect(html).toContain('&lt;script&gt;alert(&quot;title&quot;)&lt;/script&gt;');
    expect(html).toContain('&lt;img src&#x3D;x onerror&#x3D;&quot;alert(1)&quot;&gt;');
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
  });

  it('renders nothing when Ghost returns no recommendations', () => {
    const html = renderRecommendations([]);

    expect(html.trim()).toBe('');
    expect(html).not.toContain('recs-list');
    expect(html).not.toContain('Recommended sites');
  });

  it('renders the section and list when recommendations exist', () => {
    const html = renderRecommendations([
      {
        id: 'rec-1',
        title: 'Example Journal',
        url: 'https://example.com/',
        favicon: 'https://example.com/favicon.ico',
        description: 'Independent notes from the web.',
      },
      { id: 'rec-2', title: 'No Icon Weekly', url: 'https://weekly.example/' },
    ]);

    expect(html).toContain('class="recs"');
    expect(html).toContain('Recommended sites');
    expect(html).toContain('class="recs-list"');
    expect(html).toContain('Example Journal');
    expect(html).toContain('No Icon Weekly');
    expect(html).toContain('https://example.com/favicon.ico');
  });

  it('uses the shared section-title treatment, not an eyebrow', () => {
    const html = renderRecommendations([{ id: 'rec-1', title: 'X', url: 'https://example.com/' }]);
    expect(html).toContain('class="section-title recs-title"');
    // The eyebrow treatment (all-caps, tracked, muted) is gone — it was a
    // DESIGN.md violation (eyebrows are rationed to the hero and one per
    // article). Only the footer spacing remains on .recs-title.
    const css = readFileSync('assets/css/screen.css', 'utf8');
    const recsTitleRule = css.match(/\.recs-title\s*{[^}]*}/)?.[0] ?? '';
    expect(recsTitleRule).not.toMatch(/text-transform:\s*uppercase/);
    expect(recsTitleRule).not.toMatch(/letter-spacing:\s*0\.1em/);
  });

  it('includes a visually hidden new-tab warning inside each recommendation link', () => {
    const html = renderRecommendations([{ id: 'rec-1', title: 'Example Journal', url: 'https://example.com/' }]);

    expect(html).toMatch(
      /<a class="rec" href="https:\/\/example\.com\/" data-recommendation="rec-1" target="_blank" rel="noopener">[\s\S]*<span class="visually-hidden">Opens in a new tab<\/span>[\s\S]*<\/a>/,
    );
  });
});

describe('v0.4.1 reader & a11y refinements', () => {
  const site = { '@site': { url: 'https://example.com', title: 'Spectra Test' } };

  it('lightbox is a native <dialog> with an explicit Escape branch', () => {
    const js = readFileSync('assets/js/post.js', 'utf8');
    expect(js).toContain("document.createElement('dialog')");
    expect(js).toContain('dlg.showModal()');
    // Escape closes via an explicit branch (the native <dialog> also handles
    // it, but the branch keeps the behaviour identical in every environment).
    expect(js).toMatch(/e\.key === 'Escape'[\s\S]*?dlg\.close\(\)/);
  });

  it('closed lightbox dialog is display:none (no stray full-viewport box)', () => {
    // A closed <dialog> is display:none in the UA stylesheet. The layout must
    // only apply when :open, or a dismissed lightbox leaves a dark box at the
    // end of the page.
    const css = readFileSync('assets/css/screen.css', 'utf8');
    expect(css).toMatch(/\.lightbox\[open\]\s*{[^}]*display:\s*grid/);
    // The base .lightbox rule must not set display itself.
    const baseRule = css.match(/\.lightbox\s*{[^}]*}/)?.[0] ?? '';
    expect(baseRule).not.toMatch(/display:/);
  });

  it('search hint no longer reads the deprecated navigator.platform', () => {
    const js = readFileSync('assets/js/main.js', 'utf8');
    expect(js).not.toContain('navigator.platform');
    expect(js).toContain('navigator.userAgent');
  });

  it('infinite scroll prefetches 500px ahead, not 600px', () => {
    const main = readFileSync('assets/js/main.js', 'utf8');
    const post = readFileSync('assets/js/post.js', 'utf8');
    expect(main).toContain("rootMargin: '500px 0px'");
    expect(main).not.toContain("rootMargin: '600px 0px'");
    expect(post).toContain("rootMargin: '500px 0px'");
    expect(post).not.toContain("rootMargin: '600px 0px'");
  });

  it('empty state names the tag or author when their archive is empty', () => {
    const hbs = Handlebars.create();
    // A t helper that substitutes {name} so the render proves the value flows
    // through, not just that the right key was chosen.
    hbs.registerHelper('t', (key, options) => {
      const name = options && options.hash ? options.hash.name : undefined;
      return String(key).replace('{name}', name != null ? name : '');
    });
    hbs.registerPartial('icons/search', '<svg></svg>');
    const render = hbs.compile(readFileSync('partials/empty-state.hbs', 'utf8'));

    const withName = render({ ...site, name: 'Design' });
    expect(withName).toContain('There are no posts for Design right now. Check back soon.');
    expect(withName).not.toContain('There are no posts to show right now');

    const generic = render(site);
    expect(generic).toContain('There are no posts to show right now. Check back soon.');
  });
});
