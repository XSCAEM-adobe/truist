import { loadCSS } from '../../scripts/aem.js';
import { buildSignInPanel } from '../hero-login/hero-login.js';

// desktop layout starts at 900px (mobile-first; hamburger below)
const isDesktop = window.matchMedia('(width >= 900px)');
const SIGN_IN_RE = /^sign\s*in$/i;

const SECTION_ORDER = ['utility', 'brand', 'sections', 'tools'];
const CALLOUT_STYLE_RE = /^style:\s*([a-z0-9-]+)\s*$/i;
let idCounter = 0;

/**
 * Fetches the nav fragment. Metadata-independent dual fetch:
 * /content first (localhost / aem up), then the site root (DA/EDS production).
 * @returns {Promise<{doc: Document, base: string}|null>}
 */
async function fetchNavFragment() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return { doc, base: resp.url };
}

function nextId(prefix) {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/**
 * Returns the direct (own) text label of a list item, ignoring nested lists.
 * @param {Element} li
 */
function getOwnLabel(li) {
  const parts = [];
  li.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) parts.push(n.textContent);
    else if (n.nodeType === Node.ELEMENT_NODE && n.tagName === 'P') parts.push(n.textContent);
  });
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Wraps the visible text of an element in a span that reserves its bold width,
 * so hover/active weight changes never shift the layout.
 * @param {Element} el link or button
 * @param {string} [text] label (defaults to the element text)
 */
function wrapLabel(el, text) {
  const label = (text ?? el.textContent).replace(/\s+/g, ' ').trim();
  const span = document.createElement('span');
  span.className = 'nav-link-text';
  span.dataset.text = label;
  span.textContent = label;
  el.replaceChildren(span);
  return el;
}

/**
 * Document Authoring wraps list-item text in paragraphs (<li><p>label</p><ul>…);
 * unwrap them so list items read the same as hand-written markup.
 * @param {Element} root
 */
function unwrapListParagraphs(root) {
  root.querySelectorAll('li > p').forEach((p) => p.replaceWith(...p.childNodes));
}

function setExpanded(trigger, expanded) {
  trigger.setAttribute('aria-expanded', expanded ? 'true' : 'false');
}

/**
 * Collapses every open dropdown/megamenu in the nav (optionally keeping one).
 * @param {Element} nav
 * @param {Element} [except]
 */
function closeAllPanels(nav, except) {
  nav.querySelectorAll('[data-panel-trigger][aria-expanded="true"]').forEach((t) => {
    if (t !== except) setExpanded(t, false);
  });
}

/**
 * Wires a trigger (link or button) to toggle the panel that follows it.
 * @param {Element} nav
 * @param {Element} trigger
 * @param {Element} panel
 */
function bindPanelTrigger(nav, trigger, panel) {
  if (!panel.id) panel.id = nextId('nav-panel-target');
  trigger.dataset.panelTrigger = '';
  trigger.setAttribute('aria-controls', panel.id);
  setExpanded(trigger, false);
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    const open = trigger.getAttribute('aria-expanded') === 'true';
    closeAllPanels(nav, trigger);
    setExpanded(trigger, !open);
  });
}

/**
 * Turns links inside a fragment list into decorated nav links.
 * @param {Element} ul
 * @param {string} linkClass
 */
function decorateLinkList(ul, linkClass) {
  ul.querySelectorAll(':scope > li').forEach((li) => {
    const strong = li.querySelector(':scope > strong');
    if (strong) {
      li.classList.add('active');
      strong.replaceWith(...strong.childNodes);
    }
    const a = li.querySelector(':scope > a');
    if (a) {
      a.className = linkClass;
      wrapLabel(a);
    }
  });
}

/**
 * Converts a fragment list item made of "label + nested list" into a
 * button-triggered dropdown. The links are kept as a list, or flattened into a
 * plain link group when asList is false.
 * @param {Element} nav
 * @param {Element} li
 * @param {string} buttonClass
 * @param {boolean} [asList]
 */
function buildListDropdown(nav, li, buttonClass, asList = true) {
  let list = li.querySelector(':scope > ul');
  if (!asList) {
    const group = document.createElement('div');
    group.append(...list.querySelectorAll(':scope > li > a'));
    list = group;
  }
  const label = getOwnLabel(li);
  const button = document.createElement('button');
  button.type = 'button';
  button.className = buttonClass;
  wrapLabel(button, label);
  list.className = 'nav-dropdown';
  list.querySelectorAll(':scope > li > a, :scope > a').forEach((a) => {
    a.className = 'nav-dropdown-link';
    wrapLabel(a);
  });
  li.replaceChildren(button, list);
  li.classList.add('nav-item-dropdown');
  bindPanelTrigger(nav, button, list);
  return li;
}

