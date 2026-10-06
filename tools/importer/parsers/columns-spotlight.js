/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-spotlight. Base: columns. Source: https://www.truist.com/
 * Selectors validated against migration-work/block-context/columns-spotlight/source.html
 *
 * Output (per blocks/columns-spotlight/README.md): 1 row, 2 columns:
 *   [team photo | <p>logo lockup image</p><h2>heading</h2><p>body</p><p><strong><a>CTA</a></strong></p>]
 */
function keepSvgAsImage(img) {
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

export default function parse(element, { document }) {
  const cols = [...element.querySelectorAll(':scope > .gridlayoutcontainer')];
  const mediaCol = cols[0] || element;
  const textCol = cols[1] || element;

  const photo = mediaCol.querySelector('.image img, img');
  if (photo) keepSvgAsImage(photo);

  const content = [];
  const logo = textCol.querySelector('.image img');
  if (logo && logo !== photo) {
    keepSvgAsImage(logo);
    const p = document.createElement('p');
    p.append(logo);
    content.push(p);
  }

  const headingEl = textCol.querySelector('h1, h2, h3, h4');
  if (headingEl) {
    const h2 = document.createElement('h2');
    h2.textContent = headingEl.textContent.trim();
    content.push(h2);
  }
  textCol.querySelectorAll('.text .author-rte-styling > p, .text .author-rte-styling > ul, .text .author-rte-styling > ol')
    .forEach((n) => {
      n.querySelectorAll('.sr-only, .visually-hidden').forEach((s) => s.remove());
      if (n.textContent.trim()) content.push(n);
    });

  textCol.querySelectorAll('.cta a[href]').forEach((a) => {
    a.querySelectorAll('.sr-only, .visually-hidden').forEach((n) => n.remove());
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = a.textContent.replace(/\s+/g, ' ').trim();
    const strong = document.createElement('strong');
    strong.append(link);
    const p = document.createElement('p');
    p.append(strong);
    content.push(p);
  });

  if (!photo && !content.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[photo || '', content]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-spotlight', cells });
  element.replaceWith(block);
}
