/* eslint-disable */
/* global WebImporter */

/**
 * Import script for the shared footer fragment (/footer -> content/footer.plain.html).
 *
 * Source: footer.global-footer on any truist.com page. Only SITE-WIDE content is
 * emitted; the page-specific footnotes group (#footer-local-disclosure-top and
 * #footer-local-disclosure-bottom) is skipped.
 *
 * Output: flat sections (one per top-level <div> after md2da), in this order:
 *   [0] Disclosures  - h2 + site-wide disclosure paragraphs / h3 / lists
 *   [1] Brand row    - logo image link + policy links list
 *   [2] Link columns - h3 + ul per footer column
 *   [3] Social icons - ul of image-only links
 *   [4] Copyright    - single paragraph
 *
 * Images are mapped to the local copies in content/images and emitted as
 * relative "images/<file>" sources (no adjustImageUrls / icon conversion).
 */

const SOURCE_HOSTS = ['www.truist.com', 'truist.com'];

// Fallback consent stub (used when the page has no OneTrust stub script tag).
const ONETRUST_FALLBACK = 'https://cdn.cookielaw.org/consent/a36cbfdc-000f-45ef-92ae-779176195d77/otSDKStub.js';

// Local image files in content/images, keyed by source file basename.
const LOCAL_IMAGES = {
  'truist-logo.svg': 'truist-logo.svg',
  'equal-housing-opportunity.webp': 'equal-housing-opportunity.webp',
  'x-solid.svg': 'x-solid.svg',
  'linkedin-solid-white.svg': 'linkedin-solid-white.svg',
  'facebook-solid-white.svg': 'facebook-solid-white.svg',
  'youtube-solid-white.svg': 'youtube-solid-white.svg',
  'instagram-white.svg': 'instagram-white.svg',
};

// Alt-text fallbacks when the basename does not match.
const LOCAL_IMAGES_BY_ALT = {
  truist: 'truist-logo.svg',
  x: 'x-solid.svg',
  linkedin: 'linkedin-solid-white.svg',
  facebook: 'facebook-solid-white.svg',
  youtube: 'youtube-solid-white.svg',
  instagram: 'instagram-white.svg',
};

/** Collapses whitespace runs (keeps &nbsp; as a regular space). */
function cleanText(text) {
  return (text || '').replace(/[\s ]+/g, ' ').trim();
}

/** Text of an element without screen-reader-only helper words. */
function visibleText(el) {
  const clone = el.cloneNode(true);
  clone.querySelectorAll('.sr-only, .footer-icon').forEach((n) => n.remove());
  return cleanText(clone.textContent);
}

