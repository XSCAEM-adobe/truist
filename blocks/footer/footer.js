/*
 * Footer block — content-first.
 *
 * All copy, links and images come from the footer fragment
 * (content/footer.plain.html locally, /footer.plain.html on DA/EDS).
 * This file only classifies the fragment's top-level sections by their
 * content shape and adds layout shells + behavior:
 *
 *  - section whose first element is an <h2>  -> collapsible panel
 *    (open by default, toggled by a button labelled with the h2 text)
 *  - section with >= 2 heading + list pairs   -> static link columns
 *  - section whose list items are image-only links -> icon row (social)
 *  - section starting with an image link + list    -> brand / legal row
 *  - anything else                                 -> bottom bar (copyright)
 *
 * Footnote anchors: inside a collapsible panel, every paragraph that starts
 * with a <sup> marker gets an id derived from that marker so in-page
 * footnote links (e.g. href="#disc1") resolve:
 *   - digits "N"            -> disc{N}         ("1" -> disc1)
 *   - "†" repeated k times  -> disc0, disc01, disc02 ... ("†" -> disc0, "††" -> disc01)
 *   - "‡" counts as "††"
 * Clicking a link to such an id (or loading with that hash) opens the
 * panel and scrolls the item into view.
 *
 * Consent trigger: a link to a OneTrust SDK stub (cdn.cookielaw.org/.../otSDKStub.js)
 * is rendered as a button that opens the consent preference center, loading
 * the SDK on demand (domain-script id taken from the authored URL).
 */

const FRAGMENT_PATHS = ['/content/footer.plain.html', '/footer.plain.html'];

/**
 * Fetches the footer fragment. Metadata-independent:
 * /content first (localhost / aem up), then root (DA/EDS production).
 * @returns {Promise<{doc: Document, base: URL}|null>}
 */
async function fetchFooterFragment() {
  let resp = await fetch('/content/footer.plain.html');
  let path = FRAGMENT_PATHS[0];
  if (!resp.ok) {
    resp = await fetch('/footer.plain.html');
    [, path] = FRAGMENT_PATHS;
  }
  if (!resp.ok) return null;
  const html = await resp.text();
  // DOMParser keeps the markup inert so relative media is not requested
  // against the current page URL before it is re-based.
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return { doc, base: new URL(path, window.location.origin) };
}

/**
 * Re-bases relative image sources against the fragment URL.
 * @param {Element} root
 * @param {URL} base
 */
function rebaseMedia(root, base) {
  root.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (!/^(https?:)?\/\//.test(src) && !src.startsWith('data:')) {
      img.setAttribute('src', new URL(src, base).href);
    }
    // the brand logo (first linked image) loads eagerly so it never shows as an empty box
    const isLogo = img.closest('a') && img === root.querySelector('a img');
    img.setAttribute('loading', isLogo ? 'eager' : 'lazy');
  });
}

/**
 * External links and interstitial links (?url=<absolute>) open in a new tab.
 * @param {Element} root
 */
function decorateLinkTargets(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    let url;
    try {
      url = new URL(a.getAttribute('href'), window.location.href);
    } catch {
      return;
    }
    if (!/^https?:$/.test(url.protocol)) return;
    const external = url.hostname !== window.location.hostname;
    const interstitial = /^https?:\/\//.test(url.searchParams.get('url') || '');
    if (external || interstitial) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
  });
}

/**
 * Converts links to a OneTrust SDK stub into consent-preference buttons.
 * @param {Element} root
 */
