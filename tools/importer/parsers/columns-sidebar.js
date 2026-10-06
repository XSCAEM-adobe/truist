/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-sidebar. Base: columns.
 * Source: https://www.truist.com/money-mindset/principles/outsmarting-debt/secured-vs-unsecured-loans
 *   (only article page with this block; not present on how-when-to-consolidate-debt)
 * Selectors validated against migration-work/block-context/columns-sidebar/source.html
 *
 * Output (per blocks/columns-sidebar/README.md): 1 row x 2 cells
 *   Left : body paragraph(s) (links preserved)
 *   Right: icon image (lazy data-src, *.svg gets ?img=1), label paragraph, bulleted list
 * The right column is the inner .gridlayoutcontainer holding .grid__bg-color--midnight-purple.
 */
const CONTENT_TAGS = 'h2, h3, h4, h5, h6, p, ul, ol';

function fixImage(document, img) {
  if (!img) return null;
  const lazy = img.getAttribute('data-src');
  const raw = img.getAttribute('src') || '';
  let src = (lazy && (!raw || raw.startsWith('data:'))) ? lazy : raw;
  if (!src || src.startsWith('data:')) return null;
  // helix-importer turns <img src="*.svg"> into :icon: tokens; keep it a real image
  if (/\.svg$/i.test(src)) src = `${src}?img=1`;
  const out = document.createElement('img');
  out.setAttribute('src', src);
  out.setAttribute('alt', img.getAttribute('alt') || '');
  return out;
}

function cleanClone(node) {
  const clone = node.cloneNode(true);
  clone.querySelectorAll('.sr-only, .visually-hidden').forEach((n) => n.remove());
  clone.querySelectorAll('[class]').forEach((n) => n.removeAttribute('class'));
  clone.removeAttribute('class');
  return clone;
}

/** Content of a column in document order: images (as <p><img></p>) and rich-text blocks. */
function columnContent(document, col) {
  const out = [];
  col.querySelectorAll('.author-image-styling img, .image img, .author-rte-styling').forEach((node) => {
    if (node.tagName === 'IMG') {
      const img = fixImage(document, node);
      if (img && !out.some((o) => o.querySelector && o.querySelector(`img[src="${img.getAttribute('src')}"]`))) {
        const p = document.createElement('p');
        p.append(img);
        out.push(p);
      }
      return;
    }
    [...node.children].forEach((child) => {
      if (child.matches(CONTENT_TAGS) && child.textContent.trim()) out.push(cleanClone(child));
    });
  });
  return out;
}

export default function parse(element, { document }) {
  // Two column containers: element > div > div > .gridlayoutcontainer (x2)
  let cols = [...element.querySelectorAll(':scope > div > div > .gridlayoutcontainer')];
  if (cols.length < 2) {
    cols = [...element.querySelectorAll('.gridlayoutcontainer')]
      .filter((c) => c.parentElement && c.parentElement.parentElement
        && c.parentElement.parentElement.parentElement === element);
  }
  const asideCol = cols.find((c) => c.matches('.grid__bg-color--midnight-purple')
    || c.querySelector('.grid__bg-color--midnight-purple'));
  const mainCol = cols.find((c) => c !== asideCol);

  const mainCell = mainCol ? columnContent(document, mainCol) : [];
  const asideCell = asideCol ? columnContent(document, asideCol) : [];

  if (!mainCell.length && !asideCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[mainCell.length ? mainCell : '', asideCell.length ? asideCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-sidebar', cells });
  element.replaceWith(block);
}