/**
 * A link whose title repeats the end of its text marks that trailing part as
 * screen-reader-only supplemental text (visible label + hidden suffix).
 * @param {Element} a
 */
function splitScreenReaderSuffix(a) {
  const suffix = (a.getAttribute('title') || '').trim();
  const text = a.textContent.replace(/\s+/g, ' ').trim();
  if (!suffix || !text.endsWith(suffix) || text === suffix) return;
  const sr = document.createElement('span');
  sr.className = 'visually-hidden';
  sr.textContent = suffix;
  a.replaceChildren(`${text.slice(0, -suffix.length).trim()} `, sr);
  a.removeAttribute('title');
}

/**
 * Builds a promotional callout card from a fragment blockquote.
 * Optional first paragraph "Style: <name>" selects the card colour theme.
 * A CTA link title marks its screen-reader-only suffix (see splitScreenReaderSuffix).
 * @param {Element} quote
 */
function buildCallout(quote) {
  const callout = document.createElement('div');
  callout.className = 'nav-callout';
  const card = document.createElement('div');
  card.className = 'nav-callout-card';
  const body = document.createElement('div');
  body.className = 'nav-callout-body';
  [...quote.children].forEach((child) => {
    const styleMatch = child.tagName === 'P' && child.textContent.trim().match(CALLOUT_STYLE_RE);
    if (styleMatch) {
      card.classList.add(`nav-callout-${styleMatch[1].toLowerCase()}`);
      return;
    }
    if (/^H[1-6]$/.test(child.tagName)) {
      child.classList.add('nav-callout-title');
    } else if (child.tagName === 'P' && child.querySelector('a')) {
      child.classList.add('nav-callout-cta');
      child.querySelectorAll('a').forEach((a) => {
        a.className = 'nav-callout-link';
        splitScreenReaderSuffix(a);
      });
    } else if (child.tagName === 'P') {
      child.classList.add('nav-callout-text');
    }
    body.append(child);
  });
  card.append(body);
  callout.append(card);
  return callout;
}

/**
 * Builds a megamenu panel from a fragment section: every heading starts a
 * column, the lists that follow it become that column's link lists, and a
 * blockquote becomes the promotional callout.
 * @param {Element} section fragment section (its h2 already removed)
 */
function buildMegamenu(section) {
  const panel = document.createElement('div');
  panel.className = 'nav-megamenu';
  const inner = document.createElement('div');
  inner.className = 'nav-megamenu-inner';
  const groups = document.createElement('div');
  groups.className = 'nav-megamenu-groups';
  inner.append(groups);
  let column = null;
  let lists = null;
  const ensureColumn = () => {
    if (column) return;
    column = document.createElement('div');
    column.className = 'nav-megamenu-col';
    lists = document.createElement('div');
    lists.className = 'nav-megamenu-lists';
    column.append(lists);
    groups.append(column);
  };
  [...section.children].forEach((child) => {
    if (/^H[1-6]$/.test(child.tagName)) {
      column = null;
      ensureColumn();
      child.classList.add('nav-megamenu-heading');
      column.prepend(child);
    } else if (child.tagName === 'UL' || child.tagName === 'OL') {
      ensureColumn();
      child.querySelectorAll('a').forEach((a) => {
        a.className = 'nav-megamenu-link';
        a.dataset.text = a.textContent.trim();
      });
      lists.append(child);
    } else if (child.tagName === 'BLOCKQUOTE') {
      inner.append(buildCallout(child));
    } else {
      ensureColumn();
      lists.append(child);
    }
  });
  panel.append(inner);
  return panel;
}

/**
 * Builds the primary navigation list; items whose label matches a panel
 * section become megamenu triggers, items with nested lists become dropdowns.
 * @param {Element} nav
 * @param {Element} section
 * @param {Map<string, Element>} panels label -> panel section
 */
