/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-intro-list. Base: columns. Source: https://www.truist.com/
 * Selectors validated against migration-work/block-context/columns-intro-list/source.html
 *
 * Output (per blocks/columns-intro-list/README.md): 1 row, 2 columns:
 *   [<p>icon</p><h2>intro heading</h2><p>body</p>
 *    | <p>eyebrow</p><h3>heading</h3><p>body</p><p><a>Learn more</a></p><hr> ...repeated]
 * Items in column 2 are the .card wrappers (block-level), separated by <hr>.
 */
function fixImage(img) {
  if (!img) return img;
  // Live page lazy-loads: src is a data: placeholder, real URL is in data-src
  const lazy = img.getAttribute('data-src');
  if (lazy && (img.getAttribute('src') || '').startsWith('data:')) img.setAttribute('src', lazy);
  img.removeAttribute('data-src');
  // helix-importer turns <img src="*.svg"> into :icon: tokens; keep it a real image
  const src = img.getAttribute('src') || '';
  if (/\.svg$/i.test(src)) img.setAttribute('src', `${src}?img=1`);
  return img;
}

function cleanLink(document, a) {
  const link = document.createElement('a');
  link.href = a.getAttribute('href') || a.href;
  const clone = a.cloneNode(true);
  clone.querySelectorAll('.sr-only, .visually-hidden, img, svg').forEach((n) => n.remove());
  link.textContent = clone.textContent.replace(/\s+/g, ' ').trim();
  return link;
}

function cardContent(document, card, headingTag) {
  const out = [];
  const body = card.querySelector('.card-body') || card;
  const eyebrow = body.querySelector('.eyebrow');
  if (eyebrow && eyebrow.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = eyebrow.textContent.trim();
    out.push(p);
  }
  const heading = body.querySelector('.heading, .subheading, h2, h3, h4');
  if (heading && heading.textContent.trim()) {
    const h = document.createElement(headingTag);
    h.textContent = heading.textContent.trim();
    out.push(h);
  }
  body.querySelectorAll('.card-text').forEach((t) => {
    t.querySelectorAll('.sr-only, .visually-hidden').forEach((n) => n.remove());
    if (!t.textContent.trim()) return;
    const p = document.createElement('p');
    p.append(...t.childNodes);
    out.push(p);
  });
  card.querySelectorAll('.card-footer a[href]').forEach((a) => {
    const p = document.createElement('p');
    p.append(cleanLink(document, a));
    out.push(p);
  });
  return out;
}

export default function parse(element, { document }) {
  const cols = [...element.querySelectorAll(':scope > div > .aem-Grid > .gridlayoutcontainer')];
  const introCol = cols[0] || element;
  const listCol = cols[1] || null;

  // Column 1: intro (icon, heading, body)
  const introCell = [];
  const introCard = introCol.querySelector('.card');
  if (introCard) {
    const icon = fixImage(introCard.querySelector(':scope > img, .card-img-icon-default, img'));
    if (icon) {
      const p = document.createElement('p');
      p.append(icon);
      introCell.push(p);
    }
    introCell.push(...cardContent(document, introCard, 'h2'));
  }

  // Column 2: stacked items separated by <hr>
  const listCell = [];
  const cards = listCol ? [...listCol.querySelectorAll('.staticcardv2 .card, .staticcard .card')]
    .filter((c, i, arr) => arr.indexOf(c) === i) : [];
  cards.forEach((card, i) => {
    const content = cardContent(document, card, 'h3');
    if (!content.length) return;
    if (listCell.length) listCell.push(document.createElement('hr'));
    listCell.push(...content);
  });

  if (!introCell.length && !listCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[introCell, listCell.length ? listCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-intro-list', cells });
  element.replaceWith(block);
}
