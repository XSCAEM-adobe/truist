/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-offer. Base: cards. Source: https://www.truist.com/
 * Selectors validated against migration-work/block-context/cards-offer/source.html
 *
 * Output (per blocks/cards-offer/README.md): one row per card, 1 column:
 *   [<p>eyebrow</p><h3>heading</h3><p>body (+ inline link/footnote)</p>
 *    <p><em><a>outlined CTA</a></em></p><p><a>Learn more</a></p>]
 * btn-secondary (outlined) CTAs -> <em>; btn-minimal -> plain link.
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
  let cards = [...element.querySelectorAll('.staticcardv2 .card')];
  if (!cards.length) cards = [...element.querySelectorAll('.card')];

  const cells = [];
  cards.forEach((card) => {
    const body = card.querySelector('.card-body') || card;
    const eyebrowEl = body.querySelector('.eyebrow');
    const headingEl = body.querySelector('.subheading, .heading, h2, h3, h4');
    const textEls = [...body.querySelectorAll('.card-text')];

    const content = [];
    if (eyebrowEl && eyebrowEl.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = eyebrowEl.textContent.trim();
      content.push(p);
    }
    if (headingEl && headingEl.textContent.trim()) {
      const h3 = document.createElement('h3');
      h3.textContent = headingEl.textContent.trim();
      content.push(h3);
    }
    textEls.forEach((t) => {
      t.querySelectorAll('.sr-only, .visually-hidden').forEach((n) => n.remove());
      if (!t.textContent.trim()) return;
      const p = document.createElement('p');
      p.append(...t.childNodes);
      content.push(p);
    });

    const ctas = [...card.querySelectorAll('.card-footer a[href]')];
    ctas.forEach((a) => {
      const p = document.createElement('p');
      const link = cleanLink(document, a);
      if (a.classList.contains('btn-primary') || a.classList.contains('btn-secondary')) {
        const em = document.createElement('em');
        em.append(link);
        p.append(em);
      } else {
        p.append(link);
      }
      content.push(p);
    });

    if (content.length) cells.push([content]);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-offer', cells });
  element.replaceWith(block);
}
