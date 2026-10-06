/* eslint-disable */
/* global WebImporter */
/**
 * Parser for disclosures-footnotes. Base: disclosures (custom).
 * Source: https://www.truist.com/money-mindset/principles/outsmarting-debt/how-when-to-consolidate-debt
 * Also validated on: https://www.truist.com/money-mindset/principles/outsmarting-debt/secured-vs-unsecured-loans
 * Selectors validated against migration-work/block-context/disclosures-footnotes/source.html
 *
 * Element: .footer-local-disclosure-top-orientation-change (moved to the end of <main> by
 * transformers/truist-cleanup.js on article pages; still inside the footer in raw DOM).
 *
 * Output (per blocks/disclosures-footnotes/README.md): one row per paragraph, 1 cell
 *   Row 1 (optional): italic general disclaimer, no marker
 *   Footnote rows   : <p><sup>N</sup> citation text with links</p>
 * Normalisation: the <sup> marker is always emitted first (rep page has it inside <em>, the
 * gap page before <em>); sr-only "Disclosure"/"footnote" spans and empty name anchors
 * (<a name="disc1">) are dropped - the block re-creates the disc{N} ids from the marker.
 */
function unwrap(el) {
  el.replaceWith(...el.childNodes);
}

function cleanParagraph(document, p) {
  const clone = p.cloneNode(true);
  clone.querySelectorAll('.sr-only, .visually-hidden').forEach((n) => n.remove());
  // empty named anchors used as jump targets
  clone.querySelectorAll('a').forEach((a) => {
    if (!a.getAttribute('href') && !a.textContent.trim()) a.remove();
  });
  // links: keep href only
  clone.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    [...a.attributes].forEach((attr) => a.removeAttribute(attr.name));
    a.setAttribute('href', href);
  });
  // nested emphasis inside emphasis is redundant
  clone.querySelectorAll('em em, i i, em i, i em').forEach(unwrap);
  clone.querySelectorAll('[class], [id], [style]').forEach((n) => {
    n.removeAttribute('class');
    n.removeAttribute('id');
    n.removeAttribute('style');
  });

  const out = document.createElement('p');
  const sup = clone.querySelector('sup');
  const supText = sup ? sup.textContent.replace(/\s+/g, '') : '';
  // A footnote marker: the sup is the first text in the paragraph
  const isFootnote = sup && supText
    && clone.textContent.replace(/\s+/g, '').indexOf(supText) === 0;

  if (isFootnote) {
    const marker = document.createElement('sup');
    marker.textContent = supText;
    sup.remove();
    // drop elements left empty by removing the marker (e.g. leading whitespace in <em>)
    out.append(marker, document.createTextNode(' '));
    const rest = document.createElement('div');
    rest.innerHTML = clone.innerHTML.replace(/^(\s|&nbsp;)+/, '');
    // trim leading whitespace inside a leading inline wrapper
    let first = rest.firstChild;
    while (first && first.nodeType === 1 && first.firstChild) {
      if (first.firstChild.nodeType === 3) {
        first.firstChild.textContent = first.firstChild.textContent.replace(/^\s+/, '');
        break;
      }
      first = first.firstChild;
    }
    out.append(...rest.childNodes);
  } else {
    out.innerHTML = clone.innerHTML.trim();
  }
  return out;
}

/**
 * Homepage footnotes can be a <div class="disc-anchor"> instead of a <p>: the marker and
 * lead sentence are loose inline content, followed by <p>/<ul> blocks (Balance Buffer
 * qualification lists). Validated on runs/home/cleaned.html (#disc01-content).
 * Returns one cell: the marker paragraph, then the remaining blocks (cleaned).
 */
function cleanDivFootnote(document, div) {
  const lead = document.createElement('p');
  const rest = [];
  [...div.childNodes].forEach((n) => {
    const isBlock = n.nodeType === 1 && /^(P|UL|OL|DIV)$/.test(n.tagName);
    if (!isBlock && !rest.length) {
      lead.append(n.cloneNode(true));
    } else if (isBlock && n.textContent.replace(/[\s ]+/g, '')) {
      rest.push(n);
    }
  });
  const out = [cleanParagraph(document, lead)];
  rest.forEach((n) => {
    if (n.tagName === 'P') {
      out.push(cleanParagraph(document, n));
      return;
    }
    const list = n.cloneNode(true);
    list.querySelectorAll('[class], [id], [style]').forEach((x) => {
      x.removeAttribute('class');
      x.removeAttribute('id');
      x.removeAttribute('style');
    });
    out.push(list);
  });
  return out.filter((el) => el.textContent.trim());
}

export default function parse(element, { document }) {
  const divNotes = [...element.querySelectorAll('div.disc-anchor')];
  const inDivNote = (p) => divNotes.some((d) => d.contains(p));
  const paragraphs = [...element.querySelectorAll('.author-rte-styling p, .text p, div.disc-anchor')]
    .filter((p, i, arr) => arr.indexOf(p) === i)
    .filter((p) => p.tagName === 'DIV' || !inDivNote(p))
    .filter((p) => p.textContent.replace(/\s+/g, ' ').trim());
  const source = paragraphs.length ? paragraphs : [...element.querySelectorAll('p')]
    .filter((p) => p.textContent.trim());

  const cells = source.map((p) => (p.tagName === 'DIV'
    ? [cleanDivFootnote(document, p)]
    : [cleanParagraph(document, p)]))
    .filter(([c]) => (Array.isArray(c) ? c.length : c.textContent.trim()));

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'disclosures-footnotes', cells });
  element.replaceWith(block);
}