function buildPrimaryNav(nav, section, panels) {
  const list = section.querySelector('ul');
  if (!list) return section;
  list.querySelectorAll(':scope > li').forEach((li) => {
    li.classList.add('nav-item');
    const link = li.querySelector(':scope > a');
    if (link) {
      link.className = 'nav-link';
      wrapLabel(link);
      return;
    }
    const label = getOwnLabel(li);
    const panelSection = panels.get(label.toLowerCase());
    if (panelSection) {
      const trigger = document.createElement('a');
      trigger.href = '#';
      trigger.className = 'nav-link';
      trigger.setAttribute('role', 'button');
      wrapLabel(trigger, label);
      const panel = buildMegamenu(panelSection);
      li.replaceChildren(trigger, panel);
      li.classList.add('nav-item-mega', 'nav-item-dropdown');
      bindPanelTrigger(nav, trigger, panel);
    } else if (li.querySelector(':scope > ul')) {
      buildListDropdown(nav, li, 'nav-link nav-list-toggle');
    }
  });
  return section;
}

/**
 * Mobile segment switcher: a toggle showing the current segment that reveals
 * the other segments (hidden on desktop, where the segments render inline).
 * @param {Element} nav
 * @param {Element} segments the segments list
 */
function buildSegmentToggle(nav, segments) {
  const active = segments.querySelector(':scope > li.active') || segments.querySelector(':scope > li');
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'nav-segment-toggle';
  wrapLabel(button, active ? active.textContent : '');
  bindPanelTrigger(nav, button, segments);
  return button;
}

function buildUtility(nav, section) {
  const skip = section.querySelector(':scope > p > a[href^="#"]');
  if (skip) {
    skip.className = 'nav-skip';
    skip.closest('p').replaceWith(skip);
  }
  section.querySelectorAll(':scope > ul').forEach((ul, i) => {
    ul.className = i === 0 ? 'nav-segments' : 'nav-utility-links';
    ul.querySelectorAll(':scope > li').forEach((li) => {
      if (!li.querySelector(':scope > a') && li.querySelector(':scope > ul')) {
        buildListDropdown(nav, li, 'nav-utility-link nav-list-toggle', false);
      }
    });
    decorateLinkList(ul, 'nav-utility-link');
  });
  const segments = section.querySelector(':scope > .nav-segments');
  if (segments) segments.before(buildSegmentToggle(nav, segments));
  return section;
}

function buildBrand(section) {
  const link = section.querySelector('a');
  if (!link) return section;
  link.className = 'nav-brand-link';
  link.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE && n.textContent.trim()) {
      const sr = document.createElement('span');
      sr.className = 'visually-hidden';
      sr.textContent = n.textContent.trim();
      n.replaceWith(sr);
    }
  });
  const p = link.closest('p');
  if (p) p.replaceWith(link);
  return section;
}

/**
 * Shows or hides a full-screen sign-in overlay and its trigger state.
 * @param {Element} trigger
 * @param {Element} overlay
 * @param {boolean} open
 */
function setSignInOpen(trigger, overlay, open) {
  overlay.hidden = !open;
  // dialog trigger: aria-haspopup=dialog announces it; aria-expanded is not used for modals
  trigger.classList.toggle('is-open', open);
  document.body.style.overflowY = open ? 'hidden' : '';
  if (open) overlay.querySelector('.nav-signin-close').focus();
}

/**
 * A tools item whose nested list includes a link labelled exactly "Sign in"
 * becomes a sign-in trigger (mobile-only) plus a full-screen overlay holding the
 * generated sign-in form. The "Sign in" link is the form's destination, the
 * other links are the form's helper links (see hero-login buildSignInPanel).
 * @param {Element} nav
 * @param {Element} li
 * @returns {Node[]}
 */
function buildSignIn(nav, li) {
  const label = getOwnLabel(li);
  const links = document.createElement('div');
  li.querySelectorAll(':scope > ul > li > a').forEach((a) => {
    const p = document.createElement('p');
    p.append(a);
    links.append(p);
  });

  const trigger = document.createElement('button');
  trigger.type = 'button';
  trigger.className = 'nav-signin-toggle';
  trigger.setAttribute('aria-haspopup', 'dialog');
  wrapLabel(trigger, label);

  const overlay = document.createElement('div');
  overlay.className = 'nav-signin-overlay';
  overlay.id = nextId('nav-signin');
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', label);
  overlay.hidden = true;
  trigger.setAttribute('aria-controls', overlay.id);

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'nav-signin-close';
  close.setAttribute('aria-label', 'Close');

  // the sign-in form and its styles are shared with the hero-login block
  loadCSS(`${window.hlx.codeBasePath}/blocks/hero-login/hero-login.css`);
  const body = document.createElement('div');
  body.className = 'hero-login nav-signin-body';
  body.append(buildSignInPanel(links));
  overlay.append(close, body);

  trigger.addEventListener('click', () => {
    closeAllPanels(nav);
    setSignInOpen(trigger, overlay, true);
  });
  close.addEventListener('click', () => {
    setSignInOpen(trigger, overlay, false);
    trigger.focus();
  });
  return [trigger, overlay];
}

