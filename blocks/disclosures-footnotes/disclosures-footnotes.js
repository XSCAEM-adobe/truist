/**
 * disclosures-footnotes: page-specific disclaimer + numbered footnotes.
 *
 * Each row/cell holds paragraphs. A paragraph that starts with a superscript
 * marker (<sup>1</sup> text) is a footnote and receives an id body links
 * can target (href="#disc1"):
 *   digits "N"            -> disc{N}
 *   "†" repeated k times  -> disc0, disc01, disc02 ... ("‡" counts as "††")
 * Paragraphs without a marker are general disclaimer text.
 *
 * Id conflicts: the page block wins over the site footer (which assigns the
 * same ids to homepage disclosures) - a matching id in the footer is removed.
 * A duplicate inside the page content itself keeps the first occurrence.
 */

export function footnoteIdFromMarker(marker) {
  const m = marker.replace(/\s+/g, '').replace(/‡/g, '††');
  if (/^\d+$/.test(m)) return `disc${m}`;
  if (/^†+$/.test(m)) return `disc0${m.length > 1 ? m.length - 1 : ''}`;
  return null;
}

function markerOf(p) {
  const first = p.firstElementChild;
  if (!first || first.tagName !== 'SUP') return null;
  const marker = first.textContent.trim();
  if (!marker || p.textContent.trim().indexOf(marker) !== 0) return null;
  return marker;
}

/**
 * Assigns the id unless another page element already owns it.
 * @param {Element} el footnote paragraph
 * @param {string} id
 * @param {Set<string>} claimed ids already used by this block
 */
function claimId(el, id, claimed) {
  if (claimed.has(id)) return;
  const existing = document.getElementById(id);
  if (existing) {
    // a duplicate in the page content itself: keep the first occurrence
    if (!existing.closest('footer, .footer')) return;
    // page-specific footnote wins over the footer's homepage disclosure
    existing.removeAttribute('id');
    existing.removeAttribute('tabindex');
  }
  el.id = id;
  el.tabIndex = -1;
  claimed.add(id);
}

const BLOCK_LEVEL = new Set(['P', 'UL', 'OL', 'DIV', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE']);

function toParagraphs(cell) {
  const nodes = [...cell.childNodes].filter((n) => n.nodeType === Node.ELEMENT_NODE
    || (n.nodeType === Node.TEXT_NODE && n.textContent.trim()));
  if (!nodes.length) return [];
  // a cell holding only inline content (e.g. "<sup>1</sup> text") becomes one paragraph
  if (!nodes.some((n) => n.nodeType === Node.ELEMENT_NODE && BLOCK_LEVEL.has(n.tagName))) {
    const p = document.createElement('p');
    p.append(...nodes);
    return [p];
  }
  return nodes.map((n) => {
    if (n.nodeType === Node.ELEMENT_NODE) return n;
    const p = document.createElement('p');
    p.textContent = n.textContent.trim();
    return p;
  });
}

export default function decorate(block) {
  const list = document.createElement('div');
  list.className = 'disclosures-footnotes-list';
  const claimed = new Set();

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      toParagraphs(cell).forEach((el) => {
        const marker = el.tagName === 'P' ? markerOf(el) : null;
        if (marker) {
          el.classList.add('disclosures-footnotes-note');
          el.firstElementChild.classList.add('disclosures-footnotes-marker');
          const id = footnoteIdFromMarker(marker);
          if (id) claimId(el, id, claimed);
        } else {
          el.classList.add('disclosures-footnotes-disclaimer');
        }
        list.append(el);
      });
    });
  });

  block.replaceChildren(list);
}
