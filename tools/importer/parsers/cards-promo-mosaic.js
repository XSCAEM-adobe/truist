/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-promo-mosaic. Base: cards. Source: https://www.truist.com/
 * Selectors validated against migration-work/block-context/cards-promo-mosaic/source.html
 *
 * Output (per blocks/cards-promo-mosaic/README.md): one row per promo card, 2 columns:
 *   [optional image | <p>eyebrow</p><h2>heading</h2><p>body</p> CTAs]
 * CTAs: btn-primary -> <p><strong><a></a></strong></p>, others -> <p><a></a></p>
 * (one CTA per paragraph so the block JS groups them into its actions row).
 */
function cleanLink(document, a) {
  const link = document.createElement('a');
  link.href = a.getAttribute('href') || a.href;
  const clone = a.cloneNode(true);
  clone.querySelectorAll('.sr-only, .visually-hidden, img, svg').forEach((n) => n.remove());
  link.textContent = clone.textContent.replace(/\s+/g, ' ').trim();
  return link;
}

export default function parse(element, { document }) {
  // Each promo is a .card wrapper (block-level div) inside .staticcardv2
  let cards = [...element.querySelectorAll('.staticcardv2 .card, .staticcard > div > .card')]
    .filter((c, i, arr) => arr.indexOf(c) === i);
  if (!cards.length) cards = [...element.querySelectorAll('.card')];

  const cells = [];
  cards.forEach((card) => {
    const body = card.querySelector('.card-body') || card;
    const eyebrowEl = body.querySelector('.eyebrow');
    const headingEl = body.querySelector('.heading, h1, h2, h3, h4');
    const textEls = [...body.querySelectorAll('p.card-text, .card-text')]
      .filter((p, i, arr) => arr.indexOf(p) === i);

    const content = [];
    if (eyebrowEl && eyebrowEl.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = eyebrowEl.textContent.trim();
      content.push(p);
    }
    if (headingEl && headingEl.textContent.trim()) {
      const h2 = document.createElement('h2');
      h2.textContent = headingEl.textContent.trim();
      content.push(h2);
    }
    textEls.forEach((t) => {
      t.querySelectorAll('.sr-only, .visually-hidden').forEach((n) => n.remove());
      const p = document.createElement('p');
      p.append(...t.childNodes);
      content.push(p);
    });

    const ctas = [...card.querySelectorAll('.card-footer a[href], .cta-container a[href]')]
      .filter((a, i, arr) => arr.indexOf(a) === i);
    ctas.forEach((a) => {
      const p = document.createElement('p');
      const link = cleanLink(document, a);
      if (a.classList.contains('btn-primary')) {
        const strong = document.createElement('strong');
        strong.append(link);
        p.append(strong);
      } else {
        p.append(link);
      }
      content.push(p);
    });

    if (!content.length) return;
    // Image is a direct child of .card (not inside .card-body)
    const img = card.querySelector(':scope > img, :scope > picture img, .card-img-top');
    cells.push([img || '', content]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-promo-mosaic', cells });
  element.replaceWith(block);
}