/** truist.com absolute URLs -> site-relative; everything else untouched. */
function normalizeHref(href) {
  if (!href) return href;
  const raw = href.trim();
  if (/^(tel:|mailto:|#)/i.test(raw)) return raw;
  let url;
  try {
    url = new URL(raw, 'https://www.truist.com/');
  } catch (e) {
    return raw;
  }
  if (!SOURCE_HOSTS.includes(url.hostname)) return /^https?:\/\//i.test(raw) ? raw : url.href;
  return `${url.pathname}${url.search}${url.hash}`;
}

/** Resolves a source <img> to a local images/<file> path. */
function localImageSrc(img) {
  const src = (img.getAttribute('src') || '').split('?')[0];
  const base = src.split('/').pop();
  if (LOCAL_IMAGES[base]) return `images/${LOCAL_IMAGES[base]}`;
  const alt = cleanText(img.getAttribute('alt')).toLowerCase();
  if (LOCAL_IMAGES_BY_ALT[alt]) return `images/${LOCAL_IMAGES_BY_ALT[alt]}`;
  return null;
}

/**
 * Deep-copies inline content of a source node into a new parent, keeping only
 * semantic inline markup (a, strong, em, sup, sub, br, img) without attributes
 * other than href/src/alt.
 */
function copyInline(doc, from, to) {
  [...from.childNodes].forEach((node) => {
    if (node.nodeType === 3) {
      to.append(doc.createTextNode(node.textContent.replace(/[\s ]+/g, ' ')));
      return;
    }
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toLowerCase();
    if (node.classList.contains('sr-only')) return;
    if (tag === 'a') {
      if (!node.getAttribute('href')) {
        copyInline(doc, node, to);
        return;
      }
      const a = doc.createElement('a');
      a.setAttribute('href', normalizeHref(node.getAttribute('href')));
      copyInline(doc, node, a);
      to.append(a);
    } else if (tag === 'img') {
      const local = localImageSrc(node);
      if (!local) return;
      const img = doc.createElement('img');
      img.setAttribute('src', local);
      img.setAttribute('alt', node.getAttribute('alt') || '');
      to.append(img);
    } else if (['strong', 'b', 'em', 'i', 'sup', 'sub'].includes(tag)) {
      const map = { b: 'strong', i: 'em' };
      const el = doc.createElement(map[tag] || tag);
      copyInline(doc, node, el);
      to.append(el);
    } else if (tag === 'br') {
      to.append(doc.createElement('br'));
    } else {
      copyInline(doc, node, to);
    }
  });
}

/** Trims leading/trailing whitespace text in a freshly built inline container. */
function trimInline(el) {
  const first = el.firstChild;
  if (first && first.nodeType === 3) first.textContent = first.textContent.replace(/^\s+/, '');
  const last = el.lastChild;
  if (last && last.nodeType === 3) last.textContent = last.textContent.replace(/\s+$/, '');
  return el;
}

function makeEl(doc, tag, source) {
  const el = doc.createElement(tag);
  copyInline(doc, source, el);
  return trimInline(el);
}

function makeList(doc, ul) {
  const list = doc.createElement('ul');
  ul.querySelectorAll(':scope > li').forEach((li) => {
    const item = makeEl(doc, 'li', li);
    if (item.textContent.trim() || item.querySelector('img')) list.append(item);
  });
  return list;
}

/** [0] Site-wide disclosures (excludes #footer-local-disclosure-*). */
function buildDisclosures(doc, footer) {
  const section = doc.createElement('div');
  const container = footer.querySelector('#footer-section-disclosure-container') || footer;
  const groups = [...container.querySelectorAll('.htmlcontainer')]
    .filter((g) => !g.closest('#footer-local-disclosure-top, #footer-local-disclosure-bottom'))
    .filter((g) => cleanText(g.textContent));

  const walk = (parent) => {
    [...parent.children].forEach((el) => {
      const tag = el.tagName.toLowerCase();
      if (el.classList.contains('footer-heading-inline-group')) {
        // h3 + p rendered as a single run-in paragraph: <p><strong>Label</strong> text</p>
        const h = el.querySelector('h3, h4');
        const p = el.querySelector('p');
        const out = doc.createElement('p');
        if (h) {
          const strong = doc.createElement('strong');
          strong.textContent = cleanText(h.textContent);
          out.append(strong, doc.createTextNode(' '));
        }
        if (p) copyInline(doc, p, out);
        section.append(trimInline(out));
      } else if (/^h[1-6]$/.test(tag)) {
        const level = tag === 'h2' ? 'h2' : 'h3';
        section.append(makeEl(doc, level, el));
      } else if (tag === 'p') {
        const p = makeEl(doc, 'p', el);
        if (p.textContent.trim() || p.querySelector('img')) section.append(p);
      } else if (tag === 'ul' || tag === 'ol') {
        section.append(makeList(doc, el));
      } else if (tag === 'div') {
        walk(el);
      }
    });
  };
  groups.forEach(walk);

  // the panel toggle label: make sure the section starts with the h2
  if (!section.querySelector('h2')) {
    const h2 = doc.createElement('h2');
    h2.textContent = 'Disclosures';
    section.prepend(h2);
  }
  return section;
}

/** [1] Brand row: logo + policy links. */
function buildBrand(doc, footer) {
  const section = doc.createElement('div');
  const logoWrap = footer.querySelector('.footer-nav-item--logo');
  const logoImg = logoWrap && logoWrap.querySelector('img.footer__logo, img');
  if (logoImg) {
    const p = doc.createElement('p');
    const a = doc.createElement('a');
    const link = logoWrap.querySelector('a');
    a.setAttribute('href', normalizeHref(link ? link.getAttribute('href') : '/'));
    const img = doc.createElement('img');
    img.setAttribute('src', localImageSrc(logoImg) || 'images/truist-logo.svg');
    img.setAttribute('alt', cleanText(logoImg.getAttribute('alt')) || 'Truist');
    a.append(img);
    p.append(a);
    section.append(p);
  }
  const policies = footer.querySelector('ul.footer-nav--disclosures');
  if (policies) section.append(makeList(doc, policies));
  return section;
}

/** [2] Link columns: heading (rendered as accordion title on source) + list. */
function buildColumns(doc, footer, consentUrl) {
  const section = doc.createElement('div');
  footer.querySelectorAll('.footer__links-container .footer__details__header').forEach((col) => {
    const title = col.querySelector('.accordion__title');
    const h3 = doc.createElement('h3');
    h3.textContent = title ? visibleText(title) : '';
    section.append(h3);
    const ul = doc.createElement('ul');
    col.querySelectorAll('.accordion__content ul > li').forEach((li) => {
      const a = li.querySelector('a[href]');
      const button = li.querySelector('button');
      const item = doc.createElement('li');
      const link = doc.createElement('a');
      if (a) {
        link.setAttribute('href', normalizeHref(a.getAttribute('href')));
        link.textContent = visibleText(a);
      } else if (button) {
        // OneTrust "Do not sell or share" button -> link to the consent SDK stub;
        // footer.js turns it back into a preference-center button.
        link.setAttribute('href', consentUrl);
        link.textContent = visibleText(button);
      } else {
        return;
      }
      item.append(link);
      ul.append(item);
    });
    section.append(ul);
  });
  return section;
}

/** [3] Social icons. */
function buildSocial(doc, footer) {
  const section = doc.createElement('div');
  const ul = doc.createElement('ul');
  footer.querySelectorAll('ul.footer-nav--social > li').forEach((li) => {
    const a = li.querySelector('a[href]');
    const srcImg = li.querySelector('img');
    if (!a || !srcImg) return;
    const local = localImageSrc(srcImg);
    if (!local) return;
    const item = doc.createElement('li');
    const link = doc.createElement('a');
    link.setAttribute('href', normalizeHref(a.getAttribute('href')));
    const img = doc.createElement('img');
    img.setAttribute('src', local);
    img.setAttribute('alt', cleanText(srcImg.getAttribute('alt')));
    link.append(img);
    item.append(link);
    ul.append(item);
  });
  section.append(ul);
  return section;
}

/** [4] Copyright. */
function buildCopyright(doc, footer) {
  const section = doc.createElement('div');
  const legal = footer.querySelector('.footer__legal');
  if (legal) {
    const p = doc.createElement('p');
    p.textContent = cleanText(legal.textContent).replace(/\s+,/g, ',');
    section.append(p);
  }
  return section;
}

function findConsentUrl(document) {
  const stub = document.querySelector('script[src*="cdn.cookielaw.org/consent/"][src$="otSDKStub.js"]');
  return stub ? stub.getAttribute('src') : ONETRUST_FALLBACK;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const footer = document.querySelector('footer.global-footer') || document.querySelector('footer');
    if (!footer) throw new Error('footer.global-footer not found on source page');

    const consentUrl = findConsentUrl(document);
    const sections = [
      buildDisclosures(document, footer),
      buildBrand(document, footer),
      buildColumns(document, footer, consentUrl),
      buildSocial(document, footer),
      buildCopyright(document, footer),
    ];

    const counts = {
      disclosureParagraphs: sections[0].querySelectorAll('p').length,
      policyLinks: sections[1].querySelectorAll('li').length,
      columns: sections[2].querySelectorAll('h3').length,
      columnLinks: sections[2].querySelectorAll('li').length,
      socialLinks: sections[3].querySelectorAll('li').length,
      images: sections.reduce((n, s) => n + s.querySelectorAll('img').length, 0),
    };

    // Sections are separated by <hr> so html2md/md2da emit one top-level <div> each.
    const main = document.createElement('div');
    sections.forEach((section, i) => {
      if (i > 0) main.append(document.createElement('hr'));
      main.append(...section.childNodes);
    });

    return [{
      element: main,
      path: '/footer',
      report: {
        title: 'footer',
        source: params?.originalURL || url,
        sections: sections.length,
        ...counts,
      },
    }];
  },
};
