/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-app-promo. Base: columns. Source: https://www.truist.com/
 * Selectors validated against migration-work/block-context/columns-app-promo/source.html
 *
 * Output (per blocks/columns-app-promo/README.md): 1 row, 2 columns:
 *   [phone image | <p>eyebrow</p><h2>heading</h2><p>body + footnotes</p><p><a>CTA</a></p>
 *                  <p>QR image</p><p>QR caption</p> (+ optional store badge links)]
 */
function keepSvgAsImage(img) {
  if (!img) return img;
  // helix-importer turns <img src="*.svg"> into :icon: tokens; keep it a real image
  const src = img.getAttribute('src') || '';
  if (/\.svg$/i.test(src)) img.setAttribute('src', `${src}?img=1`);
  return img;
}

function realImage(img) {
  if (!img) return null;
  const lazy = img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
  const src = img.getAttribute('src') || '';
  if (src.startsWith('data:')) {
    if (!lazy) return null;
    img.setAttribute('src', lazy);
  }
  img.removeAttribute('data-src');
  img.removeAttribute('data-lazy-src');
  return keepSvgAsImage(img);
}

export default function parse(element, { document }) {
  const grids = [...element.querySelectorAll(':scope > .aem-Grid > .gridlayoutcontainer')];
  const mediaCol = grids[0] || element;
  const textCol = grids[1] || element;

  // Column 1: phone image
  const phoneImg = realImage(mediaCol.querySelector('.image img, img'));

  // Column 2: text content
  const content = [];
  const eyebrowEl = textCol.querySelector('.text__type--eyebrow h2, .text__type--eyebrow h3, .text__type--eyebrow p, .text__type--eyebrow');
  if (eyebrowEl && eyebrowEl.textContent.trim()) {
    const p = document.createElement('p');
    p.textContent = eyebrowEl.textContent.trim();
    content.push(p);
  }

  const textBlocks = [...textCol.querySelectorAll('.text:not(.text__type--eyebrow) .author-rte-styling')];
  textBlocks.forEach((tb) => {
    tb.querySelectorAll('.sr-only, .visually-hidden').forEach((n) => n.remove());
    [...tb.children].forEach((child) => {
      if (!child.textContent.trim()) return;
      if (/^H[1-6]$/.test(child.tagName)) {
        const h2 = document.createElement('h2');
        h2.textContent = child.textContent.trim();
        content.push(h2);
      } else {
        content.push(child);
      }
    });
  });

  // CTA
  textCol.querySelectorAll('.cta a[href]').forEach((a) => {
    a.querySelectorAll('.sr-only, .visually-hidden').forEach((n) => n.remove());
    const link = document.createElement('a');
    link.href = a.getAttribute('href');
    link.textContent = a.textContent.replace(/\s+/g, ' ').trim();
    const p = document.createElement('p');
    p.append(link);
    content.push(p);
  });

  // QR code card: image + caption
  const qrCard = textCol.querySelector('.staticcardv2, .staticcard');
  if (qrCard) {
    const qrImg = realImage(qrCard.querySelector('img'));
    if (qrImg) {
      const p = document.createElement('p');
      p.append(qrImg);
      content.push(p);
    }
    const caption = qrCard.querySelector('.card-text');
    if (caption && caption.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = caption.textContent.replace(/\s+/g, ' ').trim();
      content.push(p);
    }
  }

  // Optional app store badges (image links), only when real image sources exist
  const badgeLinks = [...textCol.querySelectorAll('.app-store-mobile-view a[href]')]
    .map((a) => ({ a, img: realImage(a.querySelector('img')) }))
    .filter(({ img }) => img);
  if (badgeLinks.length) {
    const p = document.createElement('p');
    badgeLinks.forEach(({ a, img }) => {
      const link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.append(img);
      p.append(link);
    });
    content.push(p);
  }

  if (!phoneImg && !content.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[phoneImg || '', content]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-app-promo', cells });
  element.replaceWith(block);
}