/**
 * Builds call-to-action controls; returned nodes are placed directly in the
 * main row. List items with nested lists become CTA dropdown buttons.
 * @param {Element} nav
 * @param {Element} section
 * @returns {Node[]}
 */
function buildTools(nav, section) {
  const out = [];
  section.querySelectorAll(':scope > ul > li').forEach((li) => {
    const sub = li.querySelector(':scope > ul');
    const signIn = sub && [...sub.querySelectorAll('a')].some((a) => SIGN_IN_RE.test(a.textContent.trim()));
    if (signIn) {
      out.push(...buildSignIn(nav, li));
    } else if (sub) {
      const item = buildListDropdown(nav, li, 'nav-cta');
      out.push(...item.children);
    } else {
      const a = li.querySelector('a');
      if (a) {
        a.className = 'nav-cta';
        out.push(a);
      }
    }
  });
  return out;
}

function toggleMenu(nav, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  if (button) button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
}

function resolveImages(root, base) {
  root.querySelectorAll('img[src]').forEach((img) => {
    img.setAttribute('src', new URL(img.getAttribute('src'), base).href);
    img.loading = 'eager';
  });
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNavFragment();
  block.textContent = '';
  if (!fragment) return;
  const { doc, base } = fragment;
  resolveImages(doc.body, base);
  unwrapListParagraphs(doc.body);

  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-label', 'Main');

  const sections = [...doc.body.querySelectorAll(':scope > div')];
  const panels = new Map();
  const named = {};
  sections.forEach((section) => {
    const first = section.firstElementChild;
    if (first && first.tagName === 'H2') {
      panels.set(first.textContent.replace(/\s+/g, ' ').trim().toLowerCase(), section);
      first.remove();
    } else {
      const name = SECTION_ORDER[Object.keys(named).length];
      if (name) named[name] = section;
    }
  });

  const utility = named.utility ? buildUtility(nav, named.utility) : document.createElement('div');
  utility.className = 'nav-utility';

  const main = document.createElement('div');
  main.className = 'nav-main';
  if (named.brand) {
    named.brand.className = 'nav-brand';
    main.append(buildBrand(named.brand));
  }
  if (named.sections) {
    named.sections.className = 'nav-sections';
    main.append(buildPrimaryNav(nav, named.sections, panels));
  }
  if (named.tools) main.append(...buildTools(nav, named.tools));

  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  const hamburgerButton = document.createElement('button');
  hamburgerButton.type = 'button';
  hamburgerButton.setAttribute('aria-controls', 'nav');
  hamburgerButton.setAttribute('aria-label', 'Open navigation');
  hamburgerButton.innerHTML = '<span class="nav-hamburger-icon"></span>';
  hamburgerButton.addEventListener('click', () => {
    if (!isDesktop.matches) toggleMenu(nav);
  });
  hamburger.append(hamburgerButton);

  nav.append(hamburger, utility, main);
  nav.setAttribute('aria-expanded', 'false');

  // close panels on outside click and Escape
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target)) closeAllPanels(nav);
  });
  const closeSignIn = () => {
    const overlay = nav.querySelector('.nav-signin-overlay:not([hidden])');
    if (!overlay) return false;
    const trigger = nav.querySelector(`[aria-controls="${overlay.id}"]`);
    setSignInOpen(trigger, overlay, false);
    return trigger;
  };
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const signInTrigger = closeSignIn();
    if (signInTrigger) {
      signInTrigger.focus();
      return;
    }
    const open = nav.querySelector('[data-panel-trigger][aria-expanded="true"]');
    closeAllPanels(nav);
    if (open && nav.contains(document.activeElement)) open.focus();
    if (!isDesktop.matches && nav.getAttribute('aria-expanded') === 'true') toggleMenu(nav, false);
  });

  // reset state when crossing the desktop breakpoint
  isDesktop.addEventListener('change', () => {
    closeAllPanels(nav);
    closeSignIn();
    toggleMenu(nav, false);
  });

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