function buildConsentTriggers(root) {
  root.querySelectorAll('a[href*="cdn.cookielaw.org/"]').forEach((a) => {
    const sdkUrl = a.href;
    const domainScript = (sdkUrl.match(/\/consent\/([^/]+)\//) || [])[1];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'footer-consent-trigger';
    button.textContent = a.textContent;

    const openPreferences = () => {
      if (window.OneTrust && typeof window.OneTrust.ToggleInfoDisplay === 'function') {
        window.OneTrust.ToggleInfoDisplay();
        return true;
      }
      return false;
    };

    button.addEventListener('click', () => {
      if (openPreferences()) return;
      if (!document.querySelector(`script[src="${sdkUrl}"]`)) {
        const script = document.createElement('script');
        script.src = sdkUrl;
        if (domainScript) script.dataset.domainScript = domainScript;
        document.head.append(script);
      }
      let tries = 0;
      const timer = setInterval(() => {
        tries += 1;
        if (openPreferences() || tries > 50) clearInterval(timer);
      }, 200);
    });
    a.replaceWith(button);
  });
}

/**
 * Derives a footnote id from its marker text.
 * @param {string} marker
 * @returns {string|null}
 */
function footnoteIdFromMarker(marker) {
  const m = marker.replace(/\s+/g, '').replace(/‡/g, '††');
  if (/^\d+$/.test(m)) return `disc${m}`;
  if (/^†+$/.test(m)) return `disc0${m.length > 1 ? m.length - 1 : ''}`;
  return null;
}

/**
 * Assigns ids to footnote paragraphs (paragraphs starting with <sup>).
 * @param {Element} container
 */
function assignFootnoteIds(container) {
  container.querySelectorAll('p').forEach((p) => {
    const first = p.firstElementChild;
    if (!first || first.tagName !== 'SUP') return;
    if (p.textContent.trim().indexOf(first.textContent.trim()) !== 0) return;
    const id = footnoteIdFromMarker(first.textContent);
    if (!id || document.getElementById(id)) return;
    p.id = id;
    p.tabIndex = -1;
    p.classList.add('footer-footnote');
  });
}

let panelSeq = 0;

/**
 * Builds a collapsible panel from a section whose first element is a heading.
 * @param {Element} section
 * @returns {{el: Element, open: Function, panel: Element}}
 */
function buildCollapsible(section) {
  panelSeq += 1;
  const heading = section.firstElementChild;
  const wrapper = document.createElement('div');
  wrapper.className = 'footer-disclosures';

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'footer-disclosures-toggle';
  button.setAttribute('aria-expanded', 'true');
  const label = document.createElement('span');
  label.textContent = heading.textContent;
  button.append(label);

  const panel = document.createElement('div');
  panel.className = 'footer-disclosures-body';
  panel.id = `footer-panel-${panelSeq}`;
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', heading.textContent);
  button.setAttribute('aria-controls', panel.id);

  const content = document.createElement('div');
  content.className = 'footer-disclosures-content';
  heading.classList.add('footer-sr-only');
  content.append(...section.childNodes);
  panel.append(content);
  wrapper.append(button, panel);

  const setOpen = (open) => {
    button.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
  };
  button.addEventListener('click', () => setOpen(button.getAttribute('aria-expanded') !== 'true'));

  // paragraphs that open with a bold run render it as an inline lead-in label
  content.querySelectorAll('p').forEach((p) => {
    const lead = p.firstChild;
    if (lead && lead.nodeType === Node.ELEMENT_NODE && lead.tagName === 'STRONG') {
      lead.classList.add('footer-lead-in');
      p.classList.add('footer-lead-paragraph');
    }
  });
  // a list directly under a sub-heading renders as an inline row
  content.querySelectorAll('h3 + ul, h4 + ul').forEach((ul) => ul.classList.add('footer-inline-list'));
  assignFootnoteIds(content);
  return { el: wrapper, panel, open: () => setOpen(true) };
}

// below 900px the link columns collapse into accordions (several may be open at once)
const isDesktop = window.matchMedia('(width >= 900px)');

/**
 * Turns a column heading into an accordion toggle for small screens. On desktop the
 * toggle is inert (columns are always open) and reads as the plain heading.
 * @param {Element} column
 */
function buildColumnToggle(column) {
  const heading = column.querySelector('.footer-links-title');
  const panelIds = [...column.querySelectorAll(':scope > ul')].map((ul, i) => {
    ul.classList.add('footer-links-list');
    if (!ul.id) ul.id = `${heading.id || 'footer-links'}-list-${i}`;
    return ul.id;
  });
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'footer-links-toggle';
  const label = document.createElement('span');
  label.textContent = heading.textContent.trim();
  const icon = document.createElement('span');
  icon.className = 'footer-links-chevron';
  icon.setAttribute('aria-hidden', 'true');
  button.append(label, icon);
  heading.replaceChildren(button);

  const sync = () => {
    if (isDesktop.matches) {
      button.disabled = true;
      button.removeAttribute('aria-expanded');
      button.removeAttribute('aria-controls');
    } else {
      button.disabled = false;
      button.setAttribute('aria-expanded', String(column.classList.contains('is-open')));
      button.setAttribute('aria-controls', panelIds.join(' '));
    }
  };
  button.addEventListener('click', () => {
    column.classList.toggle('is-open');
    sync();
  });
  isDesktop.addEventListener('change', sync);
  sync();
}

/**
 * Groups heading + list pairs into columns.
 * @param {Element} section
 * @returns {Element}
 */
function buildLinkColumns(section) {
  const grid = document.createElement('div');
  grid.className = 'footer-links';
  let column = null;
  [...section.children].forEach((child) => {
    if (/^H[1-6]$/.test(child.tagName)) {
      column = document.createElement('div');
      column.className = 'footer-links-column';
      child.classList.add('footer-links-title');
      column.append(child);
      grid.append(column);
    } else if (column) {
      if (child.tagName === 'UL') child.setAttribute('aria-label', column.firstElementChild.textContent);
      column.append(child);
    }
  });
  grid.querySelectorAll('.footer-links-column').forEach(buildColumnToggle);
  return grid;
}

/**
 * Brand row: leading image link (logo) + list of links.
 * @param {Element} section
 * @returns {Element}
 */
function buildBrandRow(section) {
  const row = document.createElement('div');
  row.className = 'footer-brand';
  const logoLink = section.querySelector('a img')?.closest('a');
  if (logoLink) {
    logoLink.classList.add('footer-brand-logo');
    row.append(logoLink);
  }
  section.querySelectorAll(':scope > ul').forEach((ul) => {
    ul.classList.add('footer-brand-links');
    row.append(ul);
  });
  return row;
}

/**
 * Icon row: list of image-only links.
 * @param {Element} section
 * @returns {Element}
 */
function buildIconRow(section) {
  const row = document.createElement('div');
  row.className = 'footer-social';
  const divider = document.createElement('hr');
  row.append(divider, ...section.childNodes);
  return row;
}

/**
 * Classifies a fragment section by its content shape.
 * @param {Element} section
 * @returns {string}
 */
function classifySection(section) {
  const first = section.firstElementChild;
  if (first && first.tagName === 'H2') return 'collapsible';
  const headings = section.querySelectorAll(':scope > h3, :scope > h4');
  if (headings.length >= 2 && section.querySelectorAll(':scope > ul').length >= 2) return 'columns';
  const items = [...section.querySelectorAll(':scope > ul > li')];
  if (items.length && items.every((li) => li.querySelector('a img') && !li.textContent.trim())) return 'icons';
  if (first && first.querySelector('a img')) return 'brand';
  return 'bottom';
}

/**
 * Opens the panel containing a footnote target and scrolls to it.
 * @param {string} hash
 * @param {Array} panels
 * @returns {boolean}
 */
function revealFootnote(hash, panels) {
  if (!hash || hash.length < 2) return false;
  let id;
  try {
    id = decodeURIComponent(hash.slice(1));
  } catch {
    return false;
  }
  const target = document.getElementById(id);
  if (!target) return false;
  const owner = panels.find((p) => p.panel.contains(target));
  if (!owner) return false;
  owner.open();
  target.scrollIntoView({ block: 'start' });
  target.focus({ preventScroll: true });
  return true;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooterFragment();
  block.textContent = '';
  if (!fragment) return;

  const { doc, base } = fragment;
  const sections = [...doc.body.children].filter((el) => el.tagName === 'DIV');
  rebaseMedia(doc.body, base);
  decorateLinkTargets(doc.body);
  buildConsentTriggers(doc.body);

  const panels = [];
  const main = document.createElement('div');
  main.className = 'footer-main';
  const bottom = document.createElement('div');
  bottom.className = 'footer-bottom';
  const top = document.createDocumentFragment();

  sections.forEach((section) => {
    const kind = classifySection(section);
    if (kind === 'collapsible') {
      const c = buildCollapsible(section);
      panels.push(c);
      top.append(c.el);
    } else if (kind === 'columns') {
      main.append(buildLinkColumns(section));
    } else if (kind === 'icons') {
      main.append(buildIconRow(section));
    } else if (kind === 'brand') {
      main.append(buildBrandRow(section));
    } else {
      bottom.append(...section.childNodes);
    }
  });

  block.append(top);
  if (main.children.length) block.append(main);
  if (bottom.childNodes.length) block.append(bottom);

  // page-specific footnotes are authored on the page (disclosures-footnotes block) and
  // shown at the top of the footer's Disclosures panel, ahead of the site-wide text
  const pageNotes = document.querySelector('main .disclosures-footnotes');
  if (pageNotes && panels.length) {
    const content = panels[0].panel.querySelector('.footer-disclosures-content');
    const wrapper = pageNotes.closest('.disclosures-footnotes-wrapper');
    const section = pageNotes.closest('main > .section');
    const heading = content.querySelector(':scope > .footer-sr-only');
    if (heading) heading.after(pageNotes);
    else content.prepend(pageNotes);
    pageNotes.classList.add('footer-page-notes');
    if (wrapper && !wrapper.children.length) wrapper.remove();
    if (section && !section.querySelector(':scope > div')) section.remove();
  }

  if (panels.length) {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href*="#"]');
      if (!a || e.defaultPrevented) return;
      const url = new URL(a.href, window.location.href);
      if (url.pathname !== window.location.pathname || !url.hash) return;
      if (revealFootnote(url.hash, panels)) {
        e.preventDefault();
        window.history.pushState(null, '', url.hash);
      }
    });
    window.addEventListener('hashchange', () => revealFootnote(window.location.hash, panels));
    if (window.location.hash) revealFootnote(window.location.hash, panels);
  }
}
