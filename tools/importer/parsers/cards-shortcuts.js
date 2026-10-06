/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-shortcuts. Base: cards. Source: https://www.truist.com/
 * Selectors validated against migration-work/block-context/cards-shortcuts/source.html
 *
 * Output (per blocks/cards-shortcuts/README.md): one row per tile,
 *   [icon image | <p><a href>Label</a></p>]
 * Iterates the <li> slide wrappers (not the anchors) to avoid inline-anchor merging;
 * Splide clone slides are skipped.
 */
export default function parse(element, { document }) {
  let items = [...element.querySelectorAll('li.splide__slide, .item-slider-items > li')]
    .filter((li, i, arr) => arr.indexOf(li) === i)
    .filter((li) => !li.classList.contains('splide__slide--clone'));
  if (!items.length) {
    // Fallback: anchors directly
    items = [...element.querySelectorAll('a.item-slider-card-link')];
  }

  const cells = [];
  const seen = new Set();
  items.forEach((item) => {
    const a = item.matches('a') ? item : item.querySelector('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    const labelEl = item.querySelector('.item-slider-thumb-text');
    const label = (labelEl ? labelEl.textContent : a.textContent).replace(/\s+/g, ' ').trim();
    const key = `${href}|${label}`;
    if (seen.has(key)) return;
    seen.add(key);

    const img = item.querySelector('img');
    if (img) {
      img.alt = img.alt || '';
      // helix-importer converts any <img src="*.svg"> into a :icon: token; the block JS
      // needs a real <picture>, so keep the SVG as an image by not ending src in ".svg".
      const src = img.getAttribute('src') || '';
      if (/\.svg$/i.test(src)) img.setAttribute('src', `${src}?img=1`);
    }
    const link = document.createElement('a');
    link.href = href;
    link.textContent = label;
    const p = document.createElement('p');
    p.append(link);
    cells.push([img || '', p]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-shortcuts', cells });
  element.replaceWith(block);
}
